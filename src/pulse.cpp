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

    /* Adjusted for sendIrBitAnalog 
    const int16_t AGC_MARK = 9000 + 300;  // 9ms AGC burst +300 to fix timing error
    const int16_t AGC_SPACE = 4500 + 100; // 4.5ms space +300 to fix timing error
    const int16_t BIT_MARK = 560; // 560us mark for all bits
    const int16_t ONE_BIT = 2250;  // total length of a 1 bit
    const int16_t ZERO_BIT = 1120; // total length of a 0 bit
    const int16_t ZERO_SPACE = ZERO_BIT - BIT_MARK; // 560us space for '0'
    const int16_t ONE_SPACE = ONE_BIT - BIT_MARK;   // 1.69ms space for '1'
    const int16_t STOP_BIT = 560; // Final 560us mark
    */

    // Adsjusted for sendIrBitDigital
    const int16_t AGC_MARK = 9000;  // 9ms AGC burst 
    const int16_t AGC_SPACE = 4500; // 4.5ms space 
    const int16_t BIT_MARK = 560; // 560us mark for all bits
    const int16_t ONE_BIT = 2250;  // total length of a 1 bit
    const int16_t ZERO_BIT = 1120; // total length of a 0 bit
    const int16_t ZERO_SPACE = ZERO_BIT - BIT_MARK; // 560us space for '0'
    const int16_t ONE_SPACE = ONE_BIT - BIT_MARK;   // 1.69ms space for '1'
    const int16_t STOP_BIT = 560; // Final 560us mark


    /*
     * Send an IR bit using PWM carrier frequency (38kHz). This is the
     * standard way to send IR signals, but on Microbit, the timing can be
     * affected by reading other analog pins; for instance, reading from a joystick
     * will cause the timing of all subsequent IR signals to be off.
     * @param pin the output pin
     * @param highMicros microseconds to send carrier signal
     * @param lowMicros microseconds to send no signal
     */

    inline void sendIrBitAnalog(MicroBitPin *p, int16_t highTime, int16_t lowTime)
    {
  
        if (!p)
            return;

        // Send carrier signal (50% duty cycle = 511)
        __disable_irq();
        p->setAnalogValue(511);
        sleep_us(highTime);

        // Turn off carrier
        p->setAnalogValue(0);
        sleep_us(lowTime);
        __enable_irq();
    }


    /** Calibrate the timing by determining how much time per loop we spend
     * doing things that are not sleeping
     */
    //%
    float calibrate(){
        MicroBitPin *p = getPin(MICROBIT_ID_IO_P0);
        uint16_t count = 10000;
        uint32_t start = system_timer_current_time_us();
        

        __disable_irq();
        while(count > 0){
            p->setDigitalValue(1);
            sleep_us(1);
            p->setDigitalValue(0);
            sleep_us(1);
            count -= 1;
        }
        __enable_irq();

        uint32_t end = system_timer_current_time_us();

        float elapsed = (end - start); // Convert to milliseconds
        elapsed -= (count * 2); // Subtract the time spent waiting

        return elapsed / count;
    }

    /* Send an IR bit using digital output, which doesn't have the timing problems of
    * SendIrBitAnalog */
    inline void sendIrBitDigital(MicroBitPin *p, int highTime, int lowTime)
    {
        /* We're allowing for different on and off half periods to more
        finely tune the timing.  */
        #define PERIOD_US 24 // 26 == 38kHz carrier frequency period in microseconds
        #define ON_HALF_PERIOD 13
        #define OFF_HALF_PERIOD (PERIOD_US - ON_HALF_PERIOD) // 12us is half of the 25us period
        /* The high time portion, where we are togglinh at about 38kHz,
        * should start and end with a 1, so the 0 portion of the high timne
        * portion is moved into the low time potion */

        highTime += ON_HALF_PERIOD; // Adjust high time to exclude the last half period
        lowTime -= ON_HALF_PERIOD; // Adjust low time to include the last half period

        int16_t sHighTime = (int16_t)highTime; // Because it will go negative.

        __disable_irq();
        while(sHighTime > 0){
            p->setDigitalValue(1);
            sleep_us(ON_HALF_PERIOD);
            p->setDigitalValue(0);
            sleep_us(OFF_HALF_PERIOD);
            sHighTime -= PERIOD_US;
        }
        __enable_irq();

        sleep_us(lowTime);
      
        
    }
    
    inline void sendIrBit(MicroBitPin *p, int highTime, int lowTime){
        //sendIrBitAnalog(p, highTime, lowTime);
        sendIrBitDigital(p, highTime, lowTime);
    }

    /** Send an IR bit using analog output */
    //%
    void sendIrBitAnalogPn(int32_t pin, int32_t highTime, int32_t lowTime){
        MicroBitPin *p = getPin(pin);
        p->setAnalogPeriodUs(26);

        sendIrBitAnalog(p, highTime, lowTime);

    }

    /** Send an IR bit using digital output */
    //%
    void sendIrBitDigitalPn(int32_t pin, int32_t highTime, int32_t lowTime){
        MicroBitPin *p = getPin(pin);

        sendIrBitDigital(p, highTime, lowTime);

    }

    

    inline void sendIrByte(MicroBitPin *p, uint8_t b)
    {
        if (!p)
            return;

        // Send each bit of the byte
        for (int i = 0; i < 8; i++)
        {
            if (b & (1 << i))
            {
                sendIrBit(p, BIT_MARK, ONE_SPACE); // '1' bit: 560us ON + 1690us OFF
            }
            else
            {
                sendIrBit(p, BIT_MARK, ZERO_SPACE); // '0' bit: 560us ON + 560us OFF
            }
        }
    }

    void sendIrWord(MicroBitPin *p, uint16_t word)
    {
        if (!p)
            return;

        // Send each byte of the word
        sendIrByte(p, word & 0xFF);        // Low byte
        sendIrByte(p, (word >> 8) & 0xFF); // High byte
  
    }

    /** 
     * Send an NEC format IR command. 
     */
    //%
    void sendIrAddressCommand(int32_t pin, int32_t address, int32_t command)
    {

        // NEC protocol timing (all in microseconds)

        uint16_t uAddress = (uint16_t)address;
        uint16_t uCommand = (uint16_t)command;

        MicroBitPin *p = getPin(pin);
        
        // Set up 38kHz carrier (period = 26us)
        p->setAnalogPeriodUs(26);

        if (!p) {
            return;
        }

        // Send AGC header

        sendIrBit(p, AGC_MARK, AGC_SPACE);

        sendIrWord(p, uAddress);
        sendIrWord(p, uCommand);

        // Send final stop bit
        sendIrBit(p, STOP_BIT, 10000);
    }

    /** Send an IR code using the specified pin */
    //%
    void sendIrCode(int32_t pin, int32_t code){

        uint32_t uCode = (uint32_t)code;

        sendIrAddressCommand(pin, 
            (uCode >> 16) & 0xFFFF, // Extract address (upper 16 bits)
            uCode & 0xFFFF);       // Extract command (lower 16 bits)
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

    /** Time one pulse */
    //%
    int timePulse(int32_t pin, int32_t state, int32_t timeout)
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
