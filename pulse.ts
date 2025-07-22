/**
 * Functions to operate the LeaguePulse controller
 */

//% color=#f44242 icon="\uf185"
namespace leaguepulse {

    let n = 0; // Global variable to store the pulse reading result

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
    const BIT_MARK_MIN = BIT_MARK - 75;

    const ZERO_SPACE = ZERO_BIT - BIT_MARK;    // 560us space for '0'
    const ZERO_SPACE_MAX = ZERO_SPACE + 150;    // 760us max for '0'
    const ZERO_SPACE_MIN = ZERO_SPACE - 150;    // 460us min for '0'

    const ONE_SPACE = ONE_BIT - BIT_MARK;      // 1.69ms space for '1'
    const ONE_SPACE_MAX = ONE_SPACE + 150;      // 1.89ms max for '1'
    const ONE_SPACE_MIN = ONE_SPACE - 150;      // 1.64ms min for '1'
    const STOP_BIT = 560;                      // Final 560us mark


    /**
     * Reads a pulse signal from a digital pin and decodes it into a numeric value.
     * 
     * This function reads a 32-bit value encoded in pulse-width modulation from the specified pin.
     * It uses an automatic gain control (AGC) mechanism to detect the header pulse, followed by
     * reading 32 data bits. The function toggles a debug pin during processing to facilitate debugging.
     *
     * @param pin - The digital pin to read the pulse signal from
     * @param dp - Debug pin that toggles during signal processing
     * @returns The decoded 32-bit numeric value, or a negative error code:
     */
    //% blockId="leaguepulse_read_pulse" 
    //% block="read pulse from pin %pin with debug pin %dp"
    //% weight=55
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% dp.fieldEditor="gridpicker" dp.fieldOptions.columns=4
    //% dp.fieldOptions.tooltips="false" dp.fieldOptions.width="300"
    //% group="IR Commands"
    export function readNEC(pin: DigitalPin): number {
        let d: number;

        // Reset the value of n for a new reading
        n = 0;

        // Wait for pin to go LOW (0) before starting to read pulses
      
        while (pins.digitalReadPin(pin) === 0) { // pin is inverted
        }

        while (true) {
            d = leaguepulse.timePulse(pin, 1, AGC_MARK_MAX); // header HIGH
            if (d > AGC_MARK_MIN) {
                break
            }
        }

        d  = leaguepulse.timePulse(pin, 0, AGC_SPACE_MAX); // header LOW
        if (d < AGC_SPACE_MIN ) return -2;

        for (let i = 0; i < 32; i++) {

            d = leaguepulse.timePulse(pin, 1, BIT_MARK_MAX); // bit HIGH
            if (d < BIT_MARK_MIN ) return -(10*i) -3;

            d = leaguepulse.timePulse(pin, 0, ONE_SPACE_MAX); // bit LOW
            if (d < ZERO_SPACE_MIN ) return -(10*i) -4;

            // Determine if bit is 0 or 1 based on duration of LOW pulse
            if (d > ONE_SPACE_MIN) {
                // bit is a 1
                n |= (1 << (31 - i));
            } else {
                // bit is a 0
                n &= ~(1 << (31 - i));
            }
    
        }

        d = leaguepulse.timePulse(pin, 1, STOP_BIT + 200); // final HIGH

        return n;
        

    }

    /**
     * Start listening for NEC IR commands in the background
     * @param pin the digital pin to receive IR commands from
     * @param dp debug pin for timing visualization
     * @param handler function to call when a command is received
     */
    //% blockId="leaguepulse_on_nec_received" 
    //% block="on NEC received from pin %pin with debug pin %dp"
    //% weight=54
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% group="IR Commands"
    export function onNECReceived(pin: DigitalPin,  handler: (address: number, command: number) => void): void {
        control.inBackground(() => {
            while (true) {
                let result = readNEC(pin);
                let address: number;
                let command: number;
                
                if (result < 0) {
                    // Error occurred, return address=0 and command=error code
                    address = 0;
                    command = result;
                } else {
                    // Split 32-bit result into high 16 bits (address) and low 16 bits (command)
                    address = (result >> 16) & 0xFFFF;
                    command = result & 0xFFFF;
                }
                
                handler(address, command);
                
                // Small delay before next reading
                basic.pause(10);
            }
        });
    }




    /**
    * Generate pulses on a digital pin
    * @param pin the digital pin to pulse
    * @param count number of pulses to generate
    * @param delay delay in microseconds for each high and low state
    */
    //% blockId="leaguepulse_pulse_c" 
    //% block="generate %count pulses on pin %pin with %delay μs delay, implemented in CPP"
    //% weight=100
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% delay.min=1 delay.max=65535 delay.defl=1000
    //% count.min=1 count.max=1000 count.defl=10
    //% group="Pulse Generation"
    export function generatePulsesCpp(pin: DigitalPin, count: number, delay: number): void {
        pulse(pin as number, delay, count)
    }

    /**
     * Generate pulses on a digital pin (TypeScript implementation)
     * @param pin the digital pin to pulse
     * @param count number of pulses to generate
     * @param delay delay in microseconds for each high and low state
     */
    //% blockId="leaguepulse_pulse_ts" 
    //% block="generate %count pulses on pin %pin with %delay μs delay, implemented in TS"
    //% weight=90
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% delay.min=1 delay.max=65535 delay.defl=1000
    //% count.min=1 count.max=1000 count.defl=10
    //% group="Pulse Generation"
    export function generatePulsesTs(pin: DigitalPin, count: number, delay: number): void {
        for (let i = 0; i < count; i++) {
            pins.digitalWritePin(pin, 1)
            control.waitMicros(delay)
            pins.digitalWritePin(pin, 0)
            control.waitMicros(delay)
        }
    }

    /**
     * Increment the counter and return the new value
     */
    //% blockId="leaguepulse_inc_count" 
    //% block="increment count"
    //% weight=80
    //% group="Counter"
    export function incCount(): number {
        return incCountCpp()
    }

    /**
     * Send an NEC format IR command on a digital pin
     * @param pin the digital pin to send command on
     * @param command the 32-bit NEC command to send
     * @param carrierFreqKHz the carrier frequency in kHz (typically 38kHz for IR)
     */
    //% blockId="leaguepulse_send_command" 
    //% block="send NEC command %command on pin %pin with %carrierFreqKHz kHz carrier"
    //% weight=70
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% command.min=0 command.max=4294967295 command.defl=0xFF00FF00
    //% carrierFreqKHz.min=30 carrierFreqKHz.max=50 carrierFreqKHz.defl=38
    //% group="IR Commands"
    export function sendCommand(pin: DigitalPin, command: number): void {
        sendCommandCpp(pin as number, command)
    }

    /**
     * Receive an NEC format IR command on a digital pin with timeout
     * @param pin the digital pin to receive command from
     * @param timeout timeout in milliseconds to wait for command
     */
    //% blockId="leaguepulse_recv_command" 
    //% block="receive NEC command on pin %pin with %timeout ms timeout"
    //% weight=60
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% timeout.min=1 timeout.max=10000 timeout.defl=1000
    //% group="IR Commands"
    export function recvCommand(pin: DigitalPin, timeout: number): number {
        return recvCommandCpp(pin as number, timeout)
    }

    /**
     * Measure pulse timing on a digital pin
     * @param pin the digital pin to measure pulse on
     * @param timeout timeout in microseconds to wait for pulse
     * @param highMax maximum expected high pulse duration in microseconds
     * @param lowMax maximum expected low pulse duration in microseconds
     */
    //% blockId="leaguepulse_pulse_timer" 
    //% block="measure pulse on pin %pin timeout %timeout μs high max %highMax μs low max %lowMax μs"
    //% weight=50
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% timeout.min=1 timeout.max=100000 timeout.defl=10000
    //% highMax.min=1 highMax.max=50000 highMax.defl=1000
    //% lowMax.min=1 lowMax.max=50000 lowMax.defl=1000
    //% group="Pulse Timing"
    export function pulseTimer(pin: DigitalPin, timeout: number, highMax: number, lowMax: number): number {
        return pulseTimerCpp(pin as number, timeout, highMax, lowMax);
    }

    /**
     * Time a single pulse on a digital pin
     * @param pin the digital pin to measure pulse on
     * @param state the state to wait for (0 for low, 1 for high)
     * @param timeout timeout in microseconds to wait for pulse
     */
    //% blockId="leaguepulse_time_pulse" 
    //% block="time pulse on pin %pin state %state timeout %timeout μs"
    //% weight=49
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% state.min=0 state.max=1 state.defl=1
    //% timeout.min=1 timeout.max=100000 timeout.defl=10000
    //% group="Pulse Timing"
    export function timePulse(pin: DigitalPin, state: number, timeout: number): number {
        return timePulseCpp(pin as number, state, timeout);
    }


    

    /**
     * Function used for simulator, actual implementation is in pulse.cpp
     * @param pin the digital pin number
     * @param state the state to wait for (0 for low, 1 for high)
     * @param timeout timeout in microseconds to wait for pulse
     * @returns the duration of the pulse in microseconds, or 0 if timeout occurs
     */

    //% shim=leaguepulse::pulse
    function pulse(pin: number, delay: number, count: number): void {

    }

    /**
     * Function used for simulator, actual implementation is in pulse.cpp
     */
    //% shim=leaguepulse::incCount
    function incCountCpp(): number {
        return 0
    }

    /**
     * Function used for simulator, actual implementation is in pulse.cpp
     * @param pin the digital pin number
     * @param command the 32-bit command to send
     * @param carrierFreqKHz the carrier frequency in kHz
     */
    //% shim=leaguepulse::sendCommand
    function sendCommandCpp(pin: number, command: number): void {
        // Simulator implementation would go here
    }

    /**
     * Function used for simulator, actual implementation is in pulse.cpp
     * @param pin the digital pin number
     * @param timeout timeout in milliseconds
     */
    //% shim=leaguepulse::recvCommand
    function recvCommandCpp(pin: number, timeout: number): number {
        return 100
    }

    /**
     * Function used for simulator, actual implementation is in pulse.cpp
     * @param pin the digital pin number
     * @param timeout timeout in microseconds
     * @param highMax maximum expected high pulse duration in microseconds
     * @param lowMax maximum expected low pulse duration in microseconds
     */
    //% shim=leaguepulse::pulseSpaceTime
    function pulseTimerCpp(pin: number, timeout: number, highMax: number, lowMax: number): number {
        return 0
    }

    /**
     * 
     */
    //% shim=leaguepulse::timePulse
    function timePulseCpp(pin: number, state: number, timeout: number): number {
        return 0
    }



}
