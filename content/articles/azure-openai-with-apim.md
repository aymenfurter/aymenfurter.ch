---
title: "Azure OpenAI with APIM 🕵️"
date: 2023-05-18T00:00:00Z
draft: false
description: "Over the past few months, we all witnessed a surge in popularity of Large Language Models."
tags: ["Azure", "AI", "Infrastructure"]
categories: ["Technology", "Cloud Computing"]
---

Over the past few months, we all witnessed a surge in popularity of Large Language Models.

I've personally worked on several proof-of-concepts (PoCs) revolving around OpenAI. One such instance is [X](https://github.com/aymenfurter/x). This app utilizes the power of GPT-4 and LLM-Chains to automate complex tasks, such as writing and testing code. All in your terminal.

Another project I worked on is [florenceLLM](https://github.com/aymenfurter/florencellm). It is an intelligent chatbot designed to locate an individual who can assist with a specific subject based on GitHub commit analysis. This ability to connect users with the right expert in real-time showcases the transformative potential of AI.

# Azure API Management with Azure OpenAI

In many scenarios, when utilizing Azure OpenAI, it's common to leverage Azure API Management (APIM) in conjunction with it. A detailed example architecture of this approach can be found on [Microsoft's architecture center](https://learn.microsoft.com/en-us/azure/architecture/example-scenario/ai/log-monitor-azure-openai).

Combining APIM with Azure OpenAI can have multiple advantages. The Cognitive Service instance can be confined network-wise.

Beyond security, APIM brings extra functionalities such as selecting the appropriate downstream OpenAI instance, rate-limiting, validating JWTs, and creating a log of the prompts and generated tokens. Additionally, you can leverage the integration of Application Insights to troubleshoot and analyse issues.

The best method for authentication against Azure OpenAI is through Azure Active Directory (AAD). An embedded role — "Cognitive Services OpenAI User" is available specifically for inference purposes.

# End User experience

Users that have the "Cognitive Services OpenAI User" role assigned can authenticate via their browser on Azure Active Directory (AAD) without the need for an API key, thus reducing the risk of compromise. This process can be implemented using the `InteractiveBrowserCredential` class in Python:

```python
from azure.identity import InteractiveBrowserCredential

interactive_credential = InteractiveBrowserCredential(tenant_id="<your_tenant>")
token = interactive_credential.get_token("https://cognitiveservices.azure.com/.default email openid profile")

import openai
openai.api_type = "azure"
openai.api_base = "https://<your-instance>.openai.azure.com"
openai.api_version = "2023-05-15"
openai.api_key = ""

response = openai.ChatCompletion.create(
    engine="deployment-dev-openai-instance-2-gpt-35-turbo-0301",
    headers={"Authorization": f"Bearer {token.token}"},
    messages=[
        {"role": "system", "content": "Assistant is a large language model trained by OpenAI."},
        {"role": "user", "content": "Who were the founders of Microsoft?"}
    ]
)

print(response)
```

# Deployment

I've built a simple terraform sample that deploys Azure OpenAI, an Event Hub, and Azure API Management. The Azure OpenAI Cognitive Service instance is configured to only accept traffic from the private endpoint, which in turn is only accessible via the APIM.

I've also extended the OpenAPI Spec for the OpenAI API, adding parameters for workload identification and specifying the target OpenAI backend. This allows multiple OpenAI instances to be served from a single APIM instance. This logic is implemented through [APIM Policices](https://github.com/aymenfurter/terraform-apim-openai-example/blob/main/modules/apim_vnet_cognitive_services/main.tf#L122).

The full code is available on GitHub: [aymenfurter/terraform-apim-openai-example: Azure OpenAI, with APIM feeding a log feed via Event Hub to Data Explorer (github.com)](https://github.com/aymenfurter/terraform-apim-openai-example)

This entire setup, including the API deployment, can be executed using terraform. Please note, this repository serves merely as a demonstration and is a personal sample project of mine — use it wisely and at your own risk!
