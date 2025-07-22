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
