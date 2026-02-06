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

  validation {
    condition     = contains(["dev", "test", "prod"], var.app_env)
    error_message = "app_env must be dev, test or prod."
  }
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

variable "auth_audience" {
  description = "The audience for OIDC JWT tokens."
  type        = string
  default     = "nr-peach"
}

variable "auth_issuer" {
  description = "The issuer of OIDC JWT tokens. Required if AUTH_MODE is authn or authz."
  type        = string
  nullable    = false
}

variable "auth_mode" {
  description = "Set the server auth mode. Options: (none, authn, authz)."
  type        = string
  nullable    = false
  default     = "authz"

  validation {
    condition     = contains(["none", "authn", "authz"], var.auth_mode)
    error_message = "auth_mode must be none, authn or authz."
  }
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

variable "database_admin_username" {
  description = "Administrator username for PostgreSQL server"
  type        = string
  default     = "pgadmin"
  nullable    = false
}

variable "database_admin_password" {
  description = "Master password for the PostgreSQL server"
  type        = string
  nullable    = false
  sensitive   = true
  validation {
    condition     = length(var.database_admin_password) >= 16
    error_message = "The database_admin_password must be at least 16 characters long."
  }
}

variable "database_host" {
  description = "Hostname of the the PostgreSQL server"
  type        = string
  default     = null
  nullable    = true
  sensitive   = true
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
