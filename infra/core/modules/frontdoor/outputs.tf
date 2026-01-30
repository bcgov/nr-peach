output "frontdoor_profile_id" {
  description = "Front Door profile id."
  value       = azurerm_cdn_frontdoor_profile.main.id
}

output "frontdoor_profile_resource_guid" {
  description = "Front Door Profile resource GUID."
  value       = azurerm_cdn_frontdoor_profile.main.resource_guid
}

output "frontdoor_firewall_policy_id" {
  description = "Firewall policy id (null if disabled)."
  value       = var.enable_frontdoor_firewall ? azurerm_cdn_frontdoor_firewall_policy.main_firewall_policy[0].id : null
}
