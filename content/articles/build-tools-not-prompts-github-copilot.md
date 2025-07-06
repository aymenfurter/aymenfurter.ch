---
title: "Build Tools, Not Prompts – Extend GitHub Copilot with Task-Specific Agents"
date: 2025-01-05T00:00:00Z
draft: false
emoji: "🔧"
description: "Learn how to extend GitHub Copilot with purpose-built tools using the Model Context Protocol (MCP) and Azure AI Agent Service for more effective development workflows."
tags: ["AI", "Development", "Automation"]
categories: ["AI", "Development"]
weight: 6
link: https://www.linkedin.com/pulse/build-tools-prompts-extend-github-copilot-agents-aymen-furter-yo2ie
---

![Architecture overview showing how GitHub Copilot interacts with MCP tools and Azure AI Agent Service](/images/build-tools-copilot-architecture.png)

[GitHub.com](https://github.blog/changelog/2025-05-19-github-copilot-coding-agent-in-public-preview/) recently announced the public preview of its **Copilot coding agent**, which can take ownership of entire issues, plan the steps, and work through them autonomously. Similarly, [Codex](https://openai.com/index/introducing-codex/) from OpenAI has shown how models can interact with codebases directly when connected to a repository.

These capabilities are promising, but not all tasks should be delegated to autonomous agents. The two main challenges are:

- **Reliability**: Large tasks like migrating a full legacy app often fail when attempted in a single shot. The agent may technically be capable, but without breaking the work into smaller steps, it lacks the planning and structure needed to succeed.
- **Need for supervision**: Some work requires manual validation or controlled execution, especially when risk or impact is high.

A more practical approach is to give autonomous agents **well-scoped, verifiable tasks** that are time-consuming for humans but simple in logic. For instance, extending test coverage based on existing tests.

Sometimes the limitation is not model capability, but the **abstraction level** of inputs. This is where purpose-built tools come in.

---

## Augmenting Copilot with Purpose-Built Tools

You can raise Copilot's effectiveness by giving it tools instead of just prompts. These tools can be made callable within the IDE via the **Model Context Protocol (MCP)** and executed through **Agent Mode**.

Microsoft is already applying this approach across its ecosystem. The [PostgreSQL extension for VS Code](https://techcommunity.microsoft.com/blog/adforpostgresql/announcing-a-new-ide-for-postgresql-in-vs-code-from-microsoft/4414648?utm_source=chatgpt.com) and the [Azure MCP server](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/overview?utm_source=chatgpt.com) make task-specific logic accessible to Copilot inside the IDE. The [GitHub Copilot App Modernization for Java (preview)](https://learn.microsoft.com/en-us/azure/developer/java/migration/migrate-github-copilot-app-modernization-for-java-quickstart-assess-migrate) extension does the same for Java applications, offering structured assessment and upgrade workflows through Agent Mode in Visual Studio Code.

You can do the same: create tools that address common friction points and make them callable by Copilot. Let's walk through a real-world example.

---

## Example: Migrating ETL Pipelines with an Order-Consistency Agent

In a recent project, we migrated a legacy ETL pipeline to a modern stack. The old system generated flat files. While values matched in the new version, the row order often differed, causing every diff line to show up even when the data was identical.

To solve this, I built a small tool called order_consistency_agent using the [Azure AI Agent Service](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview). It uses the same code interpreter tech behind ChatGPT and Microsoft 365 Copilot.

---

## Step-by-Step Workflow

**1. Set up the agent client**

We start by creating an agent client and authenticating using the default Azure identity.

```python
client = AgentsClient(
    endpoint=os.environ["PROJECT_ENDPOINT"],
    credential=DefaultAzureCredential()
)
```

**2. Upload input files**

We upload files into the sandbox so the agent can read them.

```python
file_ids = []
for path in ["/workspace/data/input.csv", "/workspace/data/output.csv"]:
    filename = os.path.basename(path)
    uploaded = client.files.upload_and_poll(
        file_path=path, 
        filename=filename, 
        purpose=FilePurpose.AGENTS
    )
    file_ids.append(uploaded.id)
```

**3. Create the agent**

We attach the uploaded files and give the agent instructions.

```python
tool = CodeInterpreterTool(file_ids=file_ids)
agent = client.create_agent(
    name="order_consistency_agent",
    model="gpt-4o",
    instructions="Sort both files based on matching columns. Save the reordered versions.",
    tools=tool.definitions,
    tool_resources=tool.resources
)
```

**4. Run the agent**

We create a thread, send a user message, and let the agent take it from there.

```python
thread = client.threads.create()
client.messages.create(
    thread_id=thread.id,
    role="user",
    content="Please reorder the files and return the results."
)
client.runs.create_and_process(thread_id=thread.id, agent_id=agent.id)
```

**5. Download the output files**

Once done, we pull the output files back into the workspace.

```python
for message in client.messages.list(thread_id=thread.id):
    for ann in message.file_path_annotations:
        client.files.save(
            file_id=ann.file_path.file_id,
            file_name=ann.text.split("/")[-1],
            target_dir="/workspace/data"
        )
```

![Visual Studio Code view after the agent run, showing the reordered CSV files for both source and legacy ETL outputs, confirming consistent structure for comparison](/images/build-tools-vscode-results.png)

This gives you output files with consistent row order for direct comparison.

---

## Make It Callable from GitHub Copilot with MCP

Once tested, the agent is exposed to GitHub Copilot using MCP.

### FastMCP server definition

```python
mcp = FastMCP(name="etl_helpers")

@mcp.tool
async def order_consistency_agent(source_file: str, output_file: str, ctx: Context) -> str:
    return await run_order_agent(ctx, source_file, output_file)

if __name__ == "__main__":
    mcp.run()
```

### VS Code setup

`.vscode/mcp.json:`

```json
{
  "servers": {
    "etl-agents": {
      "command": "python",
      "args": ["${workspaceFolder}/mcp_server.py"],
      "env": {
        "PROJECT_ENDPOINT": "https://your-endpoint",
        "...": "..."
      },
      "workingDirectory": "${workspaceFolder}"
    }
  }
}
```

Now Copilot can detect and invoke the tool directly inside your editor:

![GitHub Copilot calling the order_consistency_agent to reorder input and output CSVs, aligning them for accurate comparison while preserving data integrity](/images/build-tools-copilot-usage.png)

---

## Teach Copilot When and How to Use the Tool

Just registering a tool isn't enough. You need to provide guidance.

`.github/copilot-instructions.md:`

```markdown
# Copilot Instructions
Use the `order_consistency_agent` to align outputs generated from legacy and new logic.
```

`.vscode/settings.json:`

```json
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true
}
```

This ensures Copilot knows when the tool is appropriate and how to invoke it correctly.

---

## Key Takeaways

- This isn't about building massive agents. It's about solving real developer friction with targeted, reusable tools.
- Tools raise Copilot's level of abstraction by letting it delegate certain tasks to other agents, while keeping its own context focused and uncluttered.
- Instruction files provide Copilot with additional context and usage hints, turning your tools into true extensions of its capabilities.
- The [etl-migration-agent GitHub repository](https://github.com/aymenfurter/etl-migration-agent) includes the full working sample. It also showcases advanced techniques like **LLM-as-a-Judge**, which runs multiple agent executions and picks the best result for consistency and accuracy.

This approach applies beyond ETL modernization: anywhere repeatable developer tasks exist, you can build and expose tools to streamline them, while keeping Copilot in the loop.
