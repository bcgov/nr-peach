output "api_container_app_id" {
  description = "ID of the api Container App"
  value       = azurerm_container_app.api.id
}

output "api_container_app_name" {
  description = "Name of the api Container App"
  value       = azurerm_container_app.api.name
}

output "api_container_app_fqdn" {
  description = "Internal FQDN of the api Container App"
  value       = azurerm_container_app.api.ingress[0].fqdn
  sensitive   = true
}

output "api_container_app_url" {
  description = "Internal URL of the api Container App"
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
  sensitive   = true
}
