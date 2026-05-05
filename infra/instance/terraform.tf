terraform {
  required_version = ">= 1.12.0"
  required_providers {
    azapi = {
      source  = "Azure/azapi"
      version = "2.9.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.71.0"
    }
  }
}
