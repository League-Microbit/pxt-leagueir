
## Getting started

If you don't have npm locally, install it. 

After cloning the repo, run `make setup` to install `pxt`, and the microbit target. 

Then you can run `make build` to build the target. Note that the compiler is
running remotely, via a web request, so you may see a lot of 'Polling ...'
messages if the build server is slow.

If you microbit is plugged in and mounted at the standard place (
`/Volumes/MICROBIT` on a Mac) then `make deploy` will deploy the code. 

### Running MakeCode Locally

You can run makecode locally using `pxt serve`, but apparently only from the pxt-microbit source
directory. Here are the instructions: 

https://github.com/microsoft/pxt-microbit/tree/master?tab=readme-ov-file#local-server-setup

This involved going to a new directory ( probably parallel to your microbit project ), then:

```bash
git clone https://github.com/microsoft/pxt-microbit
cd pxt-microbit
install -g pxt
npm install
pxt serve
```

## Docker Build Environment

To run the compilation locally, you will need to setup Docker and build the 
container in the `docker` directory. 

### Available Docker Commands

- `make build` - Build the Docker image
- `make rebuild` - Build with no cache (force rebuild)
- `make push` - Push image to registry (requires login)
- `make clean` - Remove the Docker image locally
- `make info` - Show image information
- `make test` - Test the container
- `make help` - Show help message

### Custom Build Configuration

The project uses a custom `pxtarget.json` configuration that specifies:
- **Docker image**: `leaguepulse/yotta:latest`
- **Build engine**: `yotta`
- **Target**: `bbc-microbit-classic-gcc-nosd`

This replaces the deprecated `pext/yotta` image and provides a stable, maintainable build environment for MicroBit extensions.