# Infrastructure

This readme outlines the general cloud infrastructure as code used by nr-peach. It is mainly structured for the Azure
Cloud environment.

## Overview

Our infrastructure is split into two logical lifecycles:

- **Core**: Shared baseline infrastructure (database, servers, monitoring, networking)
- **Instance**: Infrastructure specific to a single application instance

Core should only need to be applied seldomly as the infrastructure should be relatively static in nature, while
instances will have various lifecycles depending on their function and purpose. The most common pattern will be to have
a permanent `main` instance, which serves as the main application for the environment. Lower environments such as dev
may have semi-ephemeral PR instances (such as `pr-123`) that will be created and destroyed as needed.

While we keep our core and instance lifecycles isolated from each other, we still do need to pass some information
around. The majority of this can be derived by polling the cloud service itself for the current state. However, things
such as the database master password will need to be passed around securely via CI/CD actions. We achieve this via the
`terraform output -raw database_master_password` command. This will be used to pass values around via environment
variables for later workflow steps.

Our infrastructure paradigm aims to ensure that the CI/CD process is able to be replicated manually by a local developer
in the event some things go wrong or need to be debugged. We will outline some of the key commands and workflows that
can be used to manage the infrastructure below.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Terraform](https://www.terraform.io/downloads.html)
- [TFLint](https://github.com/terraform-linters/tflint)

## Azure Login

Remember to change directories between core and instance as needed.

```sh
az login
az account set --subscription "<existing-subscription-id>"
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

## Terraform Linting

```sh
tflint init
tflint --recursive -f compact
tflint --fix
```

## Terraform Workflow

### Common Commands

```sh
terraform init

terraform fmt -recursive
terraform validate

terraform plan
terraform apply

terraform destroy
```

#### Common Arguments

When working with Terraform, you may need to pass various arguments to customize the behavior of your commands. Some
common arguments include:

- `-auto-approve`: Skip interactive approval for plan and apply
- `-backend-config`: Configure the backend for storing Terraform state
- `-migrate-state`: Migrate the Terraform state to a new backend (only used if doing large relocations)
- `-no-color`: Disable colored output (usually used for cleaning up CI/CD output logs)
- `-reconfigure`: Reconfigure the backend settings (this mostly happens when we context switch instances)
- `-recursive`: Enable recursive module processing (usually used for formatting purposes)
- `-upgrade`: Upgrade the provider plugins (this will happen frequently as we pin on patch releases)
- `-var`: Set a variable in the Terraform configuration
- `-var-file`: Specify a file containing variable definitions

#### Environment Variables

Environment variables can be passed into Terraform through the `TF_VAR_` prefix. For example, to set the `region`
variable, you can use the following command:

```sh
export TF_VAR_region="canada-central"
```

#### Variable Files

For local machine deployments, you can create `*.tfvars` files to define your variables. These files can then be passed
to Terraform using the `-var-file` option. By default, Terraform will look for a file named `terraform.tfvars` in the
current directory. Specifying an additional `-var-file` option allows you to include other variable files as needed,
which will overlay on top of the `terraform.tfvars` if that file also already exists.

For core infrastructure, a `terraform.tfvars` should be sufficient. However, for instance infrastructure, we recommend
creating a `terraform.main.tfvars`, `terraform.pr.tfvars` and `terraform.tfvars` file to cover the different
configurations. Anything common should reside in `terraform.tfvars`, and anything that is specifically different should
be stored in the respective `terraform.main.tfvars` or `terraform.pr.tfvars` files.

## Core Infrastructure

For the core infrastructure, a direct init and apply should suffice as it is a direct mapping of infrastructure. You can
use the following commands (change the angle bracket values to their appropriate values):

```sh
terraform init -upgrade \
  -backend-config="resource_group_name=<123456-env-networking>" \
  -backend-config="storage_account_name=<tfstatenrpeachenv>"

terraform apply -auto-approve
```

## Instance Infrastructure

For the instance infrastructure, you will need to specify the appropriate key and variable files for the instance. You
can use the following commands (change the angle bracket values to their appropriate values):

### Main Instance

```sh
terraform init -upgrade -reconfigure \
  -backend-config="resource_group_name=<123456-env-networking>" \
  -backend-config="storage_account_name=<tfstatenrpeachenv>" \
  -backend-config="key=<main.instance.tfstate>"

terraform apply -auto-approve -var-file=<terraform.main.tfvars>
```

### Pull Request Instance

```sh
terraform init -upgrade -reconfigure \
  -backend-config="resource_group_name=<123456-env-networking>" \
  -backend-config="storage_account_name=<tfstatenrpeachenv>" \
  -backend-config="key=<pr/pr-123.instance.tfstate>"

terraform apply -auto-approve -var-file=<terraform.pr.tfvars>
```

## Cleanup

To clean up your Terraform environment and remove all resources, you can use the following command:

```sh
terraform destroy -auto-approve
```

This command will destroy all resources defined in your Terraform configuration without requiring interactive approval.
Please note that this action is irreversible and will permanently delete all resources managed by Terraform, so make
sure you know what you are doing!

In addition, once the infrastructure is destroyed, we will also want to clean up the Terraform state files from our
backend storage account. You can do this by running the following command:

```sh
az storage blob delete \
  --account-name <tfstatenrpeachenv> \
  --container-name tfstate \
  --name <pr/pr-123.instance.tfstate>
```

This should drop the file from the backend storage account and ensure that we keep the storage account clean and free
of any orphaned state files.

## Troubleshooting

### Releasing State Lock

There will be times when you need to manually release the state lock in Terraform. This can happen if a previous
operation was interrupted or failed, leaving the state locked. An example state lock error:

```sh
│ Error: Error acquiring the state lock
│
│ Error message: state blob is already locked
│ Lock Info:
│   ID:        00000000-0000-0000-0000-000000000000
│   Path:      tfstate/main.instance.tfstate
│   Operation: OperationTypePlan
│   Who:       someuser@somehost
│   Version:   1.13.0
│   Created:   2025-08-26 16:13:06.961696 +0000 UTC
│   Info:
```

To release the state lock, you can use the following command:

```sh
terraform force-unlock <LOCK_ID>
```

Replace `<LOCK_ID>` with the ID of the lock you want to release. You can find the lock ID in the error message returned
by Terraform when it fails to acquire the lock.

The alternative way to release the state lock is to manually delete the lock file from the backend storage. This
approach should be used with caution, as it can lead to inconsistencies if not done properly.

- Visit your backend storage account via Azure Portal and navigate to the `tfstate` container.
- Locate the lock file (e.g., `main.instance.tfstate`) and break the lease on it.
- Remove the `Terraformlockid` metadata on the same tfstate lock file.
