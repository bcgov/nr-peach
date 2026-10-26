provider "azurerm" {
  resource_providers_to_register = [
    "Microsoft.AlertsManagement",
    "Microsoft.Cdn",
    "Microsoft.DBforPostgreSQL",
    "Microsoft.Network",
    "Microsoft.OperationalInsights",
    "Microsoft.Resources",
    "Microsoft.Web",
    "microsoft.insights"
  ]

  features {
    enhanced_validation {
      locations                   = true
      resource_providers          = true
      preflight_enabled           = true
      preflight_location_fallback = "canadacentral"
    }
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
  client_id       = var.client_id
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id
  use_oidc        = local.use_oidc
}
