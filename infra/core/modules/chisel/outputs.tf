output "chisel_app_url" {
  description = "The URL of the Chisel App Service"
  value       = "https://${azurerm_linux_web_app.chisel.default_hostname}"
  sensitive   = true
}

output "chisel_auth" {
  description = "The password for the PostgreSQL admin user."
  value       = "tunnel:${random_password.chisel_password.result}"
  sensitive   = true
}
