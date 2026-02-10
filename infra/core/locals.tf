locals {
  cfg_env_defaults = {
    dev = { # Basic tier
      app_service_sku = "B2"
      postgresql_sku  = "B_Standard_B1ms"
    }
    test = { # Basic tier
      app_service_sku = "B2"
      postgresql_sku  = "B_Standard_B1ms"
    }
    prod = { # Production tier
      app_service_sku = "P1v3"
      postgresql_sku  = "GP_Standard_D2s_v3"
    }
  }
  cfg = lookup(local.cfg_env_defaults, var.app_env, local.cfg_env_defaults.dev)

  app_service_sku_name = coalesce(var.app_service_sku_name, local.cfg.app_service_sku)
  postgresql_sku_name  = coalesce(var.postgresql_sku_name, local.cfg.postgresql_sku)

  use_oidc = try(var.client_id != null, false)
}
