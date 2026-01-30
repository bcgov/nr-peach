// TODO: Move frontend into ACA API module (main.tf)

# Front Door Endpoint
# Creates the Front Door endpoint (the *.azurefd.net domain). Routes attach here.
resource "azurerm_cdn_frontdoor_endpoint" "api" {
  name                     = "${var.app_name}-${var.instance_name}-api"
  cdn_frontdoor_profile_id = var.frontdoor_profile_id

  tags = var.common_tags

  lifecycle {
    ignore_changes = [tags]
  }
}

# Front Door Origin Group
# Groups one or more origins and defines how Front Door probes them and decides
# whether they're healthy. Even with a single origin, this is required by AFD.
resource "azurerm_cdn_frontdoor_origin_group" "api" {
  name                     = "${var.app_name}-${var.instance_name}-api-og"
  cdn_frontdoor_profile_id = var.frontdoor_profile_id

  load_balancing {
    sample_size                 = var.sample_size
    successful_samples_required = var.successful_samples_required
  }

  health_probe {
    protocol            = "Https"
    path                = var.health_probe_path
    request_type        = "GET"
    interval_in_seconds = 120
  }
}

# Front Door Origin
resource "azurerm_cdn_frontdoor_origin" "api" {
  name                          = "${var.app_name}-${var.instance_name}-api-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id

  enabled                        = true
  host_name                      = var.origin_host_name
  origin_host_header             = coalesce(var.origin_host_header, var.origin_host_name)
  http_port                      = 80
  https_port                     = 443
  certificate_name_check_enabled = true

  private_link {
    target_type            = "managedEnvironments"
    private_link_target_id = var.container_app_environment_id
    location               = var.location
  }

  depends_on = [azurerm_cdn_frontdoor_origin_group.api]
}

# Front Door Route
resource "azurerm_cdn_frontdoor_route" "api" {
  name                          = "${var.app_name}-${var.instance_name}-api-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.api.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.api.id]

  supported_protocols    = ["Http", "Https"]
  patterns_to_match      = ["/*"]
  forwarding_protocol    = "HttpsOnly"
  link_to_default_domain = true
  https_redirect_enabled = true

  depends_on = [
    azurerm_cdn_frontdoor_origin.api,
    azurerm_cdn_frontdoor_origin_group.api,
    azurerm_cdn_frontdoor_endpoint.api
  ]
}

# Front Door Security Policy
# Associates the firewall policy to the Front Door endpoint domain and path patterns.
resource "azurerm_cdn_frontdoor_security_policy" "api" {
  count = local.frontdoor_security_policy_count

  name                     = "${var.app_name}-${var.instance_name}-api-security-policy"
  cdn_frontdoor_profile_id = var.frontdoor_profile_id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = var.frontdoor_firewall_policy_id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.api.id
        }

        patterns_to_match = ["/*"]
      }
    }
  }
}
