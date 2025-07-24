/**
 * Test program for LeagueIR extension
 * This program demonstrates the pulse generation functionality
 */



function testOnNECReceived() {
    serial.setBaudRate(BaudRate.BaudRate115200);

    serial.writeLine("Starting NEC receiver test...");
    

    jtlinterface.onNecReceived(DigitalPin.P0, function (address, command) {
        basic.showIcon(IconNames.Heart)
        serial.writeValue("x", command)
    });

    jtlinterface.onNecReceived(DigitalPin.P1, function (address: number, command: number) {
        if (address ==  0 && command == 0) {
            // Error 
            serial.writeLine("E: " + leagueir.irError);
        } else {
            // Valid command received
            serial.writeLine("A: " + address + ", " + leagueir.toHex(address) + " C: " + command + ", " + leagueir.toHex(command));

        }
        basic.pause(100);
    });
    
    // Keep the main program running
    while (true) {
        basic.pause(1000);
    }
}


testOnNECReceived();
