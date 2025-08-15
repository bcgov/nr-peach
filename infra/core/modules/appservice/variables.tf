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

variable "api_autoscale_enabled" {
  description = "Whether autoscaling is enabled for the api App Service plan."
  type        = bool
  default     = false
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
