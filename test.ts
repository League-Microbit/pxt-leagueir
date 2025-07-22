/**
 * Test program for LeaguePulse extension
 * This program demonstrates the pulse generation functionality
 */

let n: number = Math.floor(Math.random() * 10)
basic.showNumber(n)




function testSendCommand(ms: number) {

    while(true) { 
        
        //leaguepulse.generatePulsesTs(DigitalPin.P0, 1, 10000)
        //leaguepulse.generatePulsesCpp(DigitalPin.P0, 1, 10000)

    
        let byteValue = n % 256;
        n = (n + 1) % 256;
        
        // Construct 32-bit message from 4 copies of the byte
        let message = 
            (byteValue << 24) | 
            (byteValue << 16) | 
            (byteValue << 8) | 
            byteValue;
        
        leaguepulse.sendCommand(DigitalPin.P0, message);
        basic.showNumber(n%10);
        basic.pause(40)
        
    }
}


function testRecvCommand() {
    while (true) {
        basic.clearScreen();
        let receivedValue = leaguepulse.recvCommand(DigitalPin.P1, 1000); // 1 second timeout
        basic.showNumber(receivedValue);
        basic.pause(250);
    }
}

function testPulseTiming() {
    while (true) {
        let lowDuration: number = leaguepulse.pulseTimer(DigitalPin.P1, 10000, 1000, 1000);
        basic.showNumber(lowDuration);
        basic.pause(250);
    }
}


function testTimePulse() {
    let dp: DigitalPin = DigitalPin.P0;
    pins.digitalWritePin(DigitalPin.P11, 0)
    pins.digitalWritePin(DigitalPin.P12, 0)
    

    while (true) {
        pins.digitalWritePin(DigitalPin.P2, 1)
        let d: number = leaguepulse.readNEC(DigitalPin.P1, dp);
        pins.digitalWritePin(dp, 0);
        pins.digitalWritePin(DigitalPin.P2, 0)
        basic.showNumber(d);
       
    }
}

testTimePulse();