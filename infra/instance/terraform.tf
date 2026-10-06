terraform {
  required_version = ">= 1.12.0"
  required_providers {
    azapi = {
      source  = "Azure/azapi"
      version = "2.13.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.81.0"
    }
  }
}
