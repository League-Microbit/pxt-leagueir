

serial.writeLine("Starting tests");

//irtest.testIPReceive();
//irtest.testIPSend();
//irtest.testRadioChannelSend();
//irtest.testRadioChannelReceive();

//irtest.testSendNecCode();

//irtest.testNextNecCode();

//irtest.testPulseTiming();
//irtest.testTimedBit();

//irtest.testCalibrate();

//irtest.testPulseIn();



leagueir.onNecReceived(DigitalPin.P16, function (address, command) {
    serial.writeValue("x", address)
    serial.writeValue("y", command)
})
basic.forever(function () {
	
})