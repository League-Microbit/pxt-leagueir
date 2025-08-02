

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

namespace irlib {


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

    /* Scramble the input using MurmurHash3. This can scramble the bits of the 
    * id of the Micro:bit, so we can use the last 12 for an id value. */
    export function murmur_32_scramble(k: number): number {
        k = Math.imul(k, 0xcc9e2d51);
        k = (k << 15) | (k >>> 17);  // rotate left 15 (use >>> for unsigned right shift)
        k = Math.imul(k, 0x1b873593);
        return k;
    }


    /* Scramble the machine id and return the last 12 bits,
    * to be used as a unique identifier, particularly useful for the IR packet
    * ID value. */

    export function getUniqueId(): number {
        let machineId = control.deviceSerialNumber();
        let scrambledId = irlib.murmur_32_scramble(machineId);
        // Return the last 12 bits
        return scrambledId & 0xFFF;
    }  


}