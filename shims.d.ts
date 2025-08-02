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

    /**
     * Read a full NEC code from the IR signal
     * @param pin the digital pin to read from
     * @param timeout timeout in milliseconds (default 1000)
     * @returns the 32-bit NEC code, or 0 on error
     */
    //% timeout.defl=1000 shim=leagueir::readNecCode
    function readNecCode(pin: int32, timeout?: int32): uint32;
}

// Auto-generated. Do not edit. Really.
