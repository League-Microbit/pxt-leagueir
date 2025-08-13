/**
 * LeagueIR NEC IR CCode Transmitter
 *
 * Send and receive NEC format IR commands using an IR LED and IR receiver module.
 *
 * Uses PWM to generate a 38kHz carrier frequency for the IR LED.
 * Uses timing loops to read the IR receiver output.
 */

#include "pxt.h"
#include <cstdlib>
#include <math.h>
#include <cstdio>

using namespace pxt;
using namespace std;

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

    const int16_t REPEAT_SPACE =  2250; 
    const int16_t REPEAT_SPACE_MAX = REPEAT_SPACE + 500; // REPEAT SPACE MAX = 2750µs
    const int16_t REPEAT_SPACE_MIN = REPEAT_SPACE - 500; // RE


    const int16_t STOP_MARK = 560; // Final 560us mark
    const int16_t STOP_MARK_MAX = STOP_MARK + 300;   // STOP MARK MAX = 760µs
    const int16_t STOP_MARK_MIN = STOP_MARK - 140;   // STOP MARK MIN = 420µs


        /** Calibrate the timing by determining how much time per loop we spend
     * doing things that are not sleeping
     */

    
    /**
     * Get the last IR error message
     * @returns the error string, or empty string if no error
     */
    //%
    String getIrErrorCpp() {
        return mkString(irError, strlen(irError));
    }

    /**
     * Clear the IR error message
     */
    //%
    void clearIrErrorCpp() {
        irError[0] = '\0';  // Set first character to null terminator
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
        p->setAnalogValue(1); // Turn off carrier
        while (system_timer_current_time_us() - start < (uint32_t)lowTime)
            ;

    }


    /**
     * Send a byte as IR, LSB first.
     * @param p Pointer to the output MicroBitPin
     * @param b Byte to send
     */
    void sendIrByte(MicroBitPin *p, uint8_t b)
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
    void sendIrWord(MicroBitPin *p, uint16_t word)
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
    void sendIrAddressCommandCpp(int32_t pin, int32_t address, int32_t command)
    {

        // NEC protocol timing (all in microseconds)

        uint16_t uAddress = (uint16_t)address;
        uint16_t uCommand = (uint16_t)command;

        MicroBitPin *p = getPin(pin);
        
        if (!p) {
            return;
        }

        // Set up 38kHz carrier (period = 26us)
        p->setAnalogPeriodUs(26);


        __disable_irq();
        sendIrBit(p, AGC_MARK, AGC_SPACE); // Send AGC header

        sendIrWord(p, uAddress);
        sendIrWord(p, uCommand);

        sendIrBit(p, STOP_MARK, STOP_MARK); // Send final stop bit
        __enable_irq();
    }

    /**
     * Send an IR code using the specified pin.
     * @param pin The pin number to send on
     * @param code 32-bit code to send (upper 16 bits = address, lower 16 bits = command)
     */
    
    void sendIrCodeCpp(int32_t pin, int32_t code){

        uint32_t uCode = (uint32_t)code;

        sendIrAddressCommandCpp(pin, 
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
    int waitForPinState(MicroBitPin *p, int state, uint32_t timeout)
    {

        int startTime = system_timer_current_time_us();
        while (readPin(p) != state)
        {
            if (system_timer_current_time_us() - startTime > timeout)
                return 0; // timeout
        }
        return system_timer_current_time_us() - startTime;
    }

    int waitForPinStateUntil(MicroBitPin *p, int state, uint32_t endTime)
    {

        int startTime = system_timer_current_time_us();
        while (readPin(p) != state)
        {
            if (system_timer_current_time_us() > endTime)
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

    int timePulse(MicroBitPin *p, int32_t state, int32_t timeout)
    {

        // Wait for pin to go high
        if (!waitForPinState(p, state, timeout))
        {
            return -1;
        }

        int d = waitForPinState(p, !state, timeout);

        if (!d)
        {
            return -2;
        }

        return d;
    }

    /**
     * Read the AGC header from the IR signal
     * @param pin the digital pin to read from
     * @returns 1 if a valid AGC header was detected, 0 otherwise
     */
    int readACGHeader(MicroBitPin *p) {
        int pulseTime = 0;


        pulseTime = timePulse(p, 1, AGC_MARK_MAX);

        if (pulseTime < 0) {
            snprintf(irError, sizeof(irError), "AGC header timeout: pulseTime=%d", pulseTime);
            return 0;
        }
        if (pulseTime > AGC_MARK_MIN) {
            pulseTime = timePulse(p, 0, AGC_SPACE_MAX);
            if (pulseTime > AGC_SPACE_MIN) {
                return 1;
            } else if ( REPEAT_SPACE_MIN < pulseTime && pulseTime < REPEAT_SPACE_MAX) {
                // This is a repeat code, we can handle it as a special case
                return 2; // Return true for repeat code
            } else {
                snprintf(irError, sizeof(irError), "AGC space error: pulseTime=%d", pulseTime);
            }
        } else {
            snprintf(irError, sizeof(irError), "AGC header error: pulseTime=%d", pulseTime);
        }
        return 0;

    }

    void toggleDebugPin1() {
        MicroBitPin *debugPin = getPin(MICROBIT_ID_IO_P1);
        debugPin->setDigitalValue(1);
        debugPin->setDigitalValue(0);
    }

    void toggleDebugPin2() {
        MicroBitPin *debugPin = getPin(MICROBIT_ID_IO_P2);
        debugPin->setDigitalValue(1);
        debugPin->setDigitalValue(0);
    }


    /**
     * Read a single bit from the IR signal
     * @param pin the digital pin to read from
     * @returns 1 for a '1' bit, 0 for a '0' bit, -1 for error
     */

    int readNecBit(MicroBitPin *p) {
        int pulseTime = 0;

        pulseTime = timePulse(p, 1, BIT_MARK_MAX + 200);

        if (pulseTime < 0) {
            snprintf(irError, sizeof(irError), "Bit mark timeout: pulseTime=%d", pulseTime);
            return -1;
        }

        if (pulseTime > BIT_MARK_MIN) {
            pulseTime = timePulse(p, 0, ONE_SPACE_MAX);

            if (pulseTime < 0) {
                snprintf(irError, sizeof(irError), "Bit space timeout: pulseTime=%d", pulseTime);
                return -1;
            }

            if (pulseTime > ONE_SPACE_MIN && pulseTime < ONE_SPACE_MAX) {
                return 1;
            } else if (pulseTime > ZERO_SPACE_MIN && pulseTime < ZERO_SPACE_MAX) {
                return 0;
            } else {
                snprintf(irError, sizeof(irError), "Bit space error: pulseTime=%d", pulseTime);
                return -1;
            }
        } else {
            snprintf(irError, sizeof(irError), "Bit mark error: pulseTime=%d", pulseTime);
            return -1;
        }
    }

        /**
     * Read the final stop mark from the IR signal
     * @param pin the digital pin to read from
     * @returns 1 if valid stop mark, 0 otherwise
     */
    int readStopMark(MicroBitPin *p) {
        int pulseTime = timePulse(p, 1, STOP_MARK + 500); // Use STOP_MARK as reference
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
    uint32_t readNecCodeCpp(int32_t pin, int32_t timeout) {
        MicroBitPin *p = getPin(pin);

        if (!p)
            return 0;

        // I can't get this to compile, so do it in TypeScript
        // p->setPull(PullUp); // Set pull-up for IR receiver

        clearIrErrorCpp(); // Clear any previous error

        int startTime = system_timer_current_time_us();

        waitForPinStateUntil(p, 0, startTime + timeout * 500); // wait for the low between codes
        if(waitForPinStateUntil(p, 1, startTime + timeout * 500) == 0) { // Wait for the start of the signal
            snprintf(irError, sizeof(irError), "Timeout waiting for start of signal ");
            return 0;
        }

        int header = readACGHeader(p);
        if (header == 0) {
            if (irError[0] == '\0') {
                snprintf(irError, sizeof(irError), "Error reading address or command");
            }
            return 0;
        } else if (header == 2) {
            return 0xFFFFFFFF; // Indicate repeat code
        }
        int address = readNecWord(p);
        int command = readNecWord(p);

        if (address < 0 || command < 0){
            if (irError[0] == '\0') {
                snprintf(irError, sizeof(irError), "Error reading address or command");
            }
            return 0;
        }

        uint32_t n = ((uint32_t)address<<16) | ((uint32_t)command);

        if (!readStopMark(p)) {
            snprintf(irError, sizeof(irError), "Error reading stop mark");
            return 0;
        }
        return n;
     
    }

}
