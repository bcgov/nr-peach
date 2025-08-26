# -----------------------------------------
# Common Variables for Azure Infrastructure
# -----------------------------------------

variable "api_image" {
  description = "The image for the API container"
  type        = string
  nullable    = false
}

variable "app_env" {
  description = "Application environment (dev, test, prod)"
  type        = string
  nullable    = false
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  nullable    = false
}

variable "app_service_subnet_name" {
  description = "Name of the subnet for App Services"
  type        = string
  default     = "app-service-subnet"
  nullable    = false
}

variable "client_id" {
  description = "Azure client ID for the service principal"
  type        = string
  nullable    = true
  sensitive   = true
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "container_instance_subnet_name" {
  description = "Name of the subnet for container instances"
  type        = string
  default     = "container-instance-subnet"
  nullable    = false
}

variable "db_master_password" {
  description = "Master password for the PostgreSQL server"
  type        = string
  nullable    = false
  sensitive   = true
  validation {
    condition     = length(var.db_master_password) >= 16
    error_message = "The db_master_password must be at least 16 characters long."
  }
}

variable "enable_cloudbeaver" {
  description = "Whether to enable the CloudBeaver database management container"
  type        = bool
  default     = false
  nullable    = false
}

variable "instance_name" {
  description = "Name of the instance"
  type        = string
  nullable    = false
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Canada Central"
  nullable    = false
}

variable "postgresql_admin_username" {
  description = "Administrator username for PostgreSQL server"
  type        = string
  default     = "pgadmin"
  nullable    = false
}

variable "private_endpoints_subnet_name" {
  description = "Name of the subnet for private endpoints"
  type        = string
  default     = "privateendpoints-subnet"
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
