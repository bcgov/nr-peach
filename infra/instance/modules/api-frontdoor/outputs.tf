output "frontdoor_endpoint_host_name" {
  description = "Front Door hostname (*.azurefd.net)."
  value       = azurerm_cdn_frontdoor_endpoint.api.host_name
}

output "frontdoor_endpoint_id" {
  description = "Front Door endpoint id."
  value       = azurerm_cdn_frontdoor_endpoint.api.id
}

output "frontdoor_endpoint_url" {
  description = "Front Door default domain URL."
  value       = "https://${azurerm_cdn_frontdoor_endpoint.api.host_name}"
}

output "frontdoor_route_id" {
  description = "Front Door route id."
  value       = azurerm_cdn_frontdoor_route.api.id
}

output "origin_host_name" {
  description = "Origin hostname Front Door routes to."
  value       = azurerm_cdn_frontdoor_origin.api.host_name
}
