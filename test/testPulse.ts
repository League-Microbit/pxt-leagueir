namespace irtest {


    export function testPulseTiming() {
        // Toggle P8 at 38kHz (period ≈ 26.3us, half-period ≈ 13.16us)
        const pin = DigitalPin.P0;
        while (true) {
            pins.digitalWritePin(pin, 1);
            control.waitMicros(11);
            pins.digitalWritePin(pin, 0);
            control.waitMicros(11);
        }
    }

    export function testTimedBit() {

        
        control.runInParallel(() => {
  
            while (true) {
                //leagueir.sendIrAddressCommand(DigitalPin.P1, 0x1234, 0xABCD);
                
                leagueir.sendIrBitAnalog(AnalogPin.P0, 500, 750);
                leagueir.sendIrBitAnalog(AnalogPin.P0, 750, 500);
                leagueir.sendIrBitDigital(DigitalPin.P1, 500, 750);
                leagueir.sendIrBitDigital(DigitalPin.P1, 750, 500);
                //leagueir.sendIrBit(0, 500, 750);
            }
        });

    }

    export function testCalibrate() {
        
        while(true) {
            serial.writeLine("Calibrate " + leagueir.calibrate());
            pause(1000);
        }

    } 

}