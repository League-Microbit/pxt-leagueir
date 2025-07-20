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

    void sendPwmBit(int pin, int16_t highTime, int16_t lowTime) {

        MicroBitPin *p = getPin(pin);
        if (!p) return;

        p->setDigitalValue(1);
        sleep_us(highTime);
        p->setDigitalValue(0);
        sleep_us(lowTime);
    }

    /*
    * Function to send a 32 bit word using PWM. This is the raw
    * bits; the header and tail are added by the caller. 
    */
    void sendPwmWord(int pin, uint32_t word, int16_t highTime_1, int16_t highTime_0, 
                     int16_t lowTime) {

        // Send a 32 bit word, MSB first
        for (int i = 31; i >= 0; i--) {
            if (word & (1 << i)) {
                // Send a 1
                sendPwmBit(pin, highTime_1, lowTime);
            }
            else {
                // Send a 0
                sendPwmBit(pin, highTime_0, lowTime);
            }
        }

    
    }

    /*
    * Send a command. the command it composed of:
    * A 9ms leading pulse burst (high)
    * A 4.5ms space (low)
    * The 32 bit command, PWM modulated 
    * A final 560us pulse burst (high)
    * */

    //%
    void sendCommand(int pin, uint32_t command, int16_t periodUs) {

        MicroBitPin *p = getPin(pin);
        if (!p) return;

        int16_t highTime_1 = periodUs * 2 / 3; // 66% duty cycle for a 1
        int16_t highTime_0 = periodUs / 3;     // 33% duty cycle for a 0
        int16_t lowTime = periodUs - highTime_1; // Remainder of the period

        // Send the header
        p->setDigitalValue(1);
        sleep_us(9000); // 9ms
        p->setDigitalValue(0);
        sleep_us(4500); // 4.5ms

        // Send the command
        sendPwmWord(pin, command, highTime_1, highTime_0, lowTime);

        // Send the final pulse
        p->setDigitalValue(1);
        sleep_us(560); // 560us
        p->setDigitalValue(0);
    }

    /*
    * Wait for a pin to reach a specific state, then measure the pulse width
    * @param pin the pin to monitor
    * @param targetState the state to wait for (0 or 1)
    * @param maxWidth maximum width to measure in microseconds
    * @param timeoutUs timeout in microseconds for waiting for the state change
    * @return the measured pulse width in microseconds, or -1 if timeout
    */
    int16_t waitAndMeasurePulse(MicroBitPin *p, int targetState, int16_t maxWidth, int timeoutUs = 250000) {
        if (!p) return -1;
        
        // Wait for pin to reach target state
        int timeout = timeoutUs;
        while (p->getDigitalValue() != targetState && timeout > 0) {
            sleep_us(10);
            timeout -= 10;
        }
        if (timeout <= 0) return -1; // Timeout waiting for state change
        
        // Measure the width while pin stays in target state
        int16_t pulseWidth = 0;
        while (p->getDigitalValue() == targetState && pulseWidth < maxWidth) {
            sleep_us(10);
            pulseWidth += 10;
        }
        
        return pulseWidth;
    }

    /*
    * Recieve a command. The command will look for a 9ms leading pulse burst (high), 
    * then a 4.5ms space (low), then 32 bits of PWM data, MSB first. It will timeout
    * and return 0 if no command is recieved within 250ms
    */
    uint32_t recieveCommand(int pin, int16_t periodUs) {
        
        MicroBitPin *p = getPin(pin);
        if (!p) return 0;

        int16_t highTime_1 = periodUs * 2 / 3; // 66% duty cycle for a 1
        int16_t highTime_0 = periodUs / 3;     // 33% duty cycle for a 0
        int16_t lowTime = periodUs - highTime_1; // Remainder of the period

        // Wait for the header
        // Look for a high pulse of ~9ms
        int16_t pulseWidth = 0;
        int16_t spaceWidth = 0;
        uint32_t command = 0;

        // Wait for and measure the header high pulse (~9ms)
        pulseWidth = waitAndMeasurePulse(p, 1, 12000);
        if (pulseWidth < 0 || pulseWidth < 8000 || pulseWidth > 10000){
            return 0; // Invalid or timeout
        }

        // Wait for and measure the header low space (~4.5ms)
        spaceWidth = waitAndMeasurePulse(p, 0, 6000, 10000); // Shorter timeout for space
        if (spaceWidth < 0 || spaceWidth < 4000 || spaceWidth > 5000){
            return 0; // Invalid or timeout
        }

        // Now read in the 32 bits of data
        for (int i = 31; i >= 0; i--) {
            // Wait for and measure the width of the high pulse
            pulseWidth = waitAndMeasurePulse(p, 1, periodUs * 2, 5000); // Wait up to 5ms for next bit
            if (pulseWidth < 0) return 0; // Timeout waiting for bit
            
            // Determine if this is a 1 or a 0
            if (pulseWidth > ((highTime_1 + highTime_0) / 2)) {
            // This is a 1
            command |= (1 << i);
            }
            
            // Wait for the low space between bits
            spaceWidth = waitAndMeasurePulse(p, 0, periodUs, 5000);
            if (spaceWidth < 0) return 0; // Timeout waiting for space
        }

        return command;
    }

}
