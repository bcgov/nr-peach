# -----------------------------------------
# Front Door Module Terraform Configuration
# -----------------------------------------

# Front Door Profile
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "${var.app_name}-frontdoor"
  resource_group_name = var.resource_group_name
  sku_name            = var.frontdoor_sku_name

  tags = var.common_tags

  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# Front Door Firewall Policy
# Applies baseline protection at the edge, including managed rule sets and a simple rate limit rule.
resource "azurerm_cdn_frontdoor_firewall_policy" "main_firewall_policy" {
  name                = "${replace(var.app_name, "/[^a-zA-Z0-9]/", "")}${var.app_env}frontdoorfirewall"
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

  # the 'managed_rule' code block is only supported with the "Premium_AzureFrontDoor" sku
  dynamic "managed_rule" {
    for_each = var.frontdoor_sku_name == "Premium_AzureFrontDoor" ? [
      {
        type    = "DefaultRuleSet"
        version = "1.0"
        action  = "Log"
      },
      {
        type    = "Microsoft_BotManagerRuleSet"
        version = "1.1"
        action  = "Block"
      },
      {
        type    = "BotProtection"
        version = "preview-0.1"
        action  = "Block"
      }
    ] : []
    content {
      type    = managed_rule.value.type
      version = managed_rule.value.version
      action  = managed_rule.value.action
    }
  }

  # Simple baseline rate limiter
  custom_rule {
    action                         = "Block"
    enabled                        = true
    name                           = "RateLimitByIP"
    priority                       = 100
    rate_limit_duration_in_minutes = var.rate_limit_duration_in_minutes
    rate_limit_threshold           = var.rate_limit_threshold
    type                           = "RateLimitRule"
    match_condition {
      match_values       = ["0.0.0.0/0"]
      match_variable     = "RemoteAddr"
      negation_condition = false
      operator           = "IPMatch"
    }
  }
  # Block Non-Canadian requests
  custom_rule {
    action   = "Block"
    enabled  = true
    name     = "BlockByNonCAGeoMatch"
    priority = 110
    type     = "MatchRule"
    match_condition {
      match_values       = ["CA"]
      match_variable     = "SocketAddr"
      negation_condition = true
      operator           = "GeoMatch"
    }
  }
  # Block API requests without Authorization header
  custom_rule {
    action   = "Block"
    enabled  = true
    name     = "BlockByAPIWithoutAuthHeader"
    priority = 200
    type     = "MatchRule"
    match_condition {
      match_values       = ["^https?://[^/]+/api/v1/[^?].+$"]
      match_variable     = "RequestUri"
      negation_condition = false
      operator           = "RegEx"
    }
    match_condition {
      match_values       = ["Bearer "]
      match_variable     = "RequestHeader"
      negation_condition = true
      operator           = "BeginsWith"
      selector           = "Authorization"
    }
  }

  tags = var.common_tags

  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}
