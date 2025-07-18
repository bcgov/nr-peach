#  Terraform variables for Azure Container Apps and related resources
#  This file defines the variables used across the infrastructure setup.
# variable "api_image" {
#   description = "The image for the API container"
#   type        = string
# }

# variable "app_env" {
#   description = "Application environment (dev, test, prod)"
#   type        = string
# }

# variable "app_name" {
#   description = "Name of the application"
#   type        = string
# }

# variable "apps_service_subnet_name" {
#   description = "Name of the subnet for Container Apps"
#   type        = string
#   default     = "app-service-subnet"
# }

# variable "auto_grow_enabled" {
#   description = "Enable auto-grow for storage"
#   type        = bool
#   default     = true
# }

# variable "backup_retention_period" {
#   description = "Backup retention period in days"
#   type        = number
#   default     = 7
# }

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {
    # "environment" = "${local.target_env}"
    # "appenv"      = "${local.app_env}"
    # "appname"     = "${local.stack_prefix}-${local.app_env}"
    # "reponame"    = "${get_env("repo_name")}"
    "managedby"   = "Terraform"
  }
}

# variable "create_container_registry" {
#   description = "Flag to create an Azure Container Registry"
#   type        = bool
#   default     = false
# }

# variable "database_name" {
#   description = "Name of the database to create"
#   type        = string
#   default     = "app"
# }

# variable "db_master_password" {
#   description = "Master password for the PostgreSQL server"
#   type        = string
#   sensitive   = true
#   validation {
#     condition     = length(var.db_master_password) >= 12
#     error_message = "The db_master_password must be at least 12 characters long."
#   }
# }

# variable "enable_app_service_logs" {
#   description = "Enable detailed logging for App Service"
#   type        = bool
#   default     = true
# }

# variable "enable_private_endpoint" {
#   description = "Enable private endpoint for PostgreSQL Flexible Server"
#   type        = bool
#   default     = false
# }

# variable "enable_psql_sidecar" {
#   description = "Whether to enable the CloudBeaver database management container"
#   type        = bool
#   default     = false
# }

# variable "flyway_image" {
#   description = "The image for the Flyway container"
#   type        = string
# }

# variable "frontend_image" {
#   description = "The image for the Frontend container"
#   type        = string
# }

# variable "geo_redundant_backup_enabled" {
#   description = "Enable geo-redundant backup"
#   type        = bool
#   default     = false
# }

# variable "ha_enabled" {
#   description = "Enable high availability"
#   type        = bool
#   default     = false
# }

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Canada Central"
}

variable "node_env" {
  description = "Node.js environment"
  type        = string
  default     = "production"
}

# variable "postgresql_admin_password" {
#   description = "PostgreSQL admin password"
#   type        = string
#   sensitive   = true
# }

# variable "postgresql_admin_username" {
#   description = "Administrator username for PostgreSQL server"
#   type        = string
#   default     = "pgadmin"
# }

# variable "postgresql_sku_name" {
#   description = "SKU name for PostgreSQL Flexible Server"
#   type        = string
#   default     = "B_Standard_B1ms" # Basic SKU for development purposes
# }

# variable "postgresql_storage_mb" {
#   description = "Storage in MB for PostgreSQL server"
#   type        = number
#   default     = 32768
# }

# variable "private_endpoint_subnet_name" {
#   description = "Name of the subnet for private endpoints"
#   type        = string
#   default     = "privateendpoints-subnet"
# }

variable "repo_name" {
  description = "Name of the repository, used for resource naming"
  type        = string
  default     = "nr-peach"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

# variable "standby_availability_zone" {
#   description = "Availability zone for standby replica"
#   type        = string
#   default     = "2"
# }

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "tenant_id" {
  description = "Azure tenant ID"
  type        = string
}

variable "vnet_address_space" {
  type        = string
  description = "Address space for the virtual network, it is created by platform team"
}

variable "vnet_name" {
  description = "Name of the existing virtual network"
  type        = string
}

variable "vnet_resource_group_name" {
  description = "Resource group name where the virtual network exists"
  type        = string
}

# variable "web_subnet_name" {
#   description = "Name of the web subnet for APIM deployment"
#   type        = string
#   default     = "web-subnet"
# }
