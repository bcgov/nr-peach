variable "app_name" {
  description = "The base name of the application. Used for naming Azure resources."
  type        = string
  nullable    = false
}

variable "app_service_sku_name" {
  description = "The SKU name for the appservice App Service plan."
  type        = string
  nullable    = false
}

variable "enable_api_autoscale" {
  description = "Whether autoscaling is enabled for the api App Service plan."
  type        = bool
  nullable    = false
}

variable "common_tags" {
  description = "A map of tags to apply to resources."
  type        = map(string)
  default     = {}
}

variable "location" {
  description = "The Azure region where resources will be created."
  type        = string
  nullable    = false
}

variable "log_analytics_workspace_id" {
  description = "The resource ID of the Log Analytics workspace for diagnostics."
  type        = string
  nullable    = false
}

variable "max_instances" {
  description = "Maximum number of App Service instances to allow. Defaults to 10."
  type        = number
  default     = 10
}

variable "module_name" {
  description = "Name of the module"
  type        = string
  default     = "appservice"
}

variable "resource_group_name" {
  description = "The name of the resource group in which to create resources."
  type        = string
  nullable    = false
}

variable "scale_out_method" {
  description = "The desired App Service scale out method"
  type        = string
  nullable    = false

  validation {
    condition     = contains(["Auto", "Manual", "Rules"], var.scale_out_method)
    error_message = "scale_out_method must be Auto, Manual or Rules."
  }
}
