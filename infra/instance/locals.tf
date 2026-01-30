locals {
  cloudbeaver_count               = var.enable_cloudbeaver && var.instance_name == "main" ? 1 : 0
  database_host                   = var.database_host != null ? var.database_host : data.azurerm_postgresql_flexible_server.postgresql.fqdn
  database_name                   = var.instance_name == "main" ? "app" : var.instance_name
  frontdoor_firewall_policy_count = var.enable_frontdoor_firewall && var.frontdoor_firewall_policy_name != null ? 1 : 0
  frontdoor_firewall_policy_id    = try(data.azurerm_cdn_frontdoor_firewall_policy.frontdoor_firewall_policy[0].id, null)
  use_oidc                        = try(var.client_id != null, false)
}
