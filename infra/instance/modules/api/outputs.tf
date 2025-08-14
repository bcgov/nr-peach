output "api_app_service_url" {
  description = "The URL of the API App Service"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}
