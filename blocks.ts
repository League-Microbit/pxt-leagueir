

/**
 * Functions to operate the LeagueIR controller
 */
//%  icon="\uf024" color="#F37121"  block="IR Comm"
namespace jtlinterface {

    //% block="Read NEC IR code from pin $pin"
    export function readNecCode(pin: DigitalPin): number {
        return leagueir.readNecCode(pin);
       
    }

    //% block="On IR code received from pin $pin"
    export function onNecReceived(pin: DigitalPin, handler: (address: number, command: number) => void): void {
        leagueir.onNecReceived(pin, handler);
    }


    //% block="Send IR address $address command $command on pin $pin"
    export function sendCommand(pin: DigitalPin, address: number, command: number): void {
        leagueir.sendCommand(pin, address, command);
    }

    //% block="on IR packet received from pin $pin"
    export function onIrPacketReceived(pin: DigitalPin, handler: (id: number, status: number, command: number, value: number) => void): void {
        leagueir.onIrPacketReceived(pin, handler);
    }

    //% block="send IR packet id $id status $status command $command value $value on pin $pin"
    export function sendIRPacket(pin: DigitalPin, id: number, status: number, command: number, value: number): void {
        
        leagueir.sendIRPacket(pin, id, status, command, value);
    }
}