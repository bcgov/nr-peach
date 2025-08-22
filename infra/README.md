# Infrastructure

> [!NOTE]
> Documentation on this page is still under construction

## Overview

Our infrastructure is split into two logical lifecycles: core and instance.

- Core: Contains all shared baseline infrastructure such as the database, servers, monitoring and networking
- Instance: Contains all infrastructure specific to a single instance of the application and their migrations

## Azure Login

Ensure you have the Azure CLI installed and configured. You can log in and set your subscription with the following
commands:

```sh
az login
az account set --subscription "<existing-subscription-id>"
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

Since the core and instance infrastructure are separate Terraform states, you will need to change directories into the
infrastructure you wish to work on first.

## Terraform Linting

Ensure you have [TFLint](https://github.com/terraform-linters/tflint) installed. TFLint will focus on ensuring that
your code is properly indented and free of syntax errors.

```sh
tflint init
tflint --recursive -f compact
tflint --fix
```

## Terraform Commands

Ensure you have [Terraform](https://www.terraform.io/downloads.html) installed. You can run the following commands to
initialize, format, validate, plan, and apply your Terraform configuration:

```sh
terraform init

terraform fmt -recursive
terraform validate

terraform plan
terraform apply

terraform destroy
```

### Terraform Arguments

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

Environment variables can be passed into Terraform through the `TF_VAR_` prefix. For example, to set the `region`
variable, you can use the following command:

```sh
export TF_VAR_region="canada-central"
```

### Instance Specific Lifecycles

Our infrastructure is divided into two separate lifecycles: core and instance. Core focuses on the baseline shared
infrastructure that is common to the entire environment. Instance focuses on the specific application deployment and
all of the supporting elements.

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

#### Core

For the core infrastructure, a direct init and apply should suffice as it is a direct mapping of infrastructure. You can
use the following commands (change the angle bracket values to their appropriate values):

```sh
terraform init -upgrade -reconfigure \
  -backend-config="resource_group_name=<123456-env-networking>" \
  -backend-config="storage_account_name=<tfstatenrpeachenv>"

terraform apply -auto-approve
```

#### Instance

For the instance infrastructure, you will need to specify the appropriate key and variable files for the instance. You
can use the following commands (change the angle bracket values to their appropriate values):

##### Main

```sh
terraform init -upgrade -reconfigure \
  -backend-config="resource_group_name=<123456-env-networking>" \
  -backend-config="storage_account_name=<tfstatenrpeachenv>" \
  -backend-config="key=<main.instance.tfstate>"

terraform apply -auto-approve -var-file=<terraform.main.tfvars>
```

##### Pull Request

```sh
terraform init -upgrade -reconfigure \
  -backend-config="resource_group_name=<123456-env-networking>" \
  -backend-config="storage_account_name=<tfstatenrpeachenv>" \
  -backend-config="key=<pr/pr-123.instance.tfstate>"

terraform apply -auto-approve -var-file=<terraform.pr.tfvars>
```

### Terraform Cleanup

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
