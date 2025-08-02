
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

//% color="#FF6600" weight=100
//% icon="\uf1eb"  block="LeagueIR"
namespace leagueir {



    /**
     * Reads a NEC IR code from the specified pin.
     * 
     * @param pin The digital pin to read from.
     * @param timeout Optional timeout in milliseconds to wait for a signal.
     * @returns A 32-bit number representing the NEC code.
    */
    //% block="leagueir_readNecAddressCommand" block="Read IR signal address and command from pin %pin"
    //% 
    export function readNecAddressCommand(pin: DigitalPin, timeout?: number): [number, number] {
        
        pins.setPull(pin, PinPullMode.PullUp);
        let result = leagueir.readNecCode(pin, timeout);


        // Split the 32-bit result into address and command
        let address = (result >> 16) & 0xFFFF; // High 16 bits
        let command = result & 0xFFFF;         // Low 16 bit

        return [address, command];
    }

    //% block="leagueir_onNecReceived" block="On IR signal received on pin %pin into address %address command %command"
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