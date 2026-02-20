output "frontdoor_profile_id" {
  description = "Front Door profile id."
  value       = azurerm_cdn_frontdoor_profile.frontdoor.id
  sensitive   = true
}

output "frontdoor_profile_resource_guid" {
  description = "Front Door Profile resource GUID."
  value       = azurerm_cdn_frontdoor_profile.frontdoor.resource_guid
  sensitive   = true
}

output "frontdoor_firewall_policy_id" {
  description = "Firewall policy id."
  value       = azurerm_cdn_frontdoor_firewall_policy.frontdoor_firewall_policy.id
  sensitive   = true
}
