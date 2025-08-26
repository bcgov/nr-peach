locals {
  force_redeploy = var.enable_force_migration ? timestamp() : null
}
