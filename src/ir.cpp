

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
    char irError[64] = ""; // Global error string for IR errors


    int calibrateTime = 0; // Global variable to store the calibration time


    const int16_t MARK_PERIOD = 26; // 38kHz carrier frequency period in microseconds

    const int16_t AGC_MARK = 9000  + (MARK_PERIOD/2);  // 9ms AGC burst
    const int16_t AGC_MARK_MAX = AGC_MARK + 500;  // AGC MARK MAX = 9500µs
    const int16_t AGC_MARK_MIN = AGC_MARK - 500;  // AGC MARK MIN = 8500µs

    const int16_t AGC_SPACE = 4500 - (MARK_PERIOD/2); // 4.5ms space
    const int16_t AGC_SPACE_MAX = AGC_SPACE + 500; // AGC SPACE MAX = 5000µs
    const int16_t AGC_SPACE_MIN = AGC_SPACE - 500; // AGC SPACE MIN = 4000µs

    const int16_t BIT_MARK = 560 + (MARK_PERIOD/2); // 560us mark for all bits
 
    const int16_t ONE_BIT = 2250;  // total length of a 1 bit
    const int16_t BIT_MARK_MAX = BIT_MARK + 300;   // BIT MARK MAX = 860µs
    const int16_t BIT_MARK_MIN = BIT_MARK - 200;  // BIT MARK MIN = 420µs
    
    const int16_t ZERO_BIT = 1120 ; // total length of a 0 bit
    const int16_t ZERO_SPACE = ZERO_BIT - BIT_MARK - (MARK_PERIOD/2); // 560us space for '0'
    const int16_t ZERO_SPACE_MAX = ZERO_SPACE + 300;      // ZERO SPACE MAX = 860µs
    const int16_t ZERO_SPACE_MIN = ZERO_SPACE - 220;      // ZERO SPACE MIN = 390µs

    const int16_t ONE_SPACE = ONE_BIT - BIT_MARK - (MARK_PERIOD/2);   // 1.69ms space for '1'
    const int16_t ONE_SPACE_MAX = ONE_SPACE + 150;        // ONE SPACE MAX = 1840µs
    const int16_t ONE_SPACE_MIN = ONE_SPACE - 470;        // ONE SPACE MIN = 1490µs

    const int16_t STOP_MARK = 560; // Final 560us mark
    const int16_t STOP_MARK_MAX = STOP_MARK + 300;   // STOP MARK MAX = 760µs
    const int16_t STOP_MARK_MIN = STOP_MARK - 140;   // STOP MARK MIN = 420µs


        /** Calibrate the timing by determining how much time per loop we spend
     * doing things that are not sleeping
     */

    int calibrate(int pin){

        MicroBitPin *p = getPin(pin);
        #define CALIBRATE_COUNT 500
        #define SLEEP_TIME_US 13 // Time to sleep in microseconds
        uint16_t count = CALIBRATE_COUNT;

        __disable_irq();
        uint32_t start = system_timer_current_time_us();
        while(count > 0){
            p->setDigitalValue(1);
            sleep_us(SLEEP_TIME_US);
            p->setDigitalValue(0);
            sleep_us(SLEEP_TIME_US);
            count -= 1;
        }
        uint32_t end = system_timer_current_time_us();
        __enable_irq();

        float elapsed = (end - start); 
        elapsed -= (CALIBRATE_COUNT * 2 * SLEEP_TIME_US); // Subtract the time spent waiting

        calibrateTime = (int)(elapsed / CALIBRATE_COUNT); // Store the calibration time

        return calibrateTime; // Return the calibration time
    }

    inline void busy_wait_us(uint32_t us) {
        uint32_t start = system_timer_current_time_us();
        while (system_timer_current_time_us() - start < us) {
            
        }
    }

    /*
     * Send an IR bit using PWM carrier frequency (38kHz). This is the
     * standard way to send IR signals, but on Microbit, the timing can be
     * affected by reading other analog pins; for instance, reading from a joystick
     * will cause the timing of all subsequent IR signals to be off.
     * @param pin the output pin
     * @param highMicros microseconds to send carrier signal
     * @param lowMicros microseconds to send no signal
     */

    void sendIrBit(MicroBitPin *p, uint32_t highTime, uint32_t lowTime)
    {

        uint32_t start = system_timer_current_time_us();
        p->setAnalogValue(511); // Send carrier signal (50% duty cycle = 511)

        while (system_timer_current_time_us() - start < (uint32_t)highTime)
            ;

        start += highTime;
        p->setAnalogValue(0); // Turn off carrier
        while (system_timer_current_time_us() - start < (uint32_t)lowTime)
            ;

    }


    /**
     * Send a byte as IR, LSB first.
     * @param p Pointer to the output MicroBitPin
     * @param b Byte to send
     */
    inline void sendIrByte(MicroBitPin *p, uint8_t b)
    {

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

    /**
     * Send a 16-bit word as IR, LSB first.
     * @param p Pointer to the output MicroBitPin
     * @param word 16-bit word to send
     */
    inline void sendIrWord(MicroBitPin *p, uint16_t word)
    {
        sendIrByte(p, word & 0xFF);        // Low byte
        sendIrByte(p, (word >> 8) & 0xFF); // High byte
    }

    /**
     * Send an NEC format IR command.
     * @param pin The pin number to send on
     * @param address 16-bit address
     * @param command 16-bit command
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
        __disable_irq();
        sendIrBit(p, AGC_MARK, AGC_SPACE);

        sendIrWord(p, uAddress);
        sendIrWord(p, uCommand);

        // Send final stop bit
        sendIrBit(p, STOP_MARK, STOP_MARK);
        __enable_irq();
    }

    /**
     * Send an IR code using the specified pin.
     * @param pin The pin number to send on
     * @param code 32-bit code to send (upper 16 bits = address, lower 16 bits = command)
     */
    //%
    void sendIrCode(int32_t pin, int32_t code){

        uint32_t uCode = (uint32_t)code;

        sendIrAddressCommand(pin, 
            (uCode >> 16) & 0xFFFF, // Extract address (upper 16 bits)
            uCode & 0xFFFF);       // Extract command (lower 16 bits)
    }


    /**
     * Read a pin, inverting the result, because the IR module inverts the signal.
     * @param p Pointer to the input MicroBitPin
     * @returns 1 if IR detected, 0 otherwise
     */
    inline int readPin(MicroBitPin *p)
    {
        // Invert the reading, because IR receiver outputs LOW when it detects IR signal
        return p->getDigitalValue() ? 0 : 1;
    }


    
    /**
     ** Receiving IR Codes
     **/


    /**
     * Wait for the pin to reach a given state or timeout.
     * @param p Pointer to the input MicroBitPin
     * @param state Desired pin state (0 or 1)
     * @param timeout Timeout in microseconds
     * @returns Time waited in microseconds, or 0 if timed out
     */
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

     /**
     * Time one pulse.
     * @param pin The pin number to read from
     * @param state The state to wait for (0 or 1)
     * @param timeout Timeout in microseconds
     * @returns Pulse duration in microseconds, or negative value on error
     */
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

    /**
     * Read the AGC header from the IR signal
     * @param pin the digital pin to read from
     * @returns true if a valid AGC header was detected, false otherwise
     */
    bool readACGHeader(MicroBitPin *p) {
        int pulseTime = 0;

        pulseTime = timePulse(p->name, 1, AGC_MARK_MAX);
        if (pulseTime > 0 && pulseTime > AGC_MARK_MIN) {
            pulseTime = timePulse(p->name, 0, AGC_SPACE_MAX);
            if (pulseTime > 0 && pulseTime > AGC_SPACE_MIN) {
                return true;
            }
        }
        return false;
    }



    /**
     * Read a single bit from the IR signal
     * @param pin the digital pin to read from
     * @returns 1 for a '1' bit, 0 for a '0' bit, -1 for error
     */

    int readNecBit(MicroBitPin *p) {
        int pulseTime = 0;

        pulseTime = timePulse(p->name, 1, BIT_MARK_MAX + 200);

        if (pulseTime < 0) {
            return -1;
        }

        if (pulseTime > BIT_MARK_MIN) {
            pulseTime = timePulse(p->name, 0, ONE_SPACE_MAX);

            if (pulseTime < 0) {
                return -1;
            }

            if (pulseTime > ONE_SPACE_MIN && pulseTime < ONE_SPACE_MAX) {
                return 1;
            } else if (pulseTime > ZERO_SPACE_MIN && pulseTime < ZERO_SPACE_MAX) {
                return 0;
            } else {
                return -1;
            }
        } else {
            return -1;
        }
    }

        /**
     * Read the final stop mark from the IR signal
     * @param pin the digital pin to read from
     * @returns 1 if valid stop mark, 0 otherwise
     */
    int readStopMark(MicroBitPin *p) {
        int pulseTime = timePulse(p->name, 1, STOP_MARK + 500); // Use STOP_MARK as reference
        if (pulseTime < (STOP_MARK - 200) || pulseTime > (STOP_MARK + 500)) {
            return 0;
        }
        return 1;
    }

    /**
     * Read a single byte from the IR signal (LSB first)
     * @param pin the digital pin to read from
     * @returns the byte value (0-255), or -1 on error
     */
    int readNecByte(MicroBitPin *p) {
        int b = 0;
        int byteVal = 0;
        for (int bit = 0; bit < 8; bit++) {
            b = readNecBit(p);
            if (b < 0) {
                return -1;
            }
            if (b) {
                byteVal |= (1 << bit); // LSB first within byte
            } else {
                byteVal &= ~(1 << bit);
            }
        }
        return byteVal & 0xFF;
    }

    /**
     * Read a 16-bit word from the IR signal (LSB first)
     * @param pin the digital pin to read from
     * @returns the word value (0-65535), or -1 on error
     */
    int readNecWord(MicroBitPin *p) {
        int low = readNecByte(p);
        if (low < 0) return -1;
        int high = readNecByte(p);
        if (high < 0) return -1;
        return (high << 8) | low;
    }

    /**
     * Read a full NEC code from the IR signal
     * @param pin the digital pin to read from
     * @param timeout timeout in milliseconds (default 1000)
     * @returns the 32-bit NEC code, or 0 on error
     */
    //%
    uint32_t readNecCode(int32_t pin, int32_t timeout = 1000) {
        MicroBitPin *p = getPin(pin);
        if (!p) return 0;
        uint32_t startTime = system_timer_current_time();
        while (1) {
            if ((system_timer_current_time() - startTime) > (uint32_t)timeout) {
                return 0;
            }
            if (!readACGHeader(p)) {
                continue;
            }
            int address = readNecWord(p);
            int command = readNecWord(p);
            if (address < 0 || command < 0) return 0;
            uint32_t n = ((uint32_t)address) | ((uint32_t)command << 16);
            if (!readStopMark(p)) {
                return 0;
            }
            return n;
        }
    }

}
