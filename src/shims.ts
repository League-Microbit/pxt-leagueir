/**
 * Simulator implementations for LeagueIR functions
 * These will be used when running in the MakeCode simulator
 */

namespace leagueir {
    let _lastError = "";

    /**
     * Get the last IR error message
     * @returns the error string, or empty string if no error
     */
    //% shim=leagueir::getIrErrorCpp
    export function getIrError(): string {
        return _lastError;
    }

    /**
     * Clear the IR error message
     */
    //% shim=leagueir::clearIrErrorCpp
    export function clearIrError(): void {
        _lastError = "";
    }

    /**
     * Send an NEC format IR command.
     * @param pin The pin number to send on
     * @param address 16-bit address
     * @param command 16-bit command
     */
    //% block="Send IR address %address command %command on pin %pin"
    //% shim=leagueir::sendIrAddressCommandCpp
    export function sendIrAddressCommand(pin: DigitalPin, address: number, command: number): void {
        // Simulator implementation - just log the action
        console.log(`Sending IR: address=${address}, command=${command} on pin ${pin}`);
    }

    /**
     * Send an IR code using the specified pin.
     * @param pin The pin number to send on
     * @param code 32-bit code to send (upper 16 bits = address, lower 16 bits = command)
     */
    //% shim=leagueir::sendIrCodeCpp
    export function sendIrCode(pin: DigitalPin, code: number): void {
        let address = (code >> 16) & 0xFFFF;
        let command = code & 0xFFFF;
        sendIrAddressCommand(pin, address, command);
    }

    /**
     * Read a full NEC code from the IR signal
     * @param pin the digital pin to read from
     * @param timeout timeout in milliseconds (default 1000)
     * @returns the 32-bit NEC code, or 0 on error
     */
    //% shim=leagueir::readNecCodeCpp
    export function readNecCode(pin: DigitalPin, timeout: number): number {
        // Simulator implementation - return a fake IR code for testing
        console.log(`Reading IR from pin ${pin} with timeout ${timeout}ms`);
        return 0x12345678; // Return a test value in simulator
    }
}
