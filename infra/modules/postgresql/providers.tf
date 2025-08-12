terraform {
  required_version = ">= 1.12.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.39.0"
    }
    azapi = {
      source  = "Azure/azapi"
      version = "2.5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "3.2.4"
    }
    time = {
      source  = "hashicorp/time"
      version = "0.13.1"
    }
  }
}
