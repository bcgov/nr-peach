# --------------------------------------
# Network Module Terraform Configuration
# --------------------------------------

data "azurerm_virtual_network" "main" {
  name                = var.vnet_name
  resource_group_name = var.vnet_resource_group_name
}

# ------------------------------
# Network Security Groups (NSGs)
# ------------------------------

# NSG for privateendpoints subnet
resource "azurerm_network_security_group" "privateendpoints" {
  name                = "${var.resource_group_name}-pe-nsg"
  location            = var.location
  resource_group_name = var.vnet_resource_group_name
  tags                = var.common_tags

  security_rule {
    name                       = "AllowInboundFromApp"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.app_service_subnet_cidr
    destination_address_prefix = local.private_endpoints_subnet_cidr
    destination_port_range     = "*"
    source_port_range          = "*"
  }
  security_rule {
    name                       = "AllowOutboundToApp"
    priority                   = 101
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    destination_address_prefix = local.app_service_subnet_cidr
    source_address_prefix      = local.private_endpoints_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowInboundFromContainerInstance"
    priority                   = 104
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.container_instance_subnet_cidr
    destination_address_prefix = local.private_endpoints_subnet_cidr
    destination_port_range     = "*"
    source_port_range          = "*"
  }
  security_rule {
    name                       = "AllowOutboundToContainerInstance"
    priority                   = 105
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    destination_address_prefix = local.container_instance_subnet_cidr
    source_address_prefix      = local.private_endpoints_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowInboundFromWeb"
    priority                   = 102
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.web_subnet_cidr
    source_port_range          = "*"
    destination_address_prefix = local.private_endpoints_subnet_cidr
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowOutboundToWeb"
    priority                   = 103
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    destination_address_prefix = local.web_subnet_cidr
    source_address_prefix      = local.private_endpoints_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }

  security_rule {
    name                       = "AllowInboundFromContainerApps"
    priority                   = 106
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.container_apps_subnet_cidr
    destination_address_prefix = local.private_endpoints_subnet_cidr
    destination_port_range     = "*"
    source_port_range          = "*"
  }

  security_rule {
    name                       = "AllowOutboundToContainerApps"
    priority                   = 107
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    destination_address_prefix = local.container_apps_subnet_cidr
    source_address_prefix      = local.private_endpoints_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }

  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# NSG for app service subnet
resource "azurerm_network_security_group" "app_service" {
  name                = "${var.resource_group_name}-as-nsg"
  location            = var.location
  resource_group_name = var.vnet_resource_group_name
  tags                = var.common_tags

  security_rule {
    name                       = "AllowAppFromPrivateEndpoint"
    priority                   = 102
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.private_endpoints_subnet_cidr
    source_port_range          = "*"
    destination_address_prefix = local.app_service_subnet_cidr
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowAppToPrivateEndpoint"
    priority                   = 103
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    destination_address_prefix = local.private_endpoints_subnet_cidr
    source_address_prefix      = local.app_service_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowAppFromContainerInstance"
    priority                   = 104
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.container_instance_subnet_cidr
    source_port_range          = "*"
    destination_address_prefix = local.app_service_subnet_cidr
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowAppToContainerInstance"
    priority                   = 105
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    destination_address_prefix = local.container_instance_subnet_cidr
    destination_port_range     = "*"
    source_address_prefix      = local.app_service_subnet_cidr
    source_port_range          = "*"
  }
  security_rule {
    name                       = "AllowAppFromWeb"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = local.web_subnet_cidr
    destination_port_range     = "*"
    source_port_range          = "*"
    destination_address_prefix = local.app_service_subnet_cidr
  }
  security_rule {
    name                       = "AllowAppToWeb"
    priority                   = 101
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    destination_address_prefix = local.web_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = local.app_service_subnet_cidr
  }
  security_rule {
    name                       = "AllowAppFromInternet"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "*"
    source_port_range          = "*"
    destination_address_prefix = local.app_service_subnet_cidr
    destination_port_ranges    = ["80", "443"]
  }
  security_rule {
    name                       = "AllowAppOutboundToInternet"
    priority                   = 120
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = local.app_service_subnet_cidr
    destination_address_prefix = "*"
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
  }

  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# NSG for Container Apps subnet
resource "azurerm_network_security_group" "container_apps" {
  name                = "${var.resource_group_name}-ca-nsg"
  location            = var.location
  resource_group_name = var.vnet_resource_group_name

  # Allow Container Apps management traffic (required by Azure Container Apps)
  security_rule {
    name                       = "AllowContainerAppsManagement"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = local.container_apps_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }

  # Allow HTTPS traffic from internet (for public ingress)
  # security_rule {
  #   name                       = "AllowHTTPSFromInternet"
  #   priority                   = 110
  #   direction                  = "Inbound"
  #   access                     = "Allow"
  #   protocol                   = "Tcp"
  #   source_address_prefix      = "*"
  #   destination_address_prefix = local.container_apps_subnet_cidr
  #   source_port_range          = "*"
  #   destination_port_range     = "443"
  # }

  # # Allow HTTP traffic from internet (for public ingress)
  # security_rule {
  #   name                       = "AllowHTTPFromInternet"
  #   priority                   = 120
  #   direction                  = "Inbound"
  #   access                     = "Allow"
  #   protocol                   = "Tcp"
  #   source_address_prefix      = "*"
  #   destination_address_prefix = local.container_apps_subnet_cidr
  #   source_port_range          = "*"
  #   destination_port_range     = "80"
  # }

  # Allow communication with private endpoints (PostgreSQL)
  security_rule {
    name                       = "AllowOutboundToPrivateEndpoints"
    priority                   = 130
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.container_apps_subnet_cidr
    destination_address_prefix = local.private_endpoints_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowInboundFromPrivateEndpoints"
    priority                   = 131
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.private_endpoints_subnet_cidr
    destination_address_prefix = local.container_apps_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }

  # Allow inbound traffic from App Service (for private backend access)
  # security_rule {
  #   name                       = "AllowInboundFromAppService"
  #   priority                   = 140
  #   direction                  = "Inbound"
  #   access                     = "Allow"
  #   protocol                   = "*"
  #   source_address_prefix      = local.app_service_subnet_cidr
  #   destination_address_prefix = local.container_apps_subnet_cidr
  #   source_port_range          = "*"
  #   destination_port_range     = "*"
  # }

  # Allow outbound response to App Service
  # security_rule {
  #   name                       = "AllowOutboundToAppService"
  #   priority                   = 141
  #   direction                  = "Outbound"
  #   access                     = "Allow"
  #   protocol                   = "*"
  #   source_address_prefix      = local.container_apps_subnet_cidr
  #   destination_address_prefix = local.app_service_subnet_cidr
  #   source_port_range          = "*"
  #   destination_port_range     = "*"
  # }

  # Allow outbound internet access (for Container Registry, monitoring, etc.)
  security_rule {
    name                       = "AllowOutboundToInternet"
    priority                   = 142
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.container_apps_subnet_cidr
    destination_address_prefix = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
  }
  # security_rule {
  #   name                       = "AllowInboundFromContainerInstance"
  #   priority                   = 144
  #   direction                  = "Inbound"
  #   access                     = "Allow"
  #   protocol                   = "*"
  #   source_address_prefix      = local.container_instance_subnet_cidr
  #   destination_address_prefix = local.container_apps_subnet_cidr
  #   source_port_range          = "*"
  #   destination_port_range     = "*"
  # }

  # Allow outbound response to App Service
  # security_rule {
  #   name                       = "AllowOutboundToContainerInstance"
  #   priority                   = 145
  #   direction                  = "Outbound"
  #   access                     = "Allow"
  #   protocol                   = "*"
  #   source_address_prefix      = local.container_apps_subnet_cidr
  #   destination_address_prefix = local.container_instance_subnet_cidr
  #   source_port_range          = "*"
  #   destination_port_range     = "*"
  # }

  tags = var.common_tags
  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# NSG for web container instance subnet
resource "azurerm_network_security_group" "container_instance" {
  name                = "${var.resource_group_name}-ci-nsg"
  location            = var.location
  resource_group_name = var.vnet_resource_group_name
  tags                = var.common_tags

  security_rule {
    name                       = "AllowInboundFromAppService"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.app_service_subnet_cidr
    destination_address_prefix = local.container_instance_subnet_cidr
    source_port_ranges         = ["3000-9000"]
    destination_port_ranges    = ["3000-9000"]
  }
  security_rule {
    name                       = "AllowOutboundToAppService"
    priority                   = 101
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    destination_address_prefix = local.app_service_subnet_cidr
    source_address_prefix      = local.container_instance_subnet_cidr
    source_port_ranges         = ["3000-9000"]
    destination_port_ranges    = ["3000-9000"]
  }
  security_rule {
    name                       = "AllowInboundFromWeb"
    priority                   = 102
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    source_address_prefix      = local.web_subnet_cidr
    destination_address_prefix = local.web_subnet_cidr
    destination_port_ranges    = ["3000-9000"]
  }
  security_rule {
    name                       = "AllowOutboundToWeb"
    priority                   = 103
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    destination_address_prefix = local.web_subnet_cidr
    source_address_prefix      = local.container_instance_subnet_cidr
    source_port_range          = "*"
    destination_port_ranges    = ["3000-9000"]
  }
  # Allow inbound from Private Endpoints subnet to Container Instances subnet
  security_rule {
    name                       = "AllowInboundFromPrivateEndpoint"
    priority                   = 106
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.private_endpoints_subnet_cidr
    destination_address_prefix = local.container_instance_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }
  # Allow outbound to Private Endpoints subnet from Container Instances subnet
  security_rule {
    name                       = "AllowOutboundToPrivateEndpoint"
    priority                   = 107
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_address_prefix      = local.container_instance_subnet_cidr
    destination_address_prefix = local.private_endpoints_subnet_cidr
    source_port_range          = "*"
    destination_port_range     = "*"
  }
  security_rule {
    name                       = "AllowInboundFromInternet"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "*"
    destination_address_prefix = local.container_instance_subnet_cidr
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
  }
  security_rule {
    name                       = "AllowOutboundToInternet"
    priority                   = 120
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    destination_address_prefix = "*"
    source_address_prefix      = local.container_instance_subnet_cidr
    source_port_range          = "*"
    destination_port_ranges    = ["80", "443"]
  }

  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

# -------
# Subnets
# -------

# In Azure, subnets must be created within the same resource group as their parent virtual network.
# You cannot create a subnet in a different resource group from the VNet.
resource "azapi_resource" "privateendpoints_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2023-04-01"
  name      = var.private_endpoints_subnet_name
  parent_id = data.azurerm_virtual_network.main.id
  locks     = [data.azurerm_virtual_network.main.id]
  body = {
    properties = {
      addressPrefix = local.private_endpoints_subnet_cidr
      networkSecurityGroup = {
        id = azurerm_network_security_group.privateendpoints.id
      }
    }
  }
  response_export_values = ["*"]
}

resource "azapi_resource" "app_service_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2023-04-01"
  name      = var.app_service_subnet_name
  parent_id = data.azurerm_virtual_network.main.id
  locks     = [data.azurerm_virtual_network.main.id]
  body = {
    properties = {
      addressPrefix = local.app_service_subnet_cidr
      networkSecurityGroup = {
        id = azurerm_network_security_group.app_service.id
      }
      delegations = [
        {
          name = "app-service-delegation"
          properties = {
            serviceName = "Microsoft.Web/serverFarms"
          }
        }
      ]
    }
  }
  response_export_values = ["*"]
}

resource "azapi_resource" "container_instance_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2023-04-01"
  name      = var.container_instance_subnet_name
  parent_id = data.azurerm_virtual_network.main.id
  locks     = [data.azurerm_virtual_network.main.id]
  body = {
    properties = {
      addressPrefix = local.container_instance_subnet_cidr
      networkSecurityGroup = {
        id = azurerm_network_security_group.container_instance.id
      }
      delegations = [
        {
          name = "aci-delegation"
          properties = {
            serviceName = "Microsoft.ContainerInstance/containerGroups"
          }
        }
      ]
    }
  }
  response_export_values = ["*"]
}

resource "azapi_resource" "container_apps_subnet" {
  type      = "Microsoft.Network/virtualNetworks/subnets@2023-04-01"
  name      = var.container_apps_subnet_name
  parent_id = data.azurerm_virtual_network.main.id
  locks     = [data.azurerm_virtual_network.main.id]
  body = {
    properties = {
      addressPrefix = local.container_apps_subnet_cidr

      networkSecurityGroup = {
        id = azurerm_network_security_group.container_apps.id
      }

      delegations = [
        {
          name = "container-apps-delegation"
          properties = {
            serviceName = "Microsoft.App/environments"
          }
        }
      ]
    }
  }

  response_export_values = ["*"]
}
