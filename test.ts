

serial.setBaudRate(BaudRate.BaudRate115200);

serial.writeLine("Starting NEC receiver test...");


if (true) {
    jtlinterface.onIrPacketReceived(DigitalPin.P1, function (id: number, status: number, command: number, value: number) {
        if (id == 0 && status == 0 && command == 0 && value == 0) {
            // Error 
            serial.writeLine("E: " + leagueir.irError);
        } else {
            // Valid packet received
            serial.writeLine("ID: " + id + ", " + leagueir.toHex(id) + 
                           " S: " + status + ", " + leagueir.toHex(status) + 
                           " C: " + command + ", " + leagueir.toHex(command) + 
                           " V: " + value + ", " + leagueir.toHex(value));
        }
        basic.pause(100);
    });
}

basic.forever(function () {
    let id = 0x123
    let status = 0x4;
    let cmd = 0x5;
    let value = 0x6;

    jtlinterface.sendIRPacket(DigitalPin.P0, id, status, cmd, value);
    basic.pause(1000);
})


