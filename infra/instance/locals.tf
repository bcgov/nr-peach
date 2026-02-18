locals {
  cfg_env_defaults = {
    dev = {
      enable_frontdoor = false
    }
    test = {
      enable_frontdoor = false
    }
    prod = {
      enable_frontdoor = true
    }
  }
  cfg = lookup(local.cfg_env_defaults, var.app_env, local.cfg_env_defaults.dev)

  database_host    = coalesce(var.database_host, data.azurerm_postgresql_flexible_server.postgresql.fqdn)
  database_name    = var.instance_name == "main" ? "app" : var.instance_name
  enable_frontdoor = coalesce(var.enable_frontdoor, local.cfg.enable_frontdoor)
  use_oidc         = try(var.client_id != null, false)
}
