

namespace irtest {
    export function testIPReceive() {
    
        leagueir.onIrPacketReceived(DigitalPin.P16, function (id: number, status: number, command: number, value: number) {
            if (id == 0 && status == 0 && command == 0 && value == 0) {
                // Error 
                serial.writeLine("E: " + leagueir.irError);
                basic.showIcon(IconNames.Sad);
            } else {
                // Valid packet received
                serial.writeLine("ID: " + id + ", " + irlib.toHex(id) +
                    " S: " + status + ", " + irlib.toHex(status) +
                    " C: " + command + ", " + irlib.toHex(command) +
                    " V: " + value + ", " + irlib.toHex(value));
                basic.showIcon(IconNames.Happy);
            }
            basic.pause(100);
            basic.clearScreen();
        });

    }

    export function testIPSend() {

        let id = 0x123;
        let status = 0x4;
        let cmd = 0x5;
        let value = 0x6;

        basic.forever(function () {
            basic.showIcon(IconNames.Target);
            leagueir.sendIRPacket(DigitalPin.P8, id, status, cmd, value);
            basic.clearScreen();
            basic.pause(1000);
        });
    }

    export function testRadioChannelSend() {

        let i = 0;

        basic.forever(function () {
            let channel = i;
            let group = Math.floor(i / 2);
            let command = (channel << 8) | group;
            i++;
            basic.showIcon(IconNames.Target);
            leagueir.sendIrAddressCommand_cpp(DigitalPin.P8, leagueir.Address.RadioChannel, command);
            basic.clearScreen();
            basic.pause(600);
    
        });
    }

    export function testRadioChannelReceive() {
        leagueir.onNecReceived(DigitalPin.P16, function (address: number, command: number) {
            if (address == leagueir.Address.RadioChannel) {
                let channel = (command >> 8) & 0xFF;
                let group = command & 0xFF;
            
                serial.writeLine("Radio Channel: " + channel + ", Group: " + group);
                basic.showIcon(IconNames.Happy);
            } else {
                serial.writeLine("Unknown address: " + address);
                basic.showIcon(IconNames.Sad);
            }
            basic.pause(100);
            basic.clearScreen();
        });
    }


    /* Send a hello IR message on the given pin to signal to the recipient that we want
    to negotiate a radio channel. */

    export function sendIRRadioMessage(pin: DigitalPin, channel: number, group: number): void {
        let command = (channel << 8) | group;
        leagueir.sendIrAddressCommand_cpp(pin, leagueir.Address.RadioChannel, command);
    }

    export function recieveIrMessages(pin: DigitalPin) {
        leagueir.onIrPacketReceived(pin, function (id: number, status: number, command: number, value: number) {

        });
    }
    
}

