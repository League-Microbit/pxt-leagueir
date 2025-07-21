/**
* Andy England @ SparkFun Electronics
* September 6, 2018
* https://github.com/sparkfun/pxt-light-bit
*
* Development environment specifics:
* Written in Microsoft PXT
* Tested with a SparkFun temt6000 sensor and micro:bit
*
* This code is released under the [MIT License](http://opensource.org/licenses/MIT).
* Please review the LICENSE.md file included with this example. If you have any questions
* or concerns with licensing, please contact techsupport@sparkfun.com.
* Distributed as-is; no warranty is given.
*/


#include "pxt.h"
#include <cstdint>
#include <math.h>

using namespace pxt;

namespace leaguepulse {

    int counter = 0;

    //%
    void pulse(int pin, int16_t delay, int32_t count) {

        MicroBitPin *p = getPin(pin);
        if (!p) return;
        

        for (int32_t i = 0; i < count; i++) {
            // Set pin high
            p->setDigitalValue(1);
            // Wait for delay microseconds
            sleep_us(delay);
            
            // Set pin low
            p->setDigitalValue(0);
            // Wait for delay microseconds
            sleep_us(delay);
        }
    }

    //%
    int incCount() {
        counter++;
        return counter;
    }



    /*
    * Send an IR bit using PWM carrier frequency (38kHz)
    * @param pin the output pin
    * @param highMicros microseconds to send carrier signal
    * @param lowMicros microseconds to send no signal
    */
    void sendIrBit(MicroBitPin *p, int16_t highTime, int16_t lowTime) {

        if (!p) return;

        if (false){
            // No carrier, just use digital pin
            p->setDigitalValue(1);
            sleep_us(highTime);
            p->setDigitalValue(0);
            sleep_us(lowTime);

        } else {
            // Set up 38kHz carrier (period = 26us)
            p->setAnalogPeriodUs(26);

            // Send carrier signal (50% duty cycle = 511)
            p->setAnalogValue(511);
            sleep_us(highTime);

            // Turn off carrier
            p->setAnalogValue(1);
            sleep_us(lowTime);
        }
    }

    /*
    * Send an NEC format IR command. The NEC protocol consists of:
    * 1. AGC burst: 9ms ON, 4.5ms OFF
    * 2. 32 data bits (address + ~address + command + ~command)
    * 3. Each bit: 560us ON + (560us OFF for '0' or 1690us OFF for '1')
    * 4. Final stop bit: 560us ON
    * 5. Message gap of at least 40ms before next command
    * */

    //%
    void sendCommand(int pin, uint32_t command) {

        // NEC protocol timing (all in microseconds)

        const int16_t AGC_BURST = 9000 + 300;     // 9ms AGC burst +300 to fix timing error
        const int16_t AGC_SPACE = 4500 + 100;     // 4.5ms space +300 to fix timing error
        const int16_t ONE_BIT = 2250 + 60;     // total length of a 1 bit
        const int16_t ZERO_BIT = 1120 + 30;     // total length of a 0 bit
        const int16_t BIT_MARK = 560;       // 560us mark for all bits

        const int16_t ZERO_SPACE = ZERO_BIT-BIT_MARK;     // 560us space for '0'
        const int16_t ONE_SPACE = ONE_BIT-BIT_MARK;     // 1.69ms space for '1'
        const int16_t STOP_BIT = 560;       // Final 560us mark

        
        MicroBitPin *dp = getPin(MICROBIT_ID_IO_P1); // Debug pin
        dp->setDigitalValue(1); // Debug pin high

        MicroBitPin *p = getPin(pin);

        if (!p){
            sleep_us(2000);
            dp->setDigitalValue(0); // Debug pin low
            return;
        }

        // Send AGC header burst
     
        sendIrBit(p, AGC_BURST, AGC_SPACE);



        // Send 32 data bits (MSB first)
        for (int i = 31; i >= 0; i--) {
            if (command & (1UL << i)) {
                sendIrBit(p, BIT_MARK, ONE_SPACE);    // '1' bit
            } else {
                sendIrBit(p, BIT_MARK, ZERO_SPACE);   // '0' bit
            }
        }

        dp->setDigitalValue(0); // Debug pin low
        //return;

        // Send final stop bit
        sendIrBit(p, STOP_BIT, 10000);

        // Yield to other fibers (cooperative multitasking)
        // Message gap of at least 40ms before next command
        //fiber_sleep(40);

    }


}
     
