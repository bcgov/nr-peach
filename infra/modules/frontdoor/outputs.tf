output "api_firewall_policy_id" {
  description = "The ID of the Front Door firewall policy."
  value       = azurerm_cdn_frontdoor_firewall_policy.api_firewall_policy.id
}

output "cloudbeaver_firewall_policy_id" {
  description = "The ID of the CloudBeaver firewall policy."
  value       = var.enable_cloudbeaver ? azurerm_cdn_frontdoor_firewall_policy.cloudbeaver_firewall_policy[0].id : null
}

output "frontdoor_id" {
  description = "The name of the Front Door endpoint."
  value       = azurerm_cdn_frontdoor_profile.api_frontdoor.id
}

output "frontdoor_resource_guid" {
  description = "The resource GUID of the Front Door profile."
  value       = azurerm_cdn_frontdoor_profile.api_frontdoor.resource_guid
}
