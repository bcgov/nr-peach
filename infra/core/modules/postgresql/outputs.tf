output "database_host" {
  description = "The FQDN of the PostgreSQL server."
  value       = azurerm_postgresql_flexible_server.postgresql.fqdn
}

output "database_id" {
  description = "The ID of the PostgreSQL server."
  value       = azurerm_postgresql_flexible_server.postgresql.id
}

output "database_ip" {
  description = "The private endpoint IP address of the PostgreSQL server."
  value       = azurerm_private_endpoint.postgresql.private_service_connection[0].private_ip_address
}
