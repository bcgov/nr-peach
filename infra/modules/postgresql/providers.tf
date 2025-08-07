terraform {
  required_version = ">= 1.12.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.38.1"
    }
    azapi = {
      source  = "Azure/azapi"
      version = "2.5.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "0.13.1"
    }
  }
}
