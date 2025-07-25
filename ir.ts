

class CRC8 {
  private static table: number[] = CRC8.generateCRCTable(0x07);

  /**
   * Generates a CRC-8 lookup table using the given polynomial
   * @param polynomial Polynomial for CRC (e.g., 0x07 for CRC-8-CCITT)
   */
  private static generateCRCTable(polynomial: number): number[] {
    const table: number[] = [];
    for (let i = 0; i < 256; i++) {
      let curr = i;
      for (let j = 0; j < 8; j++) {
        if ((curr & 0x80) !== 0) {
          curr = (curr << 1) ^ polynomial;
        } else {
          curr <<= 1;
        }
      }
      table[i] = curr & 0xFF;
    }
    return table;
  }

  /**
   * Computes CRC-8 over the input data
   * @param data Input data as number array
   * @param initial Initial CRC value (default 0x00)
   */
  static compute(data: number[], initial = 0x00): number {
    let crc = initial;
    for (let i = 0; i < data.length; i++) {
      crc = CRC8.table[(crc ^ data[i]) & 0xFF];
    }
    return crc;
  }
}

namespace leagueir {

    const AGC_MARK = 9000; // AGC MARK = 9ms
    const AGC_MARK_MAX = AGC_MARK + 500;
    const AGC_MARK_MIN = AGC_MARK - 500;
    const AGC_SPACE = 4500; // AGC SPACE = 4.5ms
    const AGC_SPACE_MAX = AGC_SPACE + 500;
    const AGC_SPACE_MIN = AGC_SPACE - 500;

    const ONE_BIT = 2250; // total length of a 1 bit
    const ZERO_BIT = 1120; // total length of a 0 bit
    const BIT_MARK = 560; // 560us mark for all bits

    const BIT_MARK_MAX = BIT_MARK + 75;
    const BIT_MARK_MIN = BIT_MARK - 120;

    const ZERO_SPACE = ZERO_BIT - BIT_MARK; // 560us space for '0'
    const ZERO_SPACE_MAX = ZERO_SPACE + 150; // 760us max for '0'
    const ZERO_SPACE_MIN = ZERO_SPACE - 170; // 460us min for '0'

    const ONE_SPACE = ONE_BIT - BIT_MARK; // 1.69ms space for '1'
    const ONE_SPACE_MAX = ONE_SPACE + 150; // 1.89ms max for '1'
    const ONE_SPACE_MIN = ONE_SPACE - 170; // 1.64ms min for '1'
    const STOP_BIT = 560; // Final 560us mark

    // Constants for pin states
    const IR_HIGH = 0; // IR LED is considered "high" when the digital pin reads 0
    const IR_LOW = 1; // IR LED is considered "low" when the digital pin reads 1




    export function toHex(num: number): string {
        // Convert to 32-bit unsigned integer
        num = num >>> 0;

        let hex = "";
        const hexChars = "0123456789ABCDEF";

        // Extract each hex digit (4 bits at a time) from right to left
        for (let i = 0; i < 8; i++) {
            hex = hexChars[num & 0xF] + hex;
            num = num >>> 4;
        }


        return hex;
    }


    export let irError = "";

    /*
    */
    //% shim=leagueir::timePulse
    export function timePulse(pin: number, state: number, timeout: number): number {
        // Simulator implementation would go here
        return 0;
    }

    /**
     * Read the AGC header from the IR signal
     * @param pin the digital pin to read from
     * @returns true if a valid AGC header was detected, false otherwise
     */
    export function readACGHeader(pin: DigitalPin): boolean {

        let pulseTime = 0;

        pulseTime = timePulse(pin, 1, AGC_MARK_MAX);
        if (pulseTime > 0 && pulseTime > AGC_MARK_MIN) {
            pulseTime = timePulse(pin, 0, AGC_SPACE_MAX);
            if (pulseTime > 0 && pulseTime > AGC_SPACE_MIN) {
                return true;
            }
        }

        return false;

    }

    /**
     * Read a single bit from the IR signal
     * @param pin the digital pin to read from
     * @returns 1 for a '1' bit, 0 for a '0' bit, -1 for error
     */
    export function readNecBit(pin: DigitalPin): number {

        let pulseTime = 0;

        pulseTime = timePulse(pin, 1, BIT_MARK_MAX + 200);

        if (pulseTime < 0) {
            irError = "Timeout waiting for bit mark";
            return -1;
        }

        if (pulseTime > BIT_MARK_MIN) {

            pulseTime = timePulse(pin, 0, ONE_SPACE_MAX);

            if (pulseTime < 0) {
                irError = "Timeout waiting for one space";
                return -1;
            }

            if (pulseTime > ONE_SPACE_MIN && pulseTime < ONE_SPACE_MAX) {
                return 1;
            } else if (pulseTime > ZERO_SPACE_MIN && pulseTime < ZERO_SPACE_MAX) {
                return 0;
            } else {
                irError = "Invalid space duration: " + pulseTime;
                return -1;
            }

        } else {
            irError = "Invalid mark duration: " + pulseTime;
            return -1;
        }
    }


    export function readNecCode(pin: DigitalPin): number {

        // Configure pins
        pins.setPull(pin, PinPullMode.PullUp); // Use pull-up resistor on the input pin

        while (true) {

            if (!leagueir.readACGHeader(pin)) {
                continue;
            }

            let n = 0;
            let b = 0;

            for (let i = 0; i < 32; i++) {

                b = leagueir.readNecBit(pin);
                if (b < 0) {
                    return 0;

                }

                if (b) {
                    // bit is a 1
                    n |= (1 << (31 - i));
                } else {
                    // bit is a 0
                    n &= ~(1 << (31 - i));
                }
            }

            // read the final stop bit
            let pulseTime = timePulse(pin, 1, STOP_BIT + 200);
            if (pulseTime < STOP_BIT - 200 || pulseTime > STOP_BIT + 200) {
                irError = "Invalid stop bit duration: " + pulseTime;
                return 0;
            }

            return n;

        }
    }
    export function onNecReceived(pin: DigitalPin, handler: (address: number, command: number) => void): void {
        control.inBackground(() => {
            while (true) {
                let result = readNecCode(pin);

                let address: number;
                let command: number;

                if (result == 0) {
                    // Error occurred, return address=0 and command=error code
                    address = 0;
                    command = 0;
                } else {
                    // Split 32-bit result into high 16 bits (address) and low 16 bits (command)
                    address = (result >> 16) & 0xFFFF;
                    command = (result & 0xFFFF);
                }

                handler(address, command);

                // Small delay before next reading
                basic.pause(10);
            }
        });
    }

    /**
     * Listen for custom IR packets in the background
     * @param pin the digital pin to receive IR packets from
     * @param handler function to call when a packet is received with id, status, command, value, and crc8
     */
    export function onIrPacketReceived(pin: DigitalPin, handler: (id: number, status: number, command: number, value: number) => void): void {
        control.inBackground(() => {
            while (true) {
                let result = readNecCode(pin);

                if (result != 0) {
                    // Extract fields from the 32-bit packet
                    let id = (result >> 20) & 0xFFF;      // Bits 31-20: id (12 bits)
                    let status = (result >> 16) & 0xF;    // Bits 19-16: status (4 bits)
                    let command = (result >> 12) & 0xF;   // Bits 15-12: command (4 bits)
                    let value = (result >> 8) & 0xF;      // Bits 11-8: value (4 bits)
                    let crc8 = result & 0xFF;             // Bits 7-0: crc8 (8 bits)

                    // Verify CRC
                    let data24bit = (id << 12) | (status << 8) | (command << 4) | value;
                    let expectedCrc = calculateCRC8(data24bit);
                    
                    // Call handler with extracted values (including received CRC for verification)
                    if (crc8 !== expectedCrc) {
                        irError = "CRC mismatch: expected " + expectedCrc + ", got " + crc8;
                        continue; // Skip this packet if CRC does not match
                    }
                    handler(id, status, command, value);
                }

                // Small delay before next reading
                basic.pause(10);
            }
        });
    }


    /* Function used for simulator, actual implementation is in pulse.cpp
     * @param pin the digital pin number
     * @param command the 32-bit command to send
     */
    //% shim=leagueir::sendCommand
    export function sendCommandCpp(pin: number, command: number): void {
        // Simulator implementation would go here
    }


    export function sendCommand(pin: DigitalPin, address: number, command: number): void {
        
        // Combine address (upper 16 bits) and command (lower 16 bits) into 32-bit value
        let combined = ((address & 0xFFFF) << 16) | (command & 0xFFFF);
        leagueir.sendCommandCpp(pin, combined);
    }

    /**
     * Calculate CRC8 for the given data
     * @param data the 24-bit data to calculate CRC8 for
     * @returns 8-bit CRC value
     */
    function calculateCRC8(data: number): number {
        // Convert 24-bit number to byte array (3 bytes)
        let bytes: number[] = [
            (data >> 16) & 0xFF,  // High byte (bits 23-16)
            (data >> 8) & 0xFF,   // Middle byte (bits 15-8)
            (data & 0xFF)         // Low byte (bits 7-0)
        ];
        
        // Use the CRC8 class to compute the checksum
        return CRC8.compute(bytes);
    }

    /**
     * Send a custom IR packet with id, status, command, and value
     * @param pin the digital pin to send on
     * @param id the 12-bit device ID (0-4095)
     * @param status the 4-bit status value (0-15)
     * @param command the 4-bit command value (0-15)
     * @param value the 4-bit value (0-15)
     */

    export function sendIRPacket(pin: DigitalPin, id: number, status: number, command: number, value: number): void {
        // Mask inputs to ensure they fit in their bit allocations
        let maskedId = id & 0xFFF;        // 12 bits
        let maskedStatus = status & 0xF;   // 4 bits
        let maskedCommand = command & 0xF; // 4 bits
        let maskedValue = value & 0xF;     // 4 bits
        
        // Pack the first 24 bits (all data fields: id + status + command + value)
        let data24bit = (maskedId << 12) | (maskedStatus << 8) | (maskedCommand << 4) | maskedValue;
        
        // Calculate CRC8 for the 24-bit data
        let crc8 = calculateCRC8(data24bit);
        
        // Pack everything into 32-bit value:
        // Bits 31-20: id (12 bits)
        // Bits 19-16: status (4 bits) 
        // Bits 15-12: command (4 bits)
        // Bits 11-8:  value (4 bits)
        // Bits 7-0:   crc8 (8 bits)
        let packet = (maskedId << 20) | (maskedStatus << 16) | (maskedCommand << 12) | (maskedValue << 8) | crc8;
        
        // Send the packet
        leagueir.sendCommandCpp(pin, packet);
    }



}