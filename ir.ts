

/**
 * Functions to operate the LeagueIR controller
 */
//%  icon="\uf0ce" color="#da4213ff"
namespace leagueir {

    //% block="Read NEC IR code from pin $pin"
    export function readNecCode(pin: number): number {
        let digitalPin = pin as DigitalPin;

        // Configure pins
        pins.setPull(digitalPin, PinPullMode.PullUp); // Use pull-up resistor on the input pin

        while (true) {

            if (!leagueirlib.readACGHeader(digitalPin)) {
                continue;
            }

            let n = 0;
            let b = 0;

            for (let i = 0; i < 32; i++) {

                b = leagueirlib.readNecBit(digitalPin);
                if (b < 0) {
                    return 0;

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
            let pulseTime = leagueirlib.timePulse(pin, 1, leagueirlib.STOP_BIT + 200);
            if (pulseTime < leagueirlib.STOP_BIT - 200 || pulseTime > leagueirlib.STOP_BIT + 200) {
                leagueirlib.irError = "Invalid stop bit duration: " + pulseTime;
                return 0;
            }

            return n;

        }
    }

    //% block="on NEC received from pin $pin"
    export function onNecReceived(pin: number, handler: (address: number, command: number) => void): void {
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


    //% block="Send IR address $address command $command on pin $pin"
    export function sendCommand(pin: number, address: number, command: number): void {
        let digitalPin = pin as DigitalPin;
        // Combine address (upper 16 bits) and command (lower 16 bits) into 32-bit value
        let combined = ((address & 0xFFFF) << 16) | (command & 0xFFFF);
        leagueirlib.sendCommandCpp(pin, combined);
    }

}