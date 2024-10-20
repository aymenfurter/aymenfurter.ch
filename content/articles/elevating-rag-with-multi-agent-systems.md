---
title: "Elevating RAG with Multi-Agent Systems"
date: 2024-06-30
draft: false
emoji: "🧠"
description: "Exploring improvements in Retrieval-Augmented Generation (RAG) applications, focusing on enhanced multi-modal indexing techniques and multi-agent systems."
tags: ["RAG", "Multi-Agent Systems", "AI", "Azure", "SmartRAG"]
weight: 10
link: https://www.linkedin.com/pulse/elevating-rag-multi-agent-systems-aymen-furter-rjdze/
---

![Elevating RAG with Multi-Agent Systems](/images/elevating-rag-cover.png)

In the wake of the generative AI revolution, we've witnessed a surge in AI-powered applications promising to transform how we interact with computers. Many of these apps fall short of user expectations. Today, I'd like to share my thoughts on improving Retrieval-Augmented Generation (RAG) applications, focusing on enhanced multi-modal indexing techniques and the exciting potential of multi-agent systems.

To demonstrate these concepts, I've developed a prototype application called "[SmartRAG](https://github.com/aymenfurter/smartrag)." This system leverages cloud-native capabilities and mature AI frameworks to create a more robust and nuanced RAG experience.

## Multi-Agent Systems for RAG

Sometimes a single question-answer interaction isn't sufficient for complex queries. This is where multi-agent systems come into play.

[SmartRAG's](https://github.com/aymenfurter/smartrag) experimental "Multi-Agent Research" feature, built using Microsoft's [AutoGen framework](https://microsoft.github.io/autogen/), assembles a team of AI agents that break down the initial inquiry, reframe queries, conduct multiple related questions, and follow up as needed.

Here is how it works:

1. Researcher Agents: The system creates a specialist agent for each data source, allowing for independent research across multiple indexes.
2. Reviewer Agent: This agent oversees the process, guiding the research and synthesizing the findings. The reviewer agent also decides when the goal is reached, and the conversation can be terminated.
3. Time-Bounded Research: Users can specify how long they're willing to wait for an answer, balancing depth of analysis with response time. Behind the scenes, the maximum rounds will be changed accordingly.
4. Citation and Verification: All responses include citations, allowing users to verify the accuracy of the information on a page-level.

This multi-agent approach mimics human research methods, breaking down complex questions, exploring multiple angles, and synthesizing information from various sources. It has the potential to provide more comprehensive and nuanced answers than traditional single-query RAG systems.

## The Foundation: Quality Data and Mature Frameworks

Any RAG application is only as good as its retrieval component, which heavily depends on high-quality data and robust ingestion pipelines. With the rapid evolution of the AI development landscape, we're now at a point where frameworks, SDKs, and best practices have matured significantly.

One common pitfall I've observed is developers trying to reinvent the wheel, creating overly complex solutions from scratch. Instead, by leveraging cloud services like those offered by Azure, we can achieve impressive results with a minimal codebase.

### Indexing Quality Improvements: The Key to Effective RAG

[SmartRAG](https://github.com/aymenfurter/smartrag) showcases several key indexing techniques:

- [Azure AI Document Intelligence](https://azure.microsoft.com/en-us/products/ai-services/ai-document-intelligence): Using Azure's Document Intelligence service, we convert unstructured files into structured Markdown format, ideal for large language models to process.
- Multimodal Post-processing: For documents containing images or graphs, we perform additional postprocessing to improve the generated markdown. This includes using GPT-4o's vision capabilities to generate image captions, enabling users to query not just text but also visual content.
- Table Enhancement: Tables often pose challenges for LLMs. SmartRAG implements strategies such as creating table summaries, generating Q&A pairs about table content, and optionally creating textual representations of each row.
- Page-Level Splitting: Splitting documents by pages during preprocessing allows us to directly display the relevant page to the user. This helps in checking and verifying citations directly on the specific page where they appear.

## Cloud Architecture and Implementation

[SmartRAG](https://github.com/aymenfurter/smartrag/tree/main) leverages several key Azure services, including [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service), [Ingestion Jobs (Preview)](https://learn.microsoft.com/en-us/rest/api/azureopenai/ingestion-jobs?view=rest-azureopenai-2024-05-01-preview), [Azure AI Document Intelligence](https://azure.microsoft.com/en-us/products/ai-services/ai-document-intelligence) and [Azure AI Search](https://azure.microsoft.com/en-us/products/ai-services/ai-search). The backend is built with Python and Flask, while the frontend uses React to provide an intuitive user interface.

### Looking Ahead

As we continue to push the boundaries of AI-powered applications, I believe that approaches like those demonstrated in [SmartRAG](https://github.com/aymenfurter/smartrag) will become increasingly important. By combining advanced indexing techniques, multi-agent systems, and cloud-native AI services, we can create more powerful, nuanced, and user-friendly RAG applications.

If you're interested in trying out [SmartRAG](https://github.com/aymenfurter/smartrag), the project is open-source and can be easily deployed using the [Azure Developer CLI](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/overview).