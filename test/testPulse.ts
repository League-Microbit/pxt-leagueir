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

        while (true) {
            pins.digitalWritePin(DigitalPin.P1, 1);
            leagueir.sendTimedPulses(0, 500, 750);
            pins.digitalWritePin(DigitalPin.P1, 0);
            leagueir.sendTimedPulses(0, 750, 500)

        }

    }

}