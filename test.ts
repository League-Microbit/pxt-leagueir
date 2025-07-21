/**
 * Test program for LeaguePulse extension
 * This program demonstrates the pulse generation functionality
 */

let n: number = Math.floor(Math.random() * 10)
basic.showNumber(n)


while(true) { 
    
    //leaguepulse.generatePulsesTs(DigitalPin.P0, 1, 10000)
    //leaguepulse.generatePulsesCpp(DigitalPin.P0, 1, 10000)

    leaguepulse.sendCommand(DigitalPin.P0, 0xF0F0FF00); 
    
}
