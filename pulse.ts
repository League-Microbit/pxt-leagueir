/**
 * Functions to operate the LeaguePulse controller
 */

//% color=#f44242 icon="\uf185"
namespace leaguepulse {

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
    export function generatePulsesCpp(pin: DigitalPin, delay: number, count: number): void {
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
    export function generatePulsesTs(pin: DigitalPin, delay: number, count: number): void {
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
     * Send a PWM command on a digital pin
     * @param pin the digital pin to send command on
     * @param command the 32-bit command to send
     * @param periodMs the period in milliseconds for PWM timing, 26 == 38kHz
     */
    //% blockId="leaguepulse_send_command" 
    //% block="send command %command on pin %pin with %periodMs ms period"
    //% weight=70
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% command.min=0 command.max=4294967295 command.defl=0xFF00FF00
    //% periodUs.min=1 periodUs.max=100 periodUs.defl=10
    //% group="PWM Commands"
    export function sendCommand(pin: DigitalPin, command: number, periodUs: number = 26): void {
        sendCommandCpp(pin as number, command, periodUs)
    }

    /**
     * Function used for simulator, actual implementation is in pulse.cpp
     * @param pin the digital pin number
     * @param delay delay in microseconds for each high and low state (int16_t)
     * @param count number of pulses to generate (int32_t)
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
     * @param periodUs the period in microseconds
     */
    //% shim=leaguepulse::sendCommand
    function sendCommandCpp(pin: number, command: number, periodUs: number): void {
        // Simulator implementation would go here
    }


}
