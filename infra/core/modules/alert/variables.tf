variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "frontdoor_profile_id" {
  description = "Front Door profile id for monitoring scope."
  type        = string
}

variable "module_name" {
  description = "Name of the module"
  type        = string
  default     = "alert"
}

variable "postgres_server_id" {
  description = "The ID of the PostgreSQL server to monitor."
  type        = string
}

variable "postgresql_sku_name" {
  description = "SKU name for PostgreSQL Flexible Server"
  type        = string
  nullable    = false
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}
