
/**
 * With radio off
 * 
 *                  mean  std      p01      p99
    category                                    
    BIT_MARK          560   40      500      640
    HEADER_MARK      9020   20     8990     9040
    HEADER_SPACE     4500   20     4470     4520
    ONE_SPACE        1670   90     1200     1770


* With radio and beacon on:

    BIT_MARK         570    71     427     858
    AGC_MARK         9028   59     8908    9135
    AGC_SPACE        4491   53     4404    4592
    ONE_SPACE        1669   105    1196    1837

 */


namespace leagueir {

    const AGC_MARK = 9000;                 // AGC MARK = 9000µs (9ms)


    const AGC_SPACE = 4500;               // AGC SPACE = 4500µs (4.5ms)


    const ONE_BIT = 2250;                 // ONE BIT total = 2250µs
    const ZERO_BIT = 1120;                // ZERO BIT total = 1120µs
    const BIT_MARK = 560;                 // BIT MARK = 560µs


    const ONE_SPACE = ONE_BIT - BIT_MARK;         // ONE SPACE = 1690µs


    // Constants for pin states
    const IR_HIGH = 0; // IR LED is considered "high" when the digital pin reads 0
    const IR_LOW = 1; // IR LED is considered "low" when the digital pin reads 1


    export enum Address {
        RadioChannel = 0xD00D, // Radio channel and radio group 
    }


    // Status codes for IR packets
    export enum IrStatus {
        NONE = 0,
        REQUEST = 1,
        ACK = 2,
        NACK = 3
    }

    // Command codes for IR packets
    export enum IrCommand {
        PAIR = 0,
        IAM = 1
    }


    export let irError = "";

 

    //% 
    export function readNecAddressCommand(pin: DigitalPin, timeout?: number): [number, number] {
        
        pins.setPull(pin, PinPullMode.PullUp);
        let result = leagueir.readNecCode(pin, timeout);


        // Split the 32-bit result into address and command
        let address = (result >> 16) & 0xFFFF; // High 16 bits
        let command = result & 0xFFFF;         // Low 16 bit

        return [address, command];
    }

    //% 
    export function onNecReceived(pin: DigitalPin, handler: (address: number, command: number) => void): void {
        control.inBackground(() => {
            while (true) {
                let [address, command] = readNecAddressCommand(pin);

                if (address != 0) {
                    handler(address, command);
                }

                // Small delay before next reading
                basic.pause(10);
            }
        });
    }





}