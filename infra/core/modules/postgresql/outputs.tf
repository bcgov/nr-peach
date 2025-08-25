output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = azurerm_postgresql_flexible_server.postgresql.fqdn
  sensitive   = true
}

output "database_id" {
  description = "The ID of the PostgreSQL server."
  value       = azurerm_postgresql_flexible_server.postgresql.id
  sensitive   = true
}

output "database_ip" {
  description = "The private endpoint IP address of the PostgreSQL server."
  value       = azurerm_private_endpoint.postgresql.private_service_connection[0].private_ip_address
  sensitive   = true
}

output "database_master_password" {
  description = "The password for the PostgreSQL admin user."
  value       = random_password.postgres_master_password.result
  sensitive   = true
}
