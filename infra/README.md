# Infrastructure

This readme outlines the general cloud infrastructure as code used by nr-peach. It is primarily structured for the Azure
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

The following tools are required to install and maintain the cloud infrastructure:

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [GitHub CLI](https://cli.github.com)
- [Terraform](https://www.terraform.io/downloads.html)
- [TFLint](https://github.com/terraform-linters/tflint)

## CLI Tool Login

First login to your Azure subscription. You can choose the subscription you will be interacting with interactively.
Remember to change directories between core and instance as needed.

```sh
az login
az account set --subscription "<existing-subscription-id>"
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

Then proceed with logging into your GitHub account with the following interactive command:

```sh
gh auth login
```

## Repository Environment Setup

Before any of the automated infrastructure CI/CD will run, you will need to run the `initial-azure-setup.sh` script.
This can be found in the `bcgov/quickstart-azure-containers` repository as
[initial-azure-setup.sh](https://github.com/bcgov/quickstart-azure-containers/blob/main/initial-azure-setup.sh). Please
take some time familiarizing yourself with what this script does first prior to running it. Upon execution, it will
create and manage all of the necessary permissions, secrets and configuration for the pipeline automations to function.

> [!NOTE]
> It is strongly recommended that you have group ownership permissions on the three `DO_PuC_Azure_Live_*` security
> groups for your subscription set. Check the [Azure Security Groups](#azure-security-groups) section for details.

```sh
# General script help documentation
curl -sSL https://raw.githubusercontent.com/bcgov/quickstart-azure-containers/refs/heads/main/initial-azure-setup.sh | bash -s -- -help

# Example invocation for test environment
curl -sSL https://raw.githubusercontent.com/bcgov/quickstart-azure-containers/refs/heads/main/initial-azure-setup.sh | bash -s -- -g "123456-test-networking" -n "nr-peach-test-identity" -r "bcgov/nr-peach" -e "test" --create-storage --create-github-secrets
```

You should see some kind of IPv4 address with a `/24` postfixed to it in the output.

Once you have completed these steps, check your new GitHub environment and make sure the following have been populated
under environment secrets:

- `AZURE_CLIENT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_TENANT_ID`
- `VNET_NAME`
- `VNET_RESOURCE_GROUP_NAME`

Also check to make sure that the environment variables below have been populated:

- `STORAGE_ACCOUNT_NAME`

### Azure Security Groups

While it is possible to set up without explicitly being an owner of those security groups, you will need to perform
extra manual steps with the help of your product owner or technical lead in order to properly allocate and assign
permissions to the newly generated service account. As you run the script, watch the logs for any warnings that look
similar to the following:

```sh
[WARNING] Current user is not an owner of security group 'DO_PuC_Azure_Live_123456_Contributor'
[WARNING] Skipping security group assignment due to insufficient permissions or missing group
[WARNING] Manual action required: Add managed identity 'nr-peach-env-identity' to security group
'DO_PuC_Azure_Live_123456_Contributor' in Azure Portal
```

To resolve these warnings, you will need to work with your product owner on the Azure Portal. Have them login to the
Azure Portal and losely do the following:

- In the top searchbar, search for `DO_PuC_Azure_Live_123456`, where 123456 represents your subscription badge.
  - They should see three distinct groups with the Owner, Contributor and Reader suffixes.
- To add the service account binding, visit the Contributor group, and then click on "View group members"
  - Click "+ Add members", and have them search for something similar to `nr-peach-env-identity`.
  - In the event there are multiple search hits, double check the script generation log to make sure the uuid values
    match up.
- If adding a user as an owner, for each of these three groups, visit them, then click "View group owners"
  - Click "+ Add owners", and have them search for you and add to the owners list

> [!NOTE]
> Group ownership may be inconsistent in the Landing Zone as it is possible for automation periodically drop manually
> added users.

## GitHub Actions Management

Under the GitHub Actions tab on the nr-peach repository, you should see two pinned workflows: `Manage Core Infra` and
`Manage Instance Infra`. These workflows allow you and your team to manually invoke Terraform operations to manage the
infrastructure. Most of the time, you will not need to do this as the general pipelines should take care of things.
However, there will be situations where you will need to manually facilitate a deployment, which can be done via these
actions.

## Terraform Linting

```sh
# Initialize dependencies
tflint init

# Reports linting report in one-line format
tflint --recursive -f compact

# Auto-fixes simple linting issues
tflint --fix
```

## Terraform Workflow

### Common Commands

```sh
# Initialize dependencies
terraform init

# Formats all code within the directoroy
terraform fmt -recursive

# Ensures there are no syntax errors in your Terraform files
terraform validate

# Generate a plan to see what changes will be made
terraform plan

# Applies changes to the infrastructure based on the plan
terraform apply

# Destroys all resources and removes them from the state
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
terraform init -upgrade -reconfigure \
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

### Database Protection

To prevent accidental data loss, we manually apply a `CanNotDelete` lock to the `app` database. This also implicitly
protects the parent Flexible Server from deletion.

#### Apply Lock

Replace `<ENV>` with your target environment (e.g., `dev`, `prod`):

```sh
az lock create --name "app-database" --resource-group "nr-permitting-core-rg" --lock-type CanNotDelete --resource-type "Microsoft.DBforPostgreSQL/flexibleServers" --resource-name "nr-peach-<ENV>-postgresql/databases/app"
```

> [!NOTE]
> As of February 2026, the Azure Portal cannot apply locks at the database level.
> Use the Azure CLI for this specific granularity.

#### Verify Locks

```sh
az lock list
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

### Divergent States

There may be rare scenarios where the terraform state suddenly hard diverges from what is deployed. One possible
scenario is when one of the assigned private endpoints gets a different assigned subnet_id, which causes a cascade of
all deployed resources to need to be destroyed and rebuilt. You can recognize this situation if you see something
similar to the following:

```sh
  # module.postgresql.azurerm_private_endpoint.postgresql must be replaced
-/+ resource "azurerm_private_endpoint" "postgresql" {
      ~ subnet_id                     = (sensitive value) # forces replacement
    }
```

In these situations, unfortunately the only known mitigation is to perform the following steps:

- `terraform destroy` all instances
- `terraform destroy` core
- Wait ~5 minutes, then `terraform apply` core again
- Wait ~5 minutes after the above, and then `terraform apply` the instances

A full rebuild of the infrastructure is needed, as any future apply operations collides against the divergent subnet_id.
As of 2025-11-14, we still do not know what is the root cause of this potential divergence scenario.

## Errata

### Virtual Network Address Space

The address space value can be found by inspecting your subscription in the Azure portal, or with
the following command:

```sh
# Example invocation for test environment network
az network vnet show --name 123456-test-vwan-spoke --resource-group 123456-test-networking --query "addressSpace.addressPrefixes" -o tsv
```

## Style Conventions

All Terraform related files should be styled and modelled as described in the official style guide at
<https://developer.hashicorp.com/terraform/language/style>

### File Naming

The Terraform HCL files should be split up and named as described in the official style guide at
<https://developer.hashicorp.com/terraform/language/style#file-names>

### Network Rules

#### Naming

Rule names should attempt to match Microsoft style conventions where possible. In general, a rule will be Pascal Case
with the general format of `<AccessPolicy><Subnet/Resource><Direction>`:

- AccessPolicy typically is an an `Allow` or `Deny`
- Subnet/Resource refers to the virtual subnet or cluster of resources
- Direction typically refers to the flow of traffic, usually either `InBound` or `OutBound`

Some examples of policy names:

- `AllowInternetInBound`
- `AllowPrivateEndpointOutBound`
- `DenyAllInBound`

Ref: <https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview#default-security-rules>

#### Priority

Network Rule Priorities should be set as follows:

| Purpose                                                                     | Recommended Priority | Reason                                                                         |
| --------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| Critical allow rules (i.e. Azure Front Door)                                | 100–199              | You want AFD (especially health probes) to be allowed before deny rules apply. |
| Service-to-service allow rules (i.e. APIM -> App Service, internal systems) | 200–299              | Clear separation from AFD and still above any default deny-like rules.         |
| DevOps / corporate IP allowlists                                            | 300–399              | Typically less critical than core platform traffic.                            |
| Temporary troubleshooting IP rules                                          | 400–499              | Easy to add/remove without conflicting with permanent rules.                   |
| Catch-all denies (if ever explicitly needed)                                | 800–900              | Keep at the bottom.                                                            |

When numbering network rules, you should always start by the dividing by 10 pattern (i.e. number 200, 210, 220, etc.)
as this allows for easy addition or removal of future rules without affecting existing orderings. In Azure App Service,
strongly consider setting `ip_restriction_default_action` to deny by default to prevent unexpected traffic from passing
through.
