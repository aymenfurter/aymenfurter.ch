---
title: "The Future is Composable: Building Interoperable AI Systems with MCP and A2A Protocols"
date: 2025-07-14
draft: false
emoji: "🔗"
description: "Exploring how standardized protocols like Model Context Protocol (MCP) and Agent2Agent (A2A) enable the creation of flexible, interoperable AI agent ecosystems."
tags: ["AI", "Azure", "Experimentation"]
weight: 10
---

![The Future is Composable: Building Interoperable AI Systems](/images/architecture.png)

*My views here are my own and do not reflect any employer or organization I may be affiliated with. Disclaimer: this article was written in July 2025. The landscape may change after this date.*

Special thanks to Sanjeev Kumar and Mike Blöchlinger for the insightful discussions and collaboration throughout this project. Your perspective helped refine the architecture and pushed the thinking beyond the usual boundaries.

The AI landscape is evolving so fast that today's cutting-edge model is tomorrow's legacy system. The future of AI apps is composable: flexible ensembles of specialized agents that work together. But how do you get them to collaborate without creating a brittle mess of custom integrations?

This is where standardization becomes your secret weapon. Protocols like the **Model Context Protocol (MCP)** and the **Agent2Agent (A2A) protocol** are the emerging standards that let us build interoperable and future-proof AI. To show you what's possible, I built a technology demonstrator that orchestrates a team of specialized AI agents using the latest from Microsoft. This project walks through a real-world workflow: agents collaborate to pull tasks from a wiki page, format them into structured work items, and create tickets in Azure DevOps—all through standard protocols.

## MCP: The Standard for Agent Tooling

Let's start with the **Model Context Protocol (MCP)**. While still a young technology, MCP is quickly becoming a foundational standard for how an AI agent talks to its tools. It's already super popular as part of GitHub Copilot and other IDEs like Cursor.

MCP is your go-to when you need to give an agent a new ability. Instead of writing a one-off function tightly coupled to a single agent, you expose it via an MCP server. This makes your tool a reusable, discoverable asset that any MCP-compatible agent can use, ensuring your development investment pays off. As you build more tools, governance becomes critical. This is where the ecosystem shines: you can use **Azure API Management** to form a [security boundary around your MCP servers](https://techcommunity.microsoft.com/blog/integrationsonazureblog/azure-api-management-your-auth-gateway-for-mcp-servers/4402690) and **Azure API Center** to create an inventory, making sure your tools don't become unmanaged technical debt.

In the demo, the **Confluence Agent** uses MCP to connect to a remote Atlassian server. The implementation is surprisingly clean.

### Connecting to a Remote MCP Server

Inside the Confluence agent, we just define the MCP tool configuration and pass it to the Azure OpenAI's **Responses API**. This dynamically equips the model with a new tool and tells it how to authenticate.

```python
mcp_config = {
    "type": "mcp", "server_url": os.environ["MCP_SERVER_URL"],
    "server_label": os.environ["MCP_SERVER_LABEL"],
    "require_approval": "never", 
    "allowed_tools": ["getConfluencePage"], 
    "headers": {"Authorization": f"Bearer {self.atlassian_token}"}
}

# Pass the MCP tool configuration to the OpenAI Responses API
response = await asyncio.to_thread(
    self.client.responses.create,
    model=os.environ["MODEL_DEPLOYMENT_NAME"],
    input=input_data,
    tools=[mcp_config]
)
```

See: [***confluence_agent/main.py***](https://github.com/aymenfurter/a2a/blob/main/confluence_agent/main.py)

A word of caution: more and more people are publishing MCP servers on GitHub. Like any other code, don't just blindly install an MCP server from a vendor you don't trust. Review the container or code, because this is a new vector that needs proper governance, even if it's just running on a single developer's laptop.

### A2A: Composing Agents Across Different Stacks

While MCP is great for connecting agents to tools, the **Agent2Agent (A2A) protocol** tackles a different, more complex challenge: getting agents to talk to *each other*. It's a younger protocol, but its goal is to achieve interoperability and break agents out of their process boundaries, allowing for remote and asynchronous communication.

This is where things get really interesting. The true power of A2A is that it allows you to compose a workflow from agents built on entirely different orchestration layers. Think about it: a business analyst can build a powerful workflow in **Copilot Studio**, and a pro-dev team can expose a robust, scalable agent via the **Azure AI Agent Service**. A2A lets them collaborate without either team needing to know the internal details of the other's system.

In this demo, each agent is a self-contained application with its own stack:

1. **Confluence Agent**: Uses the **Azure OpenAI Responses API** directly—a simple, direct way to add tool-calling.

2. **Formatter Agent**: Built with **Copilot Studio**, this agent exposes a low-code workflow as a callable A2A service.

3. **DevOps Agent**: Leverages the **Azure AI Agent Service** from AI Foundry, which uses a serverless **Logic App** as its tool. This is a robust, production-ready pattern.

Without A2A, getting these three disparate systems to collaborate would be a nightmare of custom glue code. 

Let's be realistic, though. A2A is still an emerging standard. For now, this means using the a2a-sdk to act as the "glue code" that wraps each agent. As more platforms and frameworks build in native A2A support—for example, Semantic Kernel has it .NET but not yet in Python—this manual wrapping will become unnecessary. If you have to build all the glue code yourself, you're not simplifying; you're making it more complex. You have to regularly reassess if the added complexity is justified for your project *right now*.

A2A is also not going to make your agent more capable, for that, it's important to start with a strong design and agent architecture. My colleague Sanjeev has created a [**Agent Canvas Framework**](https://www.linkedin.com/pulse/introducing-agent-canvas-your-shortcut-designing-ai-agents-kumar-vd8se/) that can help with this part.

### Tying It All Together

```python
async def main():
    load_dotenv()
    
    async with UI() as ui:
        # Create remote A2A agents, each from a different stack
        confluence_agent = await RemoteA2AAgent.create("http://localhost:8002", ...)
        formatter_agent = await RemoteA2AAgent.create("http://localhost:8000", ...)
        devops_agent = await RemoteA2AAgent.create("http://localhost:8001", ...)
        
        agents = [confluence_agent, formatter_agent, devops_agent]
        
        # Setup and run the group chat, which acts as the meta-orchestrator
        chat = AgentGroupChat(agents=agents, termination_strategy=ChatTerminationStrategy(agents, ui))

        initial_query = "Analyze ... and extract todos/action items."
        await chat.add_chat_message(ChatMessageContent(role=AuthorRole.USER, content=initial_query))
        
        async for content in chat.invoke():
            ui.add_message(content.name, content.content)
            # ... (workflow logic to trigger next steps)
```

See: [***group_chat/main.py***](https://github.com/aymenfurter/a2a/blob/main/group_chat/main.py)

With our agents ready to talk via A2A, the final piece is the orchestrator. The demo uses AgentGroupChat from Semantic Kernel to manage the conversation flow between agents. It ensures that each agent gets a chance to speak in turn, allowing them to share their input and move the workflow forward step by step.

![Live Demo of the A2A Multi-Agent System](/images/demo.gif)

## Final Thoughts

Building with protocols requires a shift in mindset, but it's how we create AI systems that are built to last. Always remember to solve the business objective first—don't fight the communication protocol if it gets in the way of delivering value.

**Choose MCP when:**

- You are building tools for AI agents to consume. It's the most mature and widely supported option for this use case.
- You want to future-proof your tool investments and foster reuse across different agents and projects.
- You need to connect agents to existing APIs and data sources securely, leveraging the growing ecosystem of security patterns.

**Consider A2A when:**

- You are building a system with multiple, specialized agents that need to collaborate, especially if they are built by **different teams or on different tech stacks**.
- Long-term interoperability is a critical goal, and you want to align with the future of distributed AI. (though it may be a bit too soon for this).
- You can accept the current implementation complexity for the long-term benefit of a decoupled architecture. For a single team building one application, the overhead might not be worth it yet.

The support for these protocols is evolving rapidly, so it's important to reassess the landscape regularly. For now, MCP is a solid choice for tools. A2A is the one to watch and experiment with for complex, multi-agent scenarios. By understanding both, you can build AI applications that are not just powerful, but also ready for whatever comes next.

The full code for this technology demonstrator is available on GitHub: [**https://github.com/aymenfurter/a2a**](https://github.com/aymenfurter/a2a)
