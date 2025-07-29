



namespace leagueir {

    const AGC_MARK = 9000;                 // AGC MARK = 9000µs (9ms)
    const AGC_MARK_MAX = AGC_MARK + 500;  // AGC MARK MAX = 9500µs
    const AGC_MARK_MIN = AGC_MARK - 500;  // AGC MARK MIN = 8500µs

    const AGC_SPACE = 4500;               // AGC SPACE = 4500µs (4.5ms)
    const AGC_SPACE_MAX = AGC_SPACE + 500; // AGC SPACE MAX = 5000µs
    const AGC_SPACE_MIN = AGC_SPACE - 500; // AGC SPACE MIN = 4000µs

    const ONE_BIT = 2250;                 // ONE BIT total = 2250µs
    const ZERO_BIT = 1120;                // ZERO BIT total = 1120µs
    const BIT_MARK = 560;                 // BIT MARK = 560µs

    const BIT_MARK_MAX = BIT_MARK + 75;   // BIT MARK MAX = 635µs
    const BIT_MARK_MIN = BIT_MARK - 120;  // BIT MARK MIN = 440µs

    const ZERO_SPACE = ZERO_BIT - BIT_MARK;       // ZERO SPACE = 560µs
    const ZERO_SPACE_MAX = ZERO_SPACE + 150;      // ZERO SPACE MAX = 710µs
    const ZERO_SPACE_MIN = ZERO_SPACE - 170;      // ZERO SPACE MIN = 390µs

    const ONE_SPACE = ONE_BIT - BIT_MARK;         // ONE SPACE = 1690µs
    const ONE_SPACE_MAX = ONE_SPACE + 150;        // ONE SPACE MAX = 1840µs
    const ONE_SPACE_MIN = ONE_SPACE - 200;        // ONE SPACE MIN = 1490µs

    const STOP_BIT = 560;                 // STOP BIT = 560µs

    // Constants for pin states
    const IR_HIGH = 0; // IR LED is considered "high" when the digital pin reads 0
    const IR_LOW = 1; // IR LED is considered "low" when the digital pin reads 1


    export enum Address {
        RadioChannel = 0xD00D, // Radio channel and radio group 
    }


    // Status codes for IR packets
    export enum IrStatus {
        NONE = 0,
        REQUEST = 1,
        ACK = 2,
        NACK = 3
    }

    // Command codes for IR packets
    export enum IrCommand {
        PAIR = 0,
        IAM = 1
    }



    /* Scramble the machine id and return the last 12 bits,
    * to be used as a unique identifier, particularly useful for the IR packet
    * ID value. */

    function getUniqueId(): number {
        let machineId = control.deviceSerialNumber();
        let scrambledId = irlib.murmur_32_scramble(machineId);
        // Return the last 12 bits
        return scrambledId & 0xFFF;
    }  


    export let irError = "";

    /*
    */
    //% shim=leagueir::timePulse
    export function timePulse_cpp(pin: number, state: number, timeout: number): number {
        // Simulator implementation would go here
        return 0;
    }


    //% shim=leagueir::sendIrBitDigitalPn
    export function sendIrBitDigital(pin: number, highTime: number, lowTime: number): void {

    }

    //% shim=leagueir::sendIrBitAnalogPn
    export function sendIrBitAnalog(pin: number, highTime: number, lowTime: number): void {

    }


    //% shim=leagueir::sendIrAddressCommand
    export function sendIrAddressCommand_cpp(pin: number, address: number, command: number): void {
        
    }

    //% shim=leagueir::sendIrCode
    export function sendIrCode_cpp(pin: number, code: number): void {
        
    }

    //% shim=leagueir::calibrate
    export function calibrate_cpp(pin: number): number {
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


    export function readNecCode(pin: DigitalPin, timeout?: number): number {

        // Configure pins
        pins.setPull(pin, PinPullMode.PullUp); // Use pull-up resistor on the input pin

        let startTime = input.runningTime();

        if (timeout === undefined) {
            timeout = 1000; // Default timeout of 1 second
        }

        while (true) {

            if (input.runningTime() - startTime > timeout) {
                irError = "Timeout waiting for NEC code";
                return 0; // Timeout
            }

            if (!leagueir.readACGHeader(pin)) {
                continue;
            }

            let n = 0;
            let b = 0;
            // Use the same byte order as sendCommand: [3,2,1,0]
            const byteOrder = [2, 3, 0, 1];
            let bytes: number[] = [0, 0, 0, 0];
            for (let i = 0; i < 4; i++) {
                let byteVal = 0;
                // For each bit in the byte (LSB first)
                for (let bit = 0; bit < 8; bit++) {
                    b = leagueir.readNecBit(pin);
                    if (b < 0) {
                        return 0;
                    }
                    if (b) {
                        byteVal |= (1 << bit); // LSB first within byte
                    } else {
                        byteVal &= ~(1 << bit);
                    }
                }
                bytes[byteOrder[i]] = byteVal & 0xFF;
            }
            // Reconstruct the 32-bit value from the bytes
            n = (bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0];

            // read the final stop bit
            let pulseTime = timePulse(pin, 1, STOP_BIT + 200);
            if (pulseTime < STOP_BIT - 200 || pulseTime > STOP_BIT + 200) {
                irError = "Invalid stop bit duration: " + pulseTime;
                return 0;
            }

            return n;

        }
    }

    //% 
    export function readNecAddressCommand(pin: DigitalPin, timeout?: number): [number, number] {
        let result = leagueir.readNecCode(pin, timeout);

        // Split the 32-bit result into address and command
        let address = (result >> 16) & 0xFFFF; // High 16 bits
        let command = result & 0xFFFF;         // Low 16 bit

        //serial.writeLine("Read NEC Address: " + irlib.toHex(result) + " " + irlib.toHex(address) + ", Command: " + irlib.toHex(command));

        return [address, command];
    }

    //% 
    export function onNecReceived(pin: DigitalPin, handler: (address: number, command: number) => void): void {
        control.inBackground(() => {
            while (true) {
                let [address, command] = readNecAddressCommand(pin);

                if (address != 0) {
                    handler(address, command);
                }

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
                    let expectedCrc = CRC8.fromNumber(result & 0xFFFFFF00);

                    // Call handler with extracted values (including received CRC for verification)
                    if (crc8 !== expectedCrc) {
                        irError = "CRC mismatch: from " + irlib.toHex(result) + ", expected " + irlib.toHex(expectedCrc) + ", got " + irlib.toHex(crc8);
                        serial.writeLine("E: " + irError);
                        continue; // Skip this packet if CRC does not match
                    }
                    handler(id, status, command, value);
                }

                // Small delay before next reading
                basic.pause(10);
            }
        });
    }



    /**
     * Send a custom IR packet with id, status, command, and value
     * @param pin the digital pin to send on
     * @param id the 12-bit device ID (0-4095)
     * @param status the 4-bit status value (0-15)
     * @param command the 4-bit command value (0-15)
     * @param value the 4-bit value (0-15)
     */


    function packPacket(id: number, status: number, command: number, value: number, crc: number): number {
        // Mask inputs to ensure they fit in their bit allocations
        let maskedId = id & 0xFFF;        // 12 bits
        let maskedStatus = status & 0xF;   // 4 bits
        let maskedCommand = command & 0xF; // 4 bits
        let maskedValue = value & 0xF;     // 4 bits
        
        // Pack the first 24 bits (all data fields: id + status + command + value)
        return  (maskedId << 20) | (maskedStatus << 16) | (maskedCommand << 12) | ( maskedValue << 8) | crc; // Include CRC in the final packet
    }

    export function sendIRPacket(pin: DigitalPin, id: number, status: number, command: number, value: number): void {

        if (id == 0) {
            id = getUniqueId(); // Use unique ID if id is 0
        }

        let packet = packPacket(id, status, command, value, 0);
        // Calculate CRC8 for the 24-bit data
        let crc8 = CRC8.fromNumber(packet & 0xFFFFFF00); 
        
        packet = packet | (crc8 & 0xFF); // Include CRC in the final packet
        
        // Send the packet
        serial.writeLine("Sending IR Packet: " + irlib.toHex(packet));
        leagueir.sendIrCode_cpp(pin, packet);
    }


}