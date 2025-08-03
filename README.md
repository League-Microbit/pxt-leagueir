# LeagueIR NEC IR CCode Transmitter

This extension provides routines for sending and recieving NEC format
IR commands, formatted as two 16 bit numbers, an address and a command. 

To send IR codes, you can connect an IR LED directly to a Micro:bit pins;
 because the LED is pulsed at 50% duty cycle, and the current from the Micro:bit
 limited, there doesnt seem to be any damage from excessive current to the LED. 

 To recieve IR commands, you must use a 3-pin IR reciever module, which will
 include an indicator LED and pull up resistor, or, if you use a bare 1838IR
 reciever, you must add a pull-up resistor. 

