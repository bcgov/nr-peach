locals {
  enable_autoscale = var.enable_api_autoscale && local.is_premium_sku
  is_premium_sku   = startswith(var.app_service_sku_name, "P")
  scale_out_method = local.enable_autoscale ? var.scale_out_method : "Manual"
}
