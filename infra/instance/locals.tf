locals {
  database_name = var.instance_name == "main" ? "app" : var.instance_name
  use_oidc = try(var.client_id != null, false)
}
