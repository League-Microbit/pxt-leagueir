# LeaguePulse Pin Pulser

This is a demonstration PXT project that you can use as a template for
building Micro:bit extensions. 

## Getting started

If you don't have npm locally, install it. 

After cloning the repo, run `make setup` to install `pxt`, and the microbit target. 

Then you can run `make build` to build the target. Note that the compiler is
running removely, via a web request, so you may see a lot of 'Polling ...'
messages if the build server is slow.

If you microbit is plugged in and mounted at the standard place (
`/Volumes/MICROBIT` on a Mac) then `make deploy` will deploy the code. 