# LeagueIR NEC IR CCode Transmitter


This is a demonstration PXT project that you can use as a template for
building Micro:bit extensions. 

## Custom Docker Build Environment

This project includes a custom Docker container to replace the deprecated `pext/yotta` image used for building native MicroBit extensions. The container setup is located in the `docker/` directory.

### Docker Container Features

- **Ubuntu 20.04** base image for better yotta compatibility
- **Yotta 0.20.5** build system properly installed
- **Complete development environment** including Python 3, git, build tools
- **Dedicated build user** with appropriate permissions

### Building the Custom Container

To build the custom yotta Docker container:

```bash
cd docker
make build
```

The container is configured in `pxtarget.json` to be used automatically by PXT when building native code extensions.
