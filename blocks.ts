

/**
 * Functions to operate the LeagueIR controller
 */
//%  icon="\uf024" color="#F37121"  block="JTL IR Xmtr"
namespace jtlinterface {

    //% block="Read NEC IR code from pin $pin"
    export function readNecCode(pin: number): number {
        return leagueir.readNecCode(pin);
       
    }

    //% block="On IR code received from pin $pin"
    export function onNecReceived(pin: number, handler: (address: number, command: number) => void): void {
        leagueir.onNecReceived(pin, handler);
    }


    //% block="Send IR address $address command $command on pin $pin"
    export function sendCommand(pin: DigitalPin, address: number, command: number): void {
        leagueir.sendCommand(pin, address, command);
    }

}