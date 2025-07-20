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

    //%
    void pulse(int pin, int16_t delay, int32_t count) {
        MicroBitPin *p = getPin(pin);
        if (!p) return;
        
        for (int32_t i = 0; i < count; i++) {
            // Set pin high
            p->setDigitalValue(1);
            // Wait for delay microseconds
            //sleep_us(delay);
            
            // Set pin low
            p->setDigitalValue(0);
            // Wait for delay microseconds
            //sleep_us(delay);
        }
    }



}
