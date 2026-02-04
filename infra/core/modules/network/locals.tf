# Calculate subnet CIDRs based on VNet address space
locals {
  # Acquire address space from Azure
  base_ip            = "${local.octets[0]}.${local.octets[1]}.${local.octets[2]}"
  octets             = split(".", local.vnet_ip_base)
  vnet_address_space = data.azurerm_virtual_network.main.address_space[0]
  vnet_ip_base       = split("/", local.vnet_address_space)[0]

  # Subnet address assignments
  private_endpoints_subnet_cidr = "${local.base_ip}.0/27"  # For Private Endpoints. 5 Reserved by Azure. 27 usable IPs
  app_service_subnet_cidr       = "${local.base_ip}.32/27" # For App Service. 5 Reserved by Azure. 27 usable IPs
}
