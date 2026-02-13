locals {
  cfg_env_defaults = {
    dev = {
      api_autoscale    = false # app_service_sku must be Premium tier to enable
      app_service_sku  = "B2"  # Basic tier
      enable_frontdoor = false
      postgresql_sku   = "B_Standard_B1ms"
    }
    test = {
      api_autoscale    = false # app_service_sku must be Premium tier to enable
      app_service_sku  = "B2"  # Basic tier
      enable_frontdoor = false
      postgresql_sku   = "B_Standard_B1ms"
    }
    prod = {
      api_autoscale    = true   # app_service_sku must be Premium tier to enable
      app_service_sku  = "P0v3" # Premium tier
      enable_frontdoor = true
      postgresql_sku   = "GP_Standard_D2s_v3"
    }
  }
  cfg = lookup(local.cfg_env_defaults, var.app_env, local.cfg_env_defaults.dev)

  app_service_sku_name = coalesce(var.app_service_sku_name, local.cfg.app_service_sku)
  enable_api_autoscale = coalesce(var.enable_api_autoscale, local.cfg.api_autoscale)
  enable_frontdoor     = coalesce(var.enable_frontdoor, local.cfg.enable_frontdoor)
  postgresql_sku_name  = coalesce(var.postgresql_sku_name, local.cfg.postgresql_sku)

  use_oidc = try(var.client_id != null, false)
}
