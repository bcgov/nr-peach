output "api_service_plan_id" {
  description = "The ID of the api App Service Plan"
  value       = azurerm_service_plan.api.id
}

output "cloudbeaver_app_service_url" {
  description = "The URL of the CloudBeaver App Service"
  value       = var.enable_psql_sidecar ? "https://${azurerm_linux_web_app.psql_sidecar[0].default_hostname}" : null
}
