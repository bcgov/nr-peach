locals {
  cloudbeaver_count = var.enable_cloudbeaver && var.instance_name == "main" ? 1 : 0
  database_host     = var.database_host != null ? var.database_host : data.azurerm_postgresql_flexible_server.postgresql.fqdn
  database_name     = var.instance_name == "main" ? "app" : var.instance_name
  use_oidc          = try(var.client_id != null, false)
}
