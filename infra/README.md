# TBD

```sh
az login
az account set --subscription "<existing-subscription-id>"
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
```

```sh
terraform init
terraform plan
terraform apply
```
