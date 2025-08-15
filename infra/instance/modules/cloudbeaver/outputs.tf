output "cloudbeaver_app_service_url" {
  description = "The URL of the CloudBeaver App Service"
  value       = "https://${azurerm_linux_web_app.cloudbeaver.default_hostname}"
}
