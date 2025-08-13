
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
    static fromBytes(data: number[], initial = 0x00): number {
        let crc = initial;
        for (let i = 0; i < data.length; i++) {
            crc = CRC8.table[(crc ^ data[i]) & 0xFF];
        }
        return crc;
    }

    static fromNumber(num: number, initial = 0x00): number {
        // Convert number to byte array (4 bytes for 32-bit)
        const bytes: number[] = [
            (num >> 24) & 0xFF,  // Highest byte
            (num >> 16) & 0xFF,  // High byte
            (num >> 8) & 0xFF,   // Middle byte
            num & 0xFF           // Low byte
        ];
        return CRC8.fromBytes(bytes, initial);
    }
    
  
}


namespace leagueir {





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

    /**
     * Listen for custom IR packets in the background
     * @param pin the digital pin to receive IR packets from
     * @param handler function to call when a packet is received with id, status, command, value, and crc8
     */
    export function onIrPacketReceived(pin: DigitalPin, handler: (id: number, status: number, command: number, value: number) => void): void {
        control.inBackground(() => {
            while (true) {
                let result = readNecCode(pin, 1000);

                if (result == undefined) { // Maybe shim not defined
                    // If no valid signal was received, continue to next iteration
                    continue;
                }
                
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
                        //getIrError() = "CRC mismatch: from " + irlib.toHex(result) + ", expected " + irlib.toHex(expectedCrc) + ", got " + irlib.toHex(crc8);
                        serial.writeLine("E: " + getIrError());
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
            id = irlib.getUniqueId(); // Use unique ID if id is 0
        }

        let packet = packPacket(id, status, command, value, 0);
        // Calculate CRC8 for the 24-bit data
        let crc8 = CRC8.fromNumber(packet & 0xFFFFFF00); 
        
        packet = packet | (crc8 & 0xFF); // Include CRC in the final packet
        
        // Send the packet
        serial.writeLine("Sending IR Packet: " + irlib.toHex(packet));
        leagueir.sendIrCode(pin, packet);
    }

}