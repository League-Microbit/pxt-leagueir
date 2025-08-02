
namespace irtest {
    
    export function testNextNecCode() {

        let address = 0;
        let command = 0;
       
        while (true) {
          
            let [address, command] = leagueir.readNecAddressCommand(DigitalPin.P16, 2000);
            
            serial.writeLine("Address: " + irlib.toHex(address) + ", Command: " + irlib.toHex(command)+ " " + leagueir.getIrError());
            pause(250);
        }

    }

    export function testSendNecCode() {
        
        //leagueir.calibrate_cpp(DigitalPin.P0);

        while (true) {
            leagueir.sendIrAddressCommand(DigitalPin.P8, 0x1234, 0xABCD);
            pause(1000);
        }
    }

}