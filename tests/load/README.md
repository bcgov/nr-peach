# Load Tests

This directory contains the load tests for the app. The tests are designed to simulate high-volume real-world usage
patterns and identify potential bottlenecks in the system. We leverage the [k6](https://k6.io/) load testing tool to
execute these tests, which allows us to write tests in TypeScript and run them efficiently.

## Installation Guide

This section outlines how to quickly set up and run k6 locally.

### Prerequisites

You will need the following installed on your machine before you can proceed:

- Install [Node.js 24 LTS](https://nodejs.org) or higher
- Install [Grafana k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)

### Dependencies

If this has not already been done at the root directory, install code dependencies by running:

```sh
npm ci
```

This command installs the dependencies as defined by the lockfile.

### Install

Depending on your operating system, you can [install k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) using
one of the following methods:

#### MacOS

Using [Homebrew](https://brew.sh/):

```sh
brew install k6
```

#### Windows

Using [Chocolatey](https://chocolatey.org/):

```sh
choco install k6
```

Using [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/):

```sh
winget install k6 --source winget
```

## Running Load Tests

Our load tests are written in TypeScript and use the [k6](https://k6.io/) load testing tool. The tests are located in
the `tests/load` directory. Each endpoint with defined tests has its own file, named after the functional action the
endpoint will perform.

> [!NOTE]
> Make sure you have the main nr-peach application running locally somewhere else before running the tests.

The following tests are currently available:

> [!NOTE]
> The following commands assume your current terminal directory is at this folder (`/tests/load`).

```sh
k6 run getRecords.ts
```

```sh
k6 run putRecords.ts
```

The tests will automatically connect to the local instance of the app.

### Configuration

By default, our k6 load tests are configured to run with a maximum of 10 virtual users (VUs). You can adjust this
number by setting the `MAX_VU` environment variable in the `/tests/load/helpers/options.ts` file. By default, our load
test options will have the following behaviour:

- The load test runs in three stages:
  - Ramp up to `MAX_VU` virtual users over 5 seconds.
  - Hold at `MAX_VU` users for 20 seconds.
  - Ramp down to 0 users over 5 seconds.
- Thresholds:
  - 95% of HTTP requests must complete in under 100ms.
  - HTTP request failure rate must stay below 0.1%; if exceeded, the test aborts after 1 second.
- The test will throw an error if any threshold is breached.

If you want to change or extend the k6 testing behaviour, visit the
[k6 Options reference guide](https://grafana.com/docs/k6/latest/using-k6/k6-options/reference/) for more details on how
to configure the tests.
