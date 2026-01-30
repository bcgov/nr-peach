terraform {
  required_version = ">= 1.12.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "4.57.0"
    }
    azapi = {
      source  = "Azure/azapi"
      version = "2.8.0"
    }
    # Probably won't need this, it's for DNS wait script
    # null = {
    #   source  = "hashicorp/null"
    #   version = "3.2.4"
    # }
  }
}
