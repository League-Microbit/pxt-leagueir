/**
 * Test program for LeagueIR extension
 * This program demonstrates the pulse generation functionality
 */




let n: number = Math.floor(Math.random() * 10)
basic.showNumber(n)




function testSendCommand() {

    let n = 0;

    while(true) { 

        let byteValue = n % 256;
        n = (n + 1) % 256;
        
        // Construct 32-bit message from 4 copies of the byte
        let val =(byteValue << 8) | byteValue;

        leagueir.sendCommand(DigitalPin.P0, val, val );
        basic.showNumber(val);
        basic.pause(500);
        
    }
}




function testOnNECReceived() {
    serial.setBaudRate(BaudRate.BaudRate115200);

    serial.writeLine("Starting NEC receiver test...");
    
    leagueir.onNECReceived(DigitalPin.P1, function (address: number, command: number) {
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
