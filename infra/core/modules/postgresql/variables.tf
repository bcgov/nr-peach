variable "app_name" {
  description = "Name of the application"
  type        = string
  nullable    = false
}

variable "app_env" {
  description = "Application environment (dev, test, prod)"
  type        = string
  nullable    = false

  validation {
    condition     = contains(["dev", "test", "prod"], var.app_env)
    error_message = "app_env must be dev, test or prod."
  }
}

variable "enable_auto_grow" {
  description = "Enable auto-grow for storage"
  type        = bool
  nullable    = false
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  nullable    = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_geo_redundant_backup" {
  description = "Enable geo-redundant backup"
  type        = bool
  nullable    = false
}

variable "enable_ha" {
  description = "Enable high availability"
  type        = bool
  nullable    = false
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  nullable    = false
}

variable "log_analytics_workspace_id" {
  description = "The resource ID of the Log Analytics workspace for diagnostics."
  type        = string
  nullable    = false
}

variable "module_name" {
  description = "Name of the module"
  type        = string
  default     = "postgresql"
}

variable "postgres_version" {
  description = "The version of PostgreSQL to use."
  type        = string
  nullable    = false
}

variable "postgresql_admin_username" {
  description = "Administrator username for PostgreSQL server"
  type        = string
  default     = "pgadmin"
}

variable "postgresql_sku_name" {
  description = "SKU name for PostgreSQL Flexible Server"
  type        = string
  nullable    = false
}

variable "postgresql_storage_mb" {
  description = "Storage in MB for PostgreSQL server"
  type        = number
  nullable    = false
}

variable "private_endpoint_subnet_id" {
  description = "The ID of the subnet for the private endpoint."
  type        = string
  nullable    = false
}

variable "resource_group_name" {
  description = "The name of the resource group to create."
  type        = string
  nullable    = false
}

variable "standby_availability_zone" {
  description = "Availability zone for standby replica"
  type        = string
  nullable    = false
}

variable "zone" {
  description = "The availability zone for the PostgreSQL Flexible Server."
  type        = string
  nullable    = false
}
