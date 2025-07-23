# Infrastructure

## Azure Login

Ensure you have the Azure CLI installed and configured. You can log in and set your subscription with the following
commands:

```sh
az login
az account set --subscription "<existing-subscription-id>"
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

## Terraform Linting

Ensure you have [TFLint](https://github.com/terraform-linters/tflint) installed.

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
```
