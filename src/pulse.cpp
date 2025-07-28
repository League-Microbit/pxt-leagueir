/**
 * LeagueIR NEC IR CCode Transmitter
 *
 * Send and receive NEC format IR commands using an IR LED and IR receiver module.
 *
 * Uses PWM to generate a 38kHz carrier frequency for the IR LED.
 * Uses timing loops to read the IR receiver output.
 */

#include "pxt.h"
#include <cstdint>
#include <math.h>

using namespace pxt;

namespace leagueir
{

    /*
     * Send an IR bit using PWM carrier frequency (38kHz)
     * @param pin the output pin
     * @param highMicros microseconds to send carrier signal
     * @param lowMicros microseconds to send no signal
     */
    void sendIrBit(MicroBitPin *p, int16_t highTime, int16_t lowTime)
    {

        if (!p)
            return;

        // Send carrier signal (50% duty cycle = 511)
        p->setAnalogValue(511);
        sleep_us(highTime);

        // Turn off carrier
        p->setAnalogValue(0);
        sleep_us(lowTime);
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
    void sendCommand(int pin, uint32_t command)
    {

        // NEC protocol timing (all in microseconds)

        const int16_t AGC_MARK = 9000 + 300;  // 9ms AGC burst +300 to fix timing error
        const int16_t AGC_SPACE = 4500 + 100; // 4.5ms space +300 to fix timing error

        const int16_t BIT_MARK = 560; // 560us mark for all bits

        const int16_t ONE_BIT = 2250;  // total length of a 1 bit
        const int16_t ZERO_BIT = 1120; // total length of a 0 bit

        const int16_t ZERO_SPACE = ZERO_BIT - BIT_MARK; // 560us space for '0'
        const int16_t ONE_SPACE = ONE_BIT - BIT_MARK;   // 1.69ms space for '1'

        const int16_t STOP_BIT = 560; // Final 560us mark

        MicroBitPin *p = getPin(pin);
        // Set up 38kHz carrier (period = 26us)
        p->setAnalogPeriodUs(26);


        if (!p)
        {
            sleep_us(2000);
            return;
        }

        // Send AGC header

        sendIrBit(p, AGC_MARK, AGC_SPACE);

        // Send 32 data bits in custom byte order, LSB-first bit order within each byte
        const int byteOrder[4] = {2,3,0,1}; // Change to {3,4,0,1} if protocol requires
        for (int i = 0; i < 4; i++) {
            int byte = byteOrder[i];
            uint8_t b = (command >> (8 * byte)) & 0xFF;
            for (int bit = 0; bit < 8; bit++) {
                if (b & (1 << bit)) {
                    sendIrBit(p, BIT_MARK, ONE_SPACE); // '1' bit
                } else {
                    sendIrBit(p, BIT_MARK, ZERO_SPACE); // '0' bit
                }
            }
        }


        // Send final stop bit
        sendIrBit(p, STOP_BIT, 10000);
    }

    /*
     * Read a pin, inverting the result, because the IR module inverts the signal
     */
    inline int readPin(MicroBitPin *p)
    {
        if (!p)
            return 0;

        // Invert the reading, because IR receiver outputs LOW when it detects IR signal
        return p->getDigitalValue() ? 0 : 1;
    }

    inline int waitForPinState(MicroBitPin *p, int state, uint32_t timeout)
    {
        if (!p)
            return 0;

        int startTime = system_timer_current_time_us();
        while (readPin(p) != state)
        {
            if (system_timer_current_time_us() - startTime > timeout)
                return 0; // timeout
        }
        return system_timer_current_time_us() - startTime;
    }

    /*
     * Time one pulse*/
    //%
    int timePulse(int pin, int state, uint16_t timeout)
    {

        MicroBitPin *p = getPin(pin);
        int d;

        if (!p)
            return -1;

        // Wait for pin to go high
        if (!waitForPinState(p, state, timeout))
        {
            return -2;
        }

        if (!(d = waitForPinState(p, !state, timeout)))
        {
            return -3;
        }

        return d;
    }

    /* Scramble the input using MurmurHash3. This can sccrmable the bits of the 
    * id of the Micro:bit, so we can use the last 12 for an id value. */
    inline uint32_t murmur_32_scramble(uint32_t k) {
        k *= 0xcc9e2d51;
        k = (k << 15) | (k >> 17);  // rotate left 15
        k *= 0x1b873593;
        return k;
    }

}
