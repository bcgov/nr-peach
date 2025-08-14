locals {
  database_name = var.lifecycle_name == "main" ? "app" : var.lifecycle_name
  # pe_nic_id = jsondecode(data.azapi_resource.postgresql_pe.output.properties.networkInterfaces[0].id)
  # pe_private_ip = jsondecode(data.azapi_resource.pe_nic.output).properties.ipConfigurations[0].properties.privateIPAddress
  use_oidc = try(var.client_id != null, false)
}
