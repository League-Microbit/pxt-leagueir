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
    //% blockId="leaguepulse_pulse" 
    //% block="generate %count pulses on pin %pin with %delay μs delay"
    //% weight=100
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% delay.min=1 delay.max=65535 delay.defl=1000
    //% count.min=1 count.max=1000 count.defl=10
    //% group="Pulse Generation"
    export function generatePulses(pin: DigitalPin, count: number, delay: number): void {
        pulse(pin as number, delay, count)
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


}
