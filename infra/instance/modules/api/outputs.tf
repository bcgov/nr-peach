output "api_app_service_url" {
  description = "The URL of the API App Service"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "api_frontdoor_endpoint_url" {
  description = "Front Door default domain URL."
  value       = try("https://${azurerm_cdn_frontdoor_endpoint.api_fd_endpoint[0].host_name}", null)
}
output "api_frontdoor_endpoint_host_name" {
  description = "Front Door hostname (*.azurefd.net)."
  value       = try(azurerm_cdn_frontdoor_endpoint.api_fd_endpoint[0].host_name, null)
}

output "api_frontdoor_endpoint_id" {
  description = "Front Door endpoint id."
  value       = try(azurerm_cdn_frontdoor_endpoint.api_fd_endpoint[0].id, null)
}

output "api_frontdoor_route_id" {
  description = "Front Door route id."
  value       = try(azurerm_cdn_frontdoor_route.api_fd_route[0].id, null)
}

output "origin_host_name" {
  description = "Origin hostname Front Door routes to."
  value       = try(azurerm_cdn_frontdoor_origin.api_fd_origin[0].host_name, null)
}
