# ----------------------------------------------
# Common Variables for Core Azure Infrastructure
# ----------------------------------------------

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

variable "app_service_sku_name" {
  description = "SKU name for the App Service Plan (env override)"
  type        = string
  default     = null
}

variable "client_id" {
  description = "Azure client ID for the service principal"
  type        = string
  default     = null
  nullable    = true
  sensitive   = true
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_api_autoscale" {
  description = "Whether autoscaling is enabled for the api App Service plan."
  type        = bool
  default     = false
  nullable    = false
}

variable "enable_postgres_auto_grow" {
  description = "Enable auto-grow for PostgreSQL Flexible Server storage"
  type        = bool
  default     = true
  nullable    = false
}

variable "enable_postgres_ha" {
  description = "Enable high availability for PostgreSQL Flexible Server"
  type        = bool
  default     = false
  nullable    = false
}

variable "enable_postgres_geo_redundant_backup" {
  description = "Enable geo-redundant backup for PostgreSQL Flexible Server"
  type        = bool
  default     = false
  nullable    = false
}

variable "lifecycle_name" {
  description = "Name of the lifecycle"
  type        = string
  default     = "core"
  nullable    = false
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Canada Central"
  nullable    = false
}

variable "log_analytics_retention_days" {
  description = "Number of days to retain data in Log Analytics Workspace"
  type        = number
  default     = 30
  nullable    = false
}

variable "log_analytics_sku" {
  description = "SKU for Log Analytics Workspace"
  type        = string
  default     = "PerGB2018"
  nullable    = false
}

variable "postgres_backup_retention_period" {
  description = "Backup retention period in days for PostgreSQL Flexible Server"
  type        = number
  default     = 7
  nullable    = false
}

variable "postgresql_admin_username" {
  description = "Administrator username for PostgreSQL server"
  type        = string
  default     = "pgadmin"
  nullable    = false
}

variable "postgresql_sku_name" {
  description = "SKU name for PostgreSQL Flexible Server (env override)"
  type        = string
  default     = null
}

variable "postgresql_standby_availability_zone" {
  description = "Availability zone for standby replica of PostgreSQL Flexible Server"
  type        = string
  default     = "1"
  nullable    = false
}

variable "postgresql_storage_mb" {
  description = "Storage in MB for PostgreSQL Flexible Server"
  type        = number
  default     = 32768
  nullable    = false
}

variable "postgresql_version" {
  description = "Version of PostgreSQL Flexible Server"
  type        = string
  default     = "16"
  nullable    = false
}

variable "postgresql_zone" {
  description = "Availability zone for PostgreSQL server"
  type        = string
  default     = "1"
  nullable    = false
}

variable "repo_name" {
  description = "Name of the repository, used for resource naming"
  type        = string
  default     = "nr-peach"
  nullable    = false
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "nr-permitting"
  nullable    = false
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
  nullable    = false
  sensitive   = true
}

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
  nullable    = false
  sensitive   = true
}

variable "vnet_name" {
  description = "Name of the existing virtual network"
  type        = string
  nullable    = false
}

variable "vnet_resource_group_name" {
  description = "Resource group name where the virtual network exists"
  type        = string
  nullable    = false
}
