terraform {
  required_version = ">= 1.12.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.66.0"
    }
    azapi = {
      source  = "Azure/azapi"
      version = "2.9.0"
    }
  }
}
