leagueir.onNecReceived(DigitalPin.P0, function (address, command) {
    serial.writeValue("x", address)
    serial.writeValue("y", command)
})
basic.forever(function () {
	
})
