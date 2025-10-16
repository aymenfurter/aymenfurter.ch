---
title: "Agent Routing with Azure AI Foundry and Microsoft Purview"
date: 2025-09-18T00:00:00Z
draft: false
description: "Building a data-aware routing system using Azure AI Foundry Agent Service and Microsoft Purview to route user queries to specialized agents based on data catalog discovery."
emoji: "🗂️"
tags: ["AI", "Azure", "Python", "Integration"]
categories: ["Technology", "AI Systems"]
cover:
  image: "images/IMG_0014.png"
  alt: "Agent Routing with Azure AI Foundry and Microsoft Purview"
---

![Agent Routing with Azure AI Foundry and Microsoft Purview](/images/IMG_0014.png)

As AI apps become more complex, a pattern emerges: we move from a single monolithic agent to a collection of smaller, specialized agents. One agent may be an expert in searching internal documents, another excels at querying structured data in Microsoft Fabric, and a third can browse the web for recent information. This pattern is powerful, but it introduces a new challenge: how do you route a user's query to the right agent?

You could let the user manually pick from a list or use a handoff pattern where a primary orchestrator agent analyzes the user's intent and routes the request to the appropriate specialist.

In Azure AI Foundry Agent Service, the platform for building pro-code agents, this pattern is enabled through a feature called **Connected Agents**. It allows a primary agent to delegate tasks to sub-agents, effectively acting as a natural-language router without needing custom orchestration code.

But even with a router, how does the agent know where to send the query? If a user asks about "sales data," does that live in a Databricks table or a Fabric Lakehouse? Answering this requires awareness of the organization's entire data landscape.

To solve this, I've built a reference implementation, [Agent Router](https://github.com/aymenfurter/agent-router), that demonstrates how to create such a data-aware routing system. It uses an orchestrator agent that calls Microsoft Purview's discovery REST API to identify which data assets are relevant to a query, and then hands off the request to the correct specialized agent.

The solution consists of a Python backend and a React frontend. The backend orchestrates a team of agents built with Azure AI Foundry Agent Service. At the center is an orchestrator agent that calls Purview to discover relevant data assets and then delegates tasks to specialized agents. These include:

- **Fabric Agent**: Queries structured data in Microsoft Fabric (via Data Agent).
- **RAG Agent**: Searches an indexed document store for unstructured information.
- **Web Agent**: Uses the Bing Search tool for real-time web queries.
- **Databricks Agent**: A custom integration to query Databricks Genie (via function calls).

## Data-Driven Routing with Purview

The key to this architecture is making the orchestrator aware about the available data sources. We achieve this by giving it a tool that can search the Microsoft Purview data catalog. This tool, `search_catalog`, gives the agent visibility into the data estate.

The orchestrator's instructions define a workflow: first, call Purview, then decide where to route.

```python
"""You are a routing agent for Microsoft Purview.
Your role is to help users find and access the right data sources and agents.

WORKFLOW:
1. ALWAYS start by using the search_catalog function to find relevant data assets.
2. If there are multiple possible assets that could match, ask clarifying questions.
3. Once a data asset was identified from the catalog results:
   - If genie agent is mentioned, use the handoff_genie_agent function.
   - If there is a RAG agent associated, call the rag_agent.
   - If there is a Fabric agent associated, call the fabric_agent.
   - If the query is off-topic and no relevant data assets are found, use the web_agent.

IMPORTANT:
- NEVER answer questions yourself. Always route to appropriate functions or connected agents.
- Rely entirely on the search_catalog results to guide your routing decisions.
"""
```

## Tools and Connected Agents

With the routing logic defined, we equip the orchestrator with its tools. These include standard `FunctionTool` definitions for calling Purview and Databricks, and `ConnectedAgentTool` definitions for the specialized agents.

Azure AI Agent Service treats a connected agent just like any other tool. The model sees the agent's name and description and can choose to invoke it.

```python
from azure.ai.agents.models import ConnectedAgentTool, FunctionTool

def create_routing_agent(self, connected_agents: Dict[str, Any], search_function, genie_function) -> Any:
    function_tool = FunctionTool(functions={search_function, genie_function})

    connected_tools = [
        ConnectedAgentTool(
            id=agent.id,
            name=agent_name,
            description=f"Delegate to {agent_name} based on the query and catalog results"
        )
        for agent_name, agent in connected_agents.items()
    ]

    all_tools = function_tool.definitions + [tool.definitions[0] for tool in connected_tools]

    return self.project_client.agents.create_agent(
        model=settings.MODEL_DEPLOYMENT_NAME,
        name="purview_routing_agent",
        instructions="...", # Instructions from above
        tools=all_tools
    )
```

The Agent Service manages the entire chat lifecycle. When a user sends a message, it's added to a thread, which maintains the conversation history. The service orchestrates the tool calls, whether it's a simple function or a handoff to another agent, and ensures the context is preserved.

## The Demo in Action

The front-end is a simple React chat application that visualizes the entire process. When a user submits a query, they see the system's "thought process" in real-time:

1. **Purview Analysis**: The orchestrator queries Purview to identify the relevant data assets for the request.
2. **Routing Decision**: The chosen agent (e.g., Fabric Agent, RAG Agent) takes over.
3. **Final Response**: The specialized agent provides the answer, complete with citations if applicable.

The UI also exposes the concept of threads as chat sessions, allowing a user to maintain multiple conversations simultaneously.

![Agent Routing in Action](/images/agent-routing-with-azure-ai-foundry-and-microsoft-purview-2.gif)

## Key Takeaways

- **Handoffs are a powerful pattern.** As your AI solution grows, use a dedicated orchestrator agent to route tasks to specialized agents.
- **Let the LLM be the router.** With clear instructions and well-defined tools, you can use natural language to define complex routing logic.
- **Use Connected Agents.** Azure AI Foundry's Agent Service handles the complexity of threads, tool execution, and agent-to-agent communication, letting you focus on the agent's capabilities.
- **Make routing data-aware.** Integrating a data catalog like Microsoft Purview allows your agent to make informed routing decisions based on where data actually lives. This pattern can even be extended to ask clarifying questions when ambiguity exists.

By combining a managed agent platform with a data-aware routing strategy, you can build modular and scalable AI systems that leverage the unique skills of each agent.

## References

- **Sample Repository**: Agent Router - Purview-powered intent routing - [https://github.com/aymenfurter/agent-router](https://github.com/aymenfurter/agent-router)
- **Azure AI Agent Service Documentation**: [https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview)
- **Microsoft Purview Documentation**: [https://learn.microsoft.com/en-us/purview/](https://learn.microsoft.com/en-us/purview/)
