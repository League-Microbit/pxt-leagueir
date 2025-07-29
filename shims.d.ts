// Auto-generated. Do not edit.


    /**
     * LeagueIR NEC IR CCode Transmitter
     *
     * Send and receive NEC format IR commands using an IR LED and IR receiver module.
     *
     * Uses PWM to generate a 38kHz carrier frequency for the IR LED.
     * Uses timing loops to read the IR receiver output.
     */

declare namespace leagueir {

    /** Calibrate the timing by determining how much time per loop we spend
     * doing things that are not sleeping
     */
    //% shim=leagueir::calibrate
    function calibrate(pin: int32): int32;

    /**
     * Send an IR bit using analog output.
     * @param pin The pin number to send on
     * @param highTime Microseconds to send carrier signal
     * @param lowTime Microseconds to send no signal
     */
    //% shim=leagueir::sendIrBitAnalogPn
    function sendIrBitAnalogPn(pin: int32, highTime: int32, lowTime: int32): void;

    /**
     * Send an IR bit using digital output.
     * @param pin The pin number to send on
     * @param highTime Microseconds to send high signal
     * @param lowTime Microseconds to send low signal
     */
    //% shim=leagueir::sendIrBitDigitalPn
    function sendIrBitDigitalPn(pin: int32, highTime: int32, lowTime: int32): void;

    /**
     * Send an NEC format IR command.
     * @param pin The pin number to send on
     * @param address 16-bit address
     * @param command 16-bit command
     */
    //% shim=leagueir::sendIrAddressCommand
    function sendIrAddressCommand(pin: int32, address: int32, command: int32): void;

    /**
     * Send an IR code using the specified pin.
     * @param pin The pin number to send on
     * @param code 32-bit code to send (upper 16 bits = address, lower 16 bits = command)
     */
    //% shim=leagueir::sendIrCode
    function sendIrCode(pin: int32, code: int32): void;

    /**
     * Time one pulse.
     * @param pin The pin number to read from
     * @param state The state to wait for (0 or 1)
     * @param timeout Timeout in microseconds
     * @returns Pulse duration in microseconds, or negative value on error
     */
    //% shim=leagueir::timePulse
    function timePulse(pin: int32, state: int32, timeout: int32): int32;
}

// Auto-generated. Do not edit. Really.
