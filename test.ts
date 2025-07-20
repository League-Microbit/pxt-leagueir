/**
 * Test program for LeaguePulse extension
 * This program demonstrates the pulse generation functionality
 */

let n: number = 0;
basic.showNumber(n)

// tests go here; this will not be compiled when this package is used as an extension.
while(true) { 
    
    //leaguepulse.generatePulsesTs(DigitalPin.P0, 1, 10000)
    //leaguepulse.generatePulsesCpp(DigitalPin.P0, 1, 10000)

    leaguepulse.sendCommand(DigitalPin.P0, 0x00FF); 
    
}
