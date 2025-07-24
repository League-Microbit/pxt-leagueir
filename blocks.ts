

/**
 * Functions to operate the LeagueIR controller
 */
//%  icon="\uf024" color="#F37121"  block="JTL IR Xmtr"
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
    //% weight=50
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% draggableParameters="reporter"
    export function onIrPacketReceived(pin: number, handler: (id: number, status: number, command: number, value: number) => void): void {
        leagueir.onIrPacketReceived(pin, handler);
    }

    //% block="send IR packet id $id status $status command $command value $value on pin $pin"
    //% weight=60
    //% pin.fieldEditor="gridpicker" pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false" pin.fieldOptions.width="300"
    //% id.min=0 id.max=4095 id.defl=1
    //% status.min=0 status.max=15 status.defl=0
    //% command.min=0 command.max=15 command.defl=1
    //% value.min=0 value.max=15 value.defl=0
    export function sendIRPacket(pin: number, id: number, status: number, command: number, value: number): void {
        leagueir.sendIRPacket(pin, id, status, command, value);
    }
}