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
    function calibrate(): number;

    /** Send an IR bit using analog output */
    //% shim=leagueir::sendIrBitAnalogPn
    function sendIrBitAnalogPn(pin: int32, highTime: int32, lowTime: int32): void;

    /** Send an IR bit using digital output */
    //% shim=leagueir::sendIrBitDigitalPn
    function sendIrBitDigitalPn(pin: int32, highTime: int32, lowTime: int32): void;

    /** 
     * Send an NEC format IR command. 
     */
    //% shim=leagueir::sendIrAddressCommand
    function sendIrAddressCommand(pin: int32, address: int32, command: int32): void;

    /** Send an IR code using the specified pin */
    //% shim=leagueir::sendIrCode
    function sendIrCode(pin: int32, code: int32): void;

    /** Time one pulse */
    //% shim=leagueir::timePulse
    function timePulse(pin: int32, state: int32, timeout: int32): int32;
}

// Auto-generated. Do not edit. Really.
