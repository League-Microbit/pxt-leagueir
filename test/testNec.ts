


namespace irtest {
    
    export function testNextNecCode() {
       

        while (true) {
            basic.showIcon(IconNames.Confused);
            let [address, command] = leagueir.readNecAddressCommand(DigitalPin.P16, 2000);
            basic.showIcon(IconNames.Happy);
            serial.writeLine("Address: " + address + ", Command: " + command);
            pause(100);
        }

    }


}