# NR Permitting Exchange, Aggregation and Collection Hub

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bcgov_nr-peach&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=bcgov_nr-peach)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bcgov_nr-peach&metric=coverage)](https://sonarcloud.io/summary/new_code?id=bcgov_nr-peach)
[![Tests](https://github.com/bcgov/nr-peach/actions/workflows/unit-tests.yaml/badge.svg)](https://github.com/bcgov/nr-peach/actions/workflows/unit-tests.yaml)
[![CodeQL](https://github.com/bcgov/nr-peach/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/bcgov/nr-peach/actions/workflows/github-code-scanning/codeql)

[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_nr-peach&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_nr-peach)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_nr-peach&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_nr-peach)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=bcgov_nr-peach&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=bcgov_nr-peach)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_nr-peach&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_nr-peach)

[![Issues](https://img.shields.io/github/issues/bcgov/nr-peach)](/../../issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/bcgov/nr-peach)](/../../pulls)
[![Lifecycle:Maturing](https://img.shields.io/badge/Lifecycle-Maturing-007EC6)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

A microservice focused on permitting exchange, aggregation and collection using PIES.

## Directory Structure

```txt
.devcontainer              - VSCode Dev Container configurations
.github/                   - GitHub PR and Issue templates
.vscode/                   - VSCode environment configurations
infra/                     - Terraform Infrastructure as Code
├── core/                  - Core Shared Infrastructure
└── instance/              - Instance Specific Infrastructure
src/                       - Node.js web application
├── controllers/           - Controller Layer
├── db/                    - Database Layer
├── docs/                  - API Documentation
├── middlewares/           - Middleware Layer
├── public/                - Public Assets
├── repositories/          - Repository Layer
├── routes/                - Routes Layer
├── services/              - Services Layer
├── types/                 - TypeScript Declarations
├── utils/                 - Utilities
└── validators/            - Validator Layer
tests/                     - Test Suites
├── load/                  - K6 load tests
└── unit/                  - Node.js web application tests
CODE-OF-CONDUCT.md         - Code of Conduct
COMPLIANCE.yaml            - BCGov PIA/STRA compliance status
CONTRIBUTING.md            - Contributing Guidelines
Dockerfile                 - Dockerfile Image definition
LICENSE                    - License
server.ts                  - Node.js server entrypoint
SECURITY.md                - Security Policy and Reporting
```

## Installation Guide

This section outlines how to quickly set up and run the app locally.

### Prerequisites

You will need the following installed on your machine before you can proceed:

- Install [Node.js 24 LTS](https://nodejs.org) or higher
- Install [VSCode](https://code.visualstudio.com)
- Install VSCode [Recommended Extensions](https://code.visualstudio.com/docs/editor/extension-marketplace#_workspace-recommended-extensions)
  - This can be done by searching `@recommended` in the Extensions tab, and then
    clicking the `Install Workspace Recommended Extensions` button.
- Install Postgres 16.x or higher

### Install

```sh
npm ci
```

This command installs the dependencies as defined by the lockfile.

#### Environment Variables

```sh
cp .env.default .env
```

If you do not have a `.env` file in the root directory, create a copy of the
`.env.default` and modify as necessary.

#### Database Setup

> [!NOTE]
> You may skip the following section if the `APP_AUTOMIGRATE` environment variable is set to `true`, as the application
> will automatically migrate and seed the database when it starts.

```sh
npm run migrate:latest
```

This command ensures that your database schema is up-to-date.

```sh
npm run seed:run
```

This command pre-populates your database with common data entries non-destructively.

### Run Local Development

```sh
npm run dev
```

This command starts a local development server watching the source code
directory. Most user changes will automatically reboot the server.

### Run Production

```sh
npm run start
```

This command starts the server in production mode.

## Getting Help or Reporting an Issue

To report bugs/issues/features requests, please file an
[issue](https://github.com/bcgov/nr-peach/issues).

## How to Contribute

If you would like to contribute, please see our [contributing](CONTRIBUTING.md)
guidelines.

Please note that this project is released with a
[Contributor Code of Conduct](CODE-OF-CONDUCT.md). By participating in this
project you agree to abide by its terms.

## License

```txt
Copyright 2025 Province of British Columbia

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
