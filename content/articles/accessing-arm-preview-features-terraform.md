---
title: "Accessing ARM preview features in Terraform"
date: 2022-12-01T00:00:00Z
draft: false
tags: ["Azure", "Infrastructure", "Automation"]
categories: ["Azure", "Infrastructure", "Terraform"]
description: "Terraform helps users get the most out of their cloud when provisioning infrastructure in an automated and repeatable way. Azure Resource Manager (ARM) forms the basis for Azure's Infrastructure as Code solution, and internally, Terraform communicates with ARM."
---

Terraform helps users get the most out of their cloud when provisioning infrastructure in an automated and repeatable way. Azure Resource Manager (ARM) forms the basis for Azure's Infrastructure as Code solution, and internally, Terraform communicates with ARM. However, because of the separation between Azure's own internal representation and Terraform's own internal representation of Azure's API, certain preview features may not be immediately accessible to users. When features are not available in the azurerm provider, users can take advantage of the [AzAPI Provider](https://registry.terraform.io/providers/azure/azapi/latest/docs) instead to access those new features — including any previews — since it exists as a thin layer over ARM. For those ready to move to GA eventually, [a migration tool](https://github.com/Azure/azapi2azurerm) is available to easily shift from AzAPI Provider over to the standard azurerm Provider.

I recently created a sample terraform script that uses a preview APIs to create a PostgreSQL instance with customer managed keys (CMK) enabled.

This is how you typically create a postgresql server resource:

```hcl
resource "azurerm_postgresql_flexible_server" "default" {
  name                = "${var.name_prefix}-server"
  resource_group_name = azurerm_resource_group.default.name
  location           = azurerm_resource_group.default.location
  version            = "13"
  delegated_subnet_id = azurerm_subnet.default.id
  private_dns_zone_id = azurerm_private_dns_zone.default.id
  administrator_login = "myusername"
  administrator_password = "mypassword"
  zone               = "1"
  storage_mb         = 32768
  sku_name           = "GP_Standard_D2s_v3"
  backup_retention_days = 7
  depends_on = [azurerm_private_dns_zone_virtual_network_link.default]
}
```

And this is how it looks like using the AzAPI Provider:

```hcl
resource "azapi_resource" "default" {
  type     = "Microsoft.DBforPostgreSQL/flexibleServers@2022-03-08-preview"
  name     = "${var.name_prefix}-server"
  location = azurerm_resource_group.default.location
  parent_id = azurerm_resource_group.default.id
  depends_on = [azurerm_private_dns_zone_virtual_network_link.default]
  
  identity {
    type = "UserAssigned"
    identity_ids = [
      "/subscriptions/<uuid>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<identity>"
    ]
  }
  
  body = jsonencode({
    properties = {
      administratorLogin = "myusername"
      administratorLoginPassword = "mypassword"
      availabilityZone = "2"
      backup = {
        backupRetentionDays = 7
        geoRedundantBackup = "Disabled"
      }
      createMode = "Default"
      network = {
        delegatedSubnetResourceId = azurerm_subnet.default.id
        privateDnsZoneArmResourceId = azurerm_private_dns_zone.default.id
      }
      storage = {
        storageSizeGB = 128
      }
      dataEncryption = {
        type = "AzureKeyVault"
        primaryUserAssignedIdentityId = "/subscriptions/<uuid>/resourceGroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<identity>",
        primaryKeyURI = "https://<vault>.vault.azure.net/keys/<key>/<keyversion>"
      }
      maintenanceWindow = {
        "customWindow:" "Disabled"
      }
      version = "14"
    }
    sku = {
      name = "Standard_D2ds_v4"
      tier = "GeneralPurpose"
    }
  })
}
```

The full script is available here on GitHub: [https://github.com/aymenfurter/cmk-azurerm_postgresql_flexible_server](https://github.com/aymenfurter/cmk-azurerm_postgresql_flexible_server)
