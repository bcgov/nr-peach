locals {
  use_oidc = try(var.client_id != null, false)
}
