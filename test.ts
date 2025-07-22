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


const AGC_MARK = 9000; // AGC MARK = 9ms
const AGC_MARK_MAX = AGC_MARK + 500;
const AGC_MARK_MIN = AGC_MARK - 500;
const AGC_SPACE = 4500; // AGC SPACE = 4.5ms
const AGC_SPACE_MAX = AGC_SPACE + 500;
const AGC_SPACE_MIN = AGC_SPACE - 500;

const ONE_BIT = 2250;     // total length of a 1 bit
const ZERO_BIT = 1120;    // total length of a 0 bit
const BIT_MARK = 560;     // 560us mark for all bits

const BIT_MARK_MAX = BIT_MARK + 75;
const BIT_MARK_MIN = BIT_MARK - 75;

const ZERO_SPACE = ZERO_BIT - BIT_MARK;    // 560us space for '0'
const ZERO_SPACE_MAX = ZERO_SPACE + 150;    // 760us max for '0'
const ZERO_SPACE_MIN = ZERO_SPACE - 150;    // 460us min for '0'

const ONE_SPACE = ONE_BIT - BIT_MARK;      // 1.69ms space for '1'
const ONE_SPACE_MAX = ONE_SPACE + 150;      // 1.89ms max for '1'
const ONE_SPACE_MIN = ONE_SPACE - 150;      // 1.64ms min for '1'
const STOP_BIT = 560;                      // Final 560us mark

function readPulse(pin: DigitalPin, dp: DigitalPin): number {
    let d: number;

    pins.digitalWritePin(dp, 0);
    pins.digitalWritePin(dp, 1);
    pins.digitalWritePin(dp, 0);

    // Reset the value of n for a new reading
    n = 0;

    // Wait for pin to go LOW (0) before starting to read pulses
    while (pins.digitalReadPin(pin) === 1) {
        // Wait for pin to go LOW
        basic.pause(1);
    }

    while (true) {
        d = leaguepulse.timePulse(pin, 1, AGC_MARK_MAX); // header HIGH
        if (d > AGC_MARK_MIN) {
            break
        }
    }

    let v = 1;
    pins.digitalWritePin(dp, v);
    v = v ? 0 : 1;

    d  = leaguepulse.timePulse(pin, 0, AGC_SPACE_MAX); // header LOW
    if (d < AGC_SPACE_MIN ) return -2;


    for (let i = 0; i < 32; i++) {
        pins.digitalWritePin(dp, v);
        v = v ? 0 : 1;

        d = leaguepulse.timePulse(pin, 1, BIT_MARK_MAX); // bit HIGH
        if (d < BIT_MARK_MIN ) return -(10*i) -3;

        d = leaguepulse.timePulse(pin, 0, ONE_SPACE_MAX); // bit LOW
        if (d < ZERO_SPACE_MIN ) return -(10*i) -4;

        // Determine if bit is 0 or 1 based on duration of LOW pulse
        if (d > ONE_SPACE_MIN) {
            // bit is a 1
            n |= (1 << (31 - i));
        } else {
            // bit is a 0
            n &= ~(1 << (31 - i));
        }
 
    }

    d = leaguepulse.timePulse(pin, 1, STOP_BIT + 200); // final HIGH

    return n;
    

}

function testTimePulse() {
    let dp: DigitalPin = DigitalPin.P0;
    
    while (true) {
        pins.digitalWritePin(DigitalPin.P2, 1)
        let d: number = readPulse(DigitalPin.P1, dp);
        pins.digitalWritePin(dp, 0);
        pins.digitalWritePin(DigitalPin.P2, 0)
        basic.showNumber(d);
       
    }
}

testTimePulse();