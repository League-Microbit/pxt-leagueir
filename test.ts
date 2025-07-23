/**
 * Test program for LeaguePulse extension
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

        leaguepulse.sendCommand(DigitalPin.P0, val, val );
        basic.showNumber(n%10);
        basic.pause(100)
        
    }
}




function testOnNECReceived() {
    serial.setBaudRate(BaudRate.BaudRate115200);

    serial.writeLine("Starting NEC receiver test...");
    
    leaguepulse.onNECReceived(DigitalPin.P1, function (address: number, command: number) {
        if (address ==  0 && command == 0) {
            // Error 
            serial.writeLine("E: " + leaguepulse.irError);
        } else {
            // Valid command received
            serial.writeLine("A: " + address + ", " + leaguepulse.toHex(address) + " C: " + command + ", " + leaguepulse.toHex(command));

        }
        basic.pause(100);
    });
    
    // Keep the main program running
    while (true) {
        basic.pause(1000);
    }
}

testOnNECReceived();
