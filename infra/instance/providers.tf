terraform {
  required_version = ">= 1.12.0"
  backend "azurerm" {
    resource_group_name  = ""
    storage_account_name = ""
    container_name       = "tfstate"
    key                  = ""
  }
  required_providers {
    azapi = {
      source  = "Azure/azapi"
      version = "2.7.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.54.0"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      # TODO: set to true later; Allow deletion of resource groups with resources, since we are in exploration.
      prevent_deletion_if_contains_resources = false
    }
  }
  client_id       = var.client_id
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
  use_oidc        = local.use_oidc
}
