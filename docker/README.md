# Custom Yotta Docker Container

This directory contains the Docker configuration for building a custom yotta container to replace the deprecated `pext/yotta` image.

## Overview

The custom Docker container includes:
- Ubuntu 22.04 base image
- Python 3 and pip
- Git and build tools (build-essential, cmake, ninja-build)
- srecord for binary manipulation
- Yotta build system
- A dedicated build user with appropriate permissions

## Building the Container

To build the Docker container, run:

```bash
cd docker
make build
```

Or to rebuild without cache:

```bash
make rebuild
```

## Configuration

The container is configured in `pxtarget.json` at the project root with:
- Docker image: `leaguepulse/yotta:latest`
- Build engine: `yotta`
- Target: `bbc-microbit-classic-gcc-nosd`

## Usage

The container is automatically used by PXT when building native extensions. The build process:

1. PXT detects native code (C++ files)
2. Reads configuration from `pxtarget.json`
3. Uses the specified Docker image (`leaguepulse/yotta:latest`)
4. Runs the yotta build process inside the container
5. Extracts the compiled binary

## Available Make Targets

- `make build` - Build the Docker image
- `make rebuild` - Build with no cache (force rebuild)
- `make push` - Push image to registry (requires login)
- `make clean` - Remove the Docker image locally
- `make info` - Show image information
- `make test` - Test the container
- `make help` - Show help message

## Testing

To test the container locally:

```bash
make test
```

This will run the container and attempt to execute the help command to verify it's working correctly.

## Deployment

The container can be pushed to a Docker registry:

```bash
make push
```

Note: You'll need to be logged into the appropriate Docker registry and have push permissions.

## Troubleshooting

If you encounter build issues:

1. Ensure Docker is running
2. Check that you have sufficient disk space
3. Try rebuilding without cache: `make rebuild`
4. Check the Docker logs for specific error messages

## Integration with PXT

The `pxtarget.json` file in the project root configures PXT to use this custom container. The key configuration is:

```json
{
  "compileService": {
    "dockerImage": "leaguepulse/yotta:latest",
    "buildEngine": "yotta"
  }
}
```

This replaces the deprecated `pext/yotta` image with our custom-built container.
