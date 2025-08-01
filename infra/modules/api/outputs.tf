output "api_service_plan_id" {
  description = "The ID of the api App Service Plan"
  value       = azurerm_service_plan.api.id
}

output "api_app_service_url" {
  description = "The URL of the API App Service"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

# output "api_frontdoor_endpoint" {
#   description = "The API endpoint"
#   value       = "https://${azurerm_cdn_frontdoor_endpoint.api_fd_endpoint.host_name}/"
# }

output "cloudbeaver_app_service_url" {
  description = "The URL of the CloudBeaver App Service"
  value       = var.enable_cloudbeaver ? "https://${azurerm_linux_web_app.cloudbeaver[0].default_hostname}" : null
}

# output "cloudbeaver_frontdoor_endpoint" {
#   description = "The CloudBeaver endpoint"
#   value       = var.enable_cloudbeaver ? "https://${azurerm_cdn_frontdoor_endpoint.cloudbeaver_fd_endpoint[0].host_name}/" : null
# }
