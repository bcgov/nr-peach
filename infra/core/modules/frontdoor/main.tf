# Front Door Profile
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "${var.app_name}-frontdoor"
  resource_group_name = var.resource_group_name
  sku_name            = var.frontdoor_sku_name

  tags = var.common_tags

  lifecycle {
    ignore_changes = [tags]
  }
}

# Front Door Firewall Policy
# Applies baseline protection at the edge, including managed rule sets and a simple rate limit rule.
resource "azurerm_cdn_frontdoor_firewall_policy" "main_firewall_policy" {
  count = var.enable_frontdoor_firewall ? 1 : 0

  name                = "${replace(var.app_name, "/[^a-zA-Z0-9]/", "")}frontdoorfirewall"
  resource_group_name = var.resource_group_name
  sku_name            = var.frontdoor_sku_name
  mode                = var.frontdoor_firewall_mode

  # Scrub Authorization header
  log_scrubbing {
    enabled = true

    scrubbing_rule {
      enabled        = true
      match_variable = "RequestHeaderNames"
      operator       = "Equals"
      selector       = "Authorization"
    }
  }

  # Managed Rules that work with the "Premium_AzureFrontDoor" sku
  managed_rule {
    type    = "DefaultRuleSet"
    version = "1.0"
    action  = "Log"
  }
  managed_rule {
    type    = "Microsoft_BotManagerRuleSet"
    version = "1.0"
    action  = "Block"
  }


  # Simple baseline rate limit
  custom_rule {
    name                           = "RateLimitByIP"
    enabled                        = true
    priority                       = 1
    type                           = "RateLimitRule"
    rate_limit_duration_in_minutes = var.rate_limit_duration_in_minutes
    rate_limit_threshold           = var.rate_limit_threshold
    action                         = "Block"

    match_condition {
      match_variable     = "RemoteAddr"
      operator           = "IPMatch"
      negation_condition = false
      match_values       = ["0.0.0.0/0"]
    }
  }

  tags = var.common_tags

  lifecycle {
    ignore_changes = [tags]
  }
}
