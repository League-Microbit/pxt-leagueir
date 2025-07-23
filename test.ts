/**
 * Test program for LeaguePulse extension
 * This program demonstrates the pulse generation functionality
 */




let n: number = Math.floor(Math.random() * 10)
basic.showNumber(n)


function toHex(num: number): string {
    let hexStr = "";
    let temp = num;
    if (temp === 0) {
        hexStr = "00000000";
    } else {
        while (temp > 0) {
            let digit = temp % 16;
            if (digit < 10) {
                hexStr = digit + hexStr;
            } else {
                hexStr = String.fromCharCode(55 + digit) + hexStr; // A-F
            }
            temp = Math.floor(temp / 16);
        }
        // Pad with leading zeros to make it 8 digits (32 bits)
        while (hexStr.length < 8) {
            hexStr = "0" + hexStr;
        }
    }
    return hexStr;
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
const BIT_MARK_MIN = BIT_MARK - 120;

const ZERO_SPACE = ZERO_BIT - BIT_MARK;    // 560us space for '0'
const ZERO_SPACE_MAX = ZERO_SPACE + 150;    // 760us max for '0'
const ZERO_SPACE_MIN = ZERO_SPACE - 170;    // 460us min for '0'

const ONE_SPACE = ONE_BIT - BIT_MARK;      // 1.69ms space for '1'
const ONE_SPACE_MAX = ONE_SPACE + 150;      // 1.89ms max for '1'
const ONE_SPACE_MIN = ONE_SPACE - 170;      // 1.64ms min for '1'
const STOP_BIT = 560;                      // Final 560us mark


    // Constants for pin states
const IR_HIGH = 0; // IR LED is considered "high" when the digital pin reads 0
const IR_LOW = 1;  // IR LED is considered "low" when the digital pin reads 1


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


function testOnNECReceived() {
    serial.setBaudRate(BaudRate.BaudRate9600);

    serial.writeLine("Starting NEC receiver test...");
    
    leaguepulse.onNECReceived(DigitalPin.P1, function (address: number, command: number) {
        if (address === 0) {
            // Error occurred, command contains error code
            serial.writeLine("E: " + command);
        } else {
            // Valid command received
            serial.writeLine("A: " + address + ", C: " + command);

        }
        basic.pause(100);
    });
    
    // Keep the main program running
    while (true) {
        basic.pause(1000);
    }
}

function readNecBit(pin: DigitalPin): number {

    let pulseTime = 0;

    pulseTime = leaguepulse.timePulse(pin, 1, BIT_MARK_MAX + 200);

    if (pulseTime < 0) return pulseTime - 10 // timedout at BIT_MARK_MAX

    if (pulseTime > BIT_MARK_MIN) {

        pulseTime = leaguepulse.timePulse(pin, 0, ONE_SPACE_MAX);

        if (pulseTime < 0) return pulseTime - 20 // timedout at ONE_SPACE_MAX

        if (pulseTime > ONE_SPACE_MIN && pulseTime < ONE_SPACE_MAX) {
            return 1;
        } else if (pulseTime > ZERO_SPACE_MIN && pulseTime < ZERO_SPACE_MAX) {
            return 0;
        } else {
            return - 10; // Error Bit space wasn't either 0 or 1
        }

    } else {
        return -pulseTime;
    }

}



function testTimePulse() {
    serial.setBaudRate(BaudRate.BaudRate115200);
    serial.writeLine("Starting TimePulse test...");

    let pin = DigitalPin.P1;
    let debug_pin = DigitalPin.P2;
    let debug_pin_2 = DigitalPin.P16;

    // Constants for pin states
    const IR_HIGH = 0; // IR LED is considered "high" when the digital pin reads 0
    const IR_LOW = 1;  // IR LED is considered "low" when the digital pin reads 1

    // Configure pins
    pins.setPull(pin, PinPullMode.PullUp);  // Use pull-up resistor on the input pin
    pins.digitalWritePin(debug_pin, 0);     // Initialize debug pin to low
    pins.digitalWritePin(debug_pin_2, 0);  

    while (true) {
        // Step 1: Make an array of 36 numbers
        let pulseArray: number[] = [];
        let pulseTime = 0;
        
        if (!leaguepulse.readACGHeader(pin)) {
            continue;
        }

        pins.digitalWritePin(debug_pin, 1);  

        let n = 0;
        let b = 0;

        for (let i = 0; i < 32; i++) {
           
            b = readNecBit(pin);
            if (b < 0) {
                break
            }

            if (b) {
                // bit is a 1
                n |= (1 << (31 - i));
            } else {
                // bit is a 0
                n &= ~(1 << (31 - i));
            }
        }

        // Clear the top bit of n
        n &= 0x7FFFFFFF;

        serial.writeLine("Received: "+ n + " 0x" + toHex(n) + " " + b);
        
        pins.digitalWritePin(debug_pin, 0);  
    }
}



testTimePulse();