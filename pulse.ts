/**
 * Functions to operate the LeagueIR controller
 */

//% color=#f44242 icon="\uf185"
namespace leagueir {

    export let irError = "";

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
            

    const AGC_MARK = 9000; // AGC MARK = 9ms
    const AGC_MARK_MAX = AGC_MARK + 500;
    const AGC_MARK_MIN = AGC_MARK - 500;
    const AGC_SPACE = 4500; // AGC SPACE = 4.5ms
    const AGC_SPACE_MAX = AGC_SPACE + 500;
    const AGC_SPACE_MIN = AGC_SPACE - 500;

    const ONE_BIT = 2250;     // total length of a 1 bit
    const ZERO_BIT = 1120;    // total length of a 0 bit
    const BIT_MARK = 560;     // 560us mark for all bits

    const BIT_MARK_MAX = BIT_MARK + 75;
    const BIT_MARK_MIN = BIT_MARK - 120;

    const ZERO_SPACE = ZERO_BIT - BIT_MARK;    // 560us space for '0'
    const ZERO_SPACE_MAX = ZERO_SPACE + 150;    // 760us max for '0'
    const ZERO_SPACE_MIN = ZERO_SPACE - 170;    // 460us min for '0'

    const ONE_SPACE = ONE_BIT - BIT_MARK;      // 1.69ms space for '1'
    const ONE_SPACE_MAX = ONE_SPACE + 150;      // 1.89ms max for '1'
    const ONE_SPACE_MIN = ONE_SPACE - 170;      // 1.64ms min for '1'
    const STOP_BIT = 560;                      // Final 560us mark


    // Constants for pin states
    const IR_HIGH = 0; // IR LED is considered "high" when the digital pin reads 0
    const IR_LOW = 1;  // IR LED is considered "low" when the digital pin reads 1


    /**
     * 
     */
    //% shim=leagueir::timePulse
    function timePulse(pin: number, state: number, timeout: number): number {
        return 0
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
    /**
    * Read an NEC format IR command on a digital pin
     */
    //% blockId="leagueir_read_pulse" 
    //% block="Read NEC format IR code from pin %pin"
    //% weight=55
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% dp.fieldEditor="gridpicker" dp.fieldOptions.columns=4
    //% dp.fieldOptions.tooltips="false" dp.fieldOptions.width="300"
    //% group="IR Commands"
    export function readNecCode(pin: DigitalPin): number {

        // Configure pins
        pins.setPull(pin, PinPullMode.PullUp);  // Use pull-up resistor on the input pin

        while (true) {

            if (!leagueir.readACGHeader(pin)) {
                continue;
            }

            let n = 0;
            let b = 0;

            for (let i = 0; i < 32; i++) {
           
                b = leagueir.readNecBit(pin);
                if (b < 0) {
                    return 0
               
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
    /**
     * Start listening for NEC IR commands in the background
     * @param pin the digital pin to receive IR commands from
     * @param dp debug pin for timing visualization
     * @param handler function to call when a command is received
     */
    //% blockId="leagueir_on_nec_received" 
    //% block="on NEC received from pin %pin with debug pin %dp"
    //% weight=54
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% group="IR Commands"
    export function onNECReceived(pin: DigitalPin, handler: (address: number, command: number) => void): void {
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
     * Send an NEC format IR command on a digital pin
     * @param pin the digital pin to send command on
     * @param address the 16-bit address to send
     * @param command the 16-bit command to send
     * @param carrierFreqKHz the carrier frequency in kHz (typically 38kHz for IR)
     */
    //% blockId="leagueir_send_command" 
    //% block="send NEC address %address command %command on pin %pin with %carrierFreqKHz kHz carrier"
    //% weight=70
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% address.min=0 address.max=65535 address.defl=0xFF00
    //% command.min=0 command.max=65535 command.defl=0xFF00
    //% carrierFreqKHz.min=30 carrierFreqKHz.max=50 carrierFreqKHz.defl=38
    //% group="IR Commands"
    export function sendCommand(pin: DigitalPin, address: number, command: number): void {
        // Combine address (upper 16 bits) and command (lower 16 bits) into 32-bit value
        let combined = ((address & 0xFFFF) << 16) | (command & 0xFFFF);
        sendCommandCpp(pin as number, combined)
    }


    /**
     * Function used for simulator, actual implementation is in pulse.cpp
     * @param pin the digital pin number
     * @param command the 32-bit command to send
     * @param carrierFreqKHz the carrier frequency in kHz
     */
    //% shim=leagueir::sendCommand
    function sendCommandCpp(pin: number, command: number): void {
        // Simulator implementation would go here
    }

}
