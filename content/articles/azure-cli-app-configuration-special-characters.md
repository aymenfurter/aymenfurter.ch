---
title: "Setting App Configuration Values with Special Characters using Azure CLI"
date: 2022-10-01T00:00:00Z
draft: false
tags: ["Azure", "Development"]
categories: ["Azure"]
author: "Aymen Furter"
showToc: true
TocOpen: false
hidemeta: false
comments: false
description: "Learn how to properly set Azure Function App configuration values containing spaces or special characters using Azure CLI."
disableShare: false
disableHLJS: false
hideSummary: false
searchHidden: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
---

I recently ran into an issue when setting app settings via the `az functionapp config appsettings` command. The issue specifically occurs when there are spaces or special characters in the values:

```bash
az functionapp config appsettings set --name MyFunctionApp --resource-group MyResourceGroup --subscription MySubscription --settings "MyAppSetting=This has a # sign"
```

## The Solution

If you are running into the same issue, the solution is to put the whole command in a string and then call it with eval. This will ensure that the quotes are handled correctly and your settings will be applied successfully.

You can use the following code to set your app settings values:

```bash
settings="\"My App Setting=This has a space\" \"Another App Setting=This has a # sign\""
eval "az functionapp config appsettings set --name MyFunctionApp --resource-group MyResourceGroup --subscription MySubscription --settings $settings"
```

Using eval command will correctly handle the quotes and enable you to set values with spaces or other special characters.

## Background

I initially found the solution in this StackOverflow article: [https://stackoverflow.com/questions/57762136/azure-cli-az-functionapp-config-appsettings-space-in-appsetting](https://stackoverflow.com/questions/57762136/azure-cli-az-functionapp-config-appsettings-space-in-appsetting)

## Conclusion

Working with special characters and spaces in Azure CLI commands can be tricky due to shell parsing behavior. The `eval` approach provides a reliable way to ensure that your configuration values are properly escaped and applied to your Azure Function Apps, regardless of the special characters they contain.
