---
title: "11 Tips to Supercharge Your Pet Projects on Azure Kubernetes Without Emptying Your Wallet!"
date: 2023-06-24
draft: false
emoji: "💰"
description: "Learn 11 practical tips to run cost-effective Azure Kubernetes Service (AKS) clusters for pet projects on a budget without sacrificing functionality."
tags: ["Azure", "Infrastructure", "Development"]
weight: 10
---

Before we start, remember **these tips are meant for fun projects that can handle some downtime**. We are trying to cut costs and this may mean your project won't always be available. If you are working on a serious project that needs to be available all the time, you'll need a different plan.

Running a pet project on Azure is a great opportunity to learn. Azure Kubernetes Service (AKS) isn't typically known for its cost-effectiveness. It requires dedicated resources allocated to your cluster, i.e. having Virtual Machine Scale Sets (VMSS) deployed. This can make it seem a bit daunting for those on a budget.

Recently, I made the switch for my pet project, [c14r.io](http://c14r.io/), from a Virtual Private Server (VPS) provider to Azure. This journey was packed with valuable lessons, and I'm excited to share these insights with you in this article.

My objective was to deploy it on a [MSDN/Visual Studio subscription](https://azure.microsoft.com/en-us/pricing/member-offers/credit-for-visual-studio-subscribers/), which comes with a spending limit of $150. This subscription is a part of the Visual Studio package and is a fantastic option as it eliminates the worry of costs skyrocketing. However, it does come with a caveat — you only have $150 to play with. This might seem like a challenge when you want to work with AKS, but with the right strategies, it's entirely feasible. Let's dive into the tips to make it happen!

## Tip 1: Always Start with a Plan

Before you even think about deploying, take some time to plan what you want to deploy using the [Azure Cost Calculator](https://azure.microsoft.com/en-us/pricing/calculator/). This tool allows you to estimate the cost of your intended deployment and helps you avoid any surprising bills at the end of the month.

## Tip 2: Automate Your Deployment

Automating your deployment is crucial when you're trying to stay within a budget. Automation ensures accuracy in the deployment process. Additionally, it allows you to quickly redeploy your entire project to a different region without having to remember and execute every manual step.

## Tip 3: Monitor Your Costs

After your first day fully running on Azure, use the ['view cost per day'](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/cost-analysis-common-uses#view-costs-per-day-or-by-month) option in the cost management tool to keep track of your spending. Compare this with the estimate from the Azure Cost Calculator to check if your actual expenditure is in line with your projections.

## Tip 4: Utilize the Free Tier for Cluster Management

When running a pet project, it's typically not necessary to maintain high availability for your Kubernetes API. AKS offers a [Free tier](https://learn.microsoft.com/en-us/azure/aks/free-standard-pricing-tiers) for cluster management, which is quite suitable for such scenarios.

## Tip 5: Opt for a Single Node Deployment

Given that pet projects can typically tolerate occasional downtime, you might consider a single node deployment of AKS. Use the system node pool for both your applications and Kubernetes system pods. While this approach is not recommended for any production environments, it allows us to achieve high density and make the most out of AKS for pet projects.

## Tip 6: Select VM Types Wisely

Pet projects are generally more limited by memory than CPU, especially if they don't experience much concurrent user activity. Therefore, when choosing VM types, I typically focus on [Memory optimized SKUs](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes-memory).

## Tip 7: Choose Your Region for Price Efficiency

Azure's pricing can vary greatly across regions. For instance, the Standard_E4as_v5 SKU provides 32 GB of RAM and 4 vCPUs. In Central India, this SKU can be procured for 105$, while in other regions, the same SKU can cost [more than 300$](https://azureprice.net/vm/Standard_E4as_v5). If the type of data you are handling in your project permits it, choosing a cheaper region can result in substantial savings.

## Tip 8: Optimize Disk Size

The default OS disk size for an AKS node is 128 GB, costing an additional 10$. By reducing the OS disk size to 64 GB, you can cut 5$ off your monthly cost. While this may mean your node fills up sooner, it's a viable option if you don't plan to make heavy use of temporary storage.

## Tip 9: Utilize Reliable Singletons

In the book "[Kubernetes — Up and Running](https://www.oreilly.com/library/view/kubernetes-up-and/9781491935668/)", a concept known as "Reliable Singletons" is described. This refers to using a single pod instance to run data services. While this is commonly applied to apps that lack clustering capabilities, it can also significantly help in reducing costs. By running a single Pod that manages our database or queuing technology, we can maintain an acceptable uptime for our pet project with minimal resource usage.

## Tip 10: CPU and Memory Limits

While it is generally advised to set appropriate CPU and Memory limits for Kubernetes, we can achieve higher density for pet projects by deliberately not setting any resource requests/limits.

## Tip 11: Smart Logging to Avoid Extra Costs

The good news is, in Log Analytics we get 5 GB of monthly data ingestion for free (See: [Pricing — Azure Monitor](https://azure.microsoft.com/en-us/pricing/details/monitor/)) per billing account. Log analytics cost can be difficult to predict, so it's crucial to ensure that we don't ingest (much) more data than what's included for free. Thankfully, Azure provides an option to define a [daily cap](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/daily-cap) on a Log Analytics Workspace (I am using a cap of 200mb, so the maximum monthly cost is ~3$). When using Container Insights, we can customize [data collection settings](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/container-insights-agent-config), such as defining what namespace to monitor and how often to scrape metrics. We can also use [sampling with App Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/sampling) to reduce cost further.

## Conclusion

Managing costs on Azure Kubernetes Service doesn't require sacrificing the scope of your pet project. With the right strategies and careful monitoring, you can effectively utilize Azure's capabilities within your budget. Happy coding!

*One small remark: I did not explore [Azure Savings Plan](https://azure.microsoft.com/en-us/pricing/offers/savings-plan-compute/), [Spot Virtual Machines](https://azure.microsoft.com/en-us/products/virtual-machines/spot/) and [Azure Reserved Virtual Machine Instances](https://azure.microsoft.com/en-us/pricing/reserved-vm-instances/) since these are not available when using a Visual Studio Enterprise monthly credit subscription.*
