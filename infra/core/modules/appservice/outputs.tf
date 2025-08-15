output "api_service_plan_id" {
  description = "The ID of the api App Service Plan"
  value       = azurerm_service_plan.appservice.id
}
