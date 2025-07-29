


namespace irtest {
    
    export function testNextNecCode() {
       

        while (true) {
            basic.showIcon(IconNames.Confused);
            let [address, command] = leagueir.readNecAddressCommand(DigitalPin.P16, 2000);
            if (address != 0) {
                basic.showIcon(IconNames.Happy);
            } else {
                basic.showIcon(IconNames.Sad);
            }
            
            serial.writeLine("Address: " + address + ", Command: " + command);
            pause(100);
        }

    }

    export function testSendNecCode() {
        leagueir.calibrate_cpp(DigitalPin.P0);
        while (true) {
            leagueir.sendIrAddressCommand_cpp(DigitalPin.P8, 0x1234, 0xABCD);
            pause(1000);
        }
    }


}