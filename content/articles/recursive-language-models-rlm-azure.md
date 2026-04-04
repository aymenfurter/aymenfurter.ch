---
title: "Recursive Language Models: When Your Agent Explores Data Like a Developer"
date: 2026-04-04T00:00:00Z
draft: false
emoji: "🔁"
github_repo: "https://github.com/aymenfurter/rlm-on-azure"
description: "LLMs are getting better at writing and executing code with every release. Recursive Language Models apply that skill to data retrieval by loading the corpus into a sandboxed REPL and letting the agent write code to explore it. An experimental alternative to traditional retrieval."
tags: ["AI", "Azure", "GitHub Copilot", "RAG"]
categories: ["AI", "Development"]
weight: 100
---

![RLM trace view showing iterative code execution](https://github.com/aymenfurter/rlm-on-azure/raw/main/docs/screenshot-trace.png)

LLMs are getting better at writing and executing code with every release. Not just generating snippets, but actually exploring file systems, reading output, adjusting their approach, and trying again. This capability generalizes far beyond writing software.

I was recently looking into **Recursive Language Models (RLM)** as proposed by Zhang, Kraska & Khattab (2026) in their paper [*Recursive Language Models*](https://arxiv.org/abs/2512.24601). The core idea: instead of feeding the full prompt into the model's context window, you give the LLM a sandboxed Python REPL with the corpus loaded as a variable and let it write code to explore, filter, extract, and compose an answer. The model decides how to navigate the data. A virtual filesystem pattern where the agent controls its own search strategy.

I adopted it for the Microsoft ecosystem: GitHub Copilot SDK as the harness, Azure Container Apps Dynamic Sessions as the sandbox, Microsoft AI Foundry for model endpoints. The implementation is [open source on GitHub](https://github.com/aymenfurter/rlm-on-azure).

To be clear upfront: this is an experimental exploration. A typical RLM query takes 15-60 seconds and costs vary widely depending on the task. For most workloads, you would want to look at [agentic retrieval in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview) (currently preview), which gives you many of the same benefits (query decomposition, multi-hop reasoning, follow-up queries) with much better latency and a managed pipeline. What makes RLM interesting is the approach itself: the virtual filesystem pattern and the level of adaptability it enables.

## How the RLM Loop Works

Instead of a search query, the agent gets a REPL. The corpus is uploaded as a file, loaded into a `context` variable, and the agent writes Python code to explore it. A typical execution:

1. **INIT**: Sandboxed session created, corpus uploaded, helper functions injected.
2. **CODE**: The LLM explores the context structure: how long is it, what format, what sections exist.
3. **CODE**: It searches and filters for relevant sections using regex, string operations, or whatever approach makes sense.
4. **CODE**: It extracts details, optionally spawning `rlm_query()` sub-tasks to delegate chunks.
5. **CODE**: It composes an answer and sets `Final = answer` to signal completion.

The loop repeats until `Final` is set or the iteration limit is reached. Here is what the REPL initialization looks like:

```python
Final = None
used_sections = []

# Load corpus from uploaded file
with open("/mnt/data/corpus.txt", "r", encoding="utf-8") as _f:
    context = _f.read()
```
*Source: [rlm/repl_init.py](https://github.com/aymenfurter/rlm-on-azure/blob/main/rlm/repl_init.py)*

The agent typically starts by exploring what it is working with: checking length, scanning for structure, identifying section headers. It adapts to whatever data format it encounters. This is the key difference from traditional retrieval: there is no fixed ranking function. The model decides its own search strategy at every step.

## Recursion

The REPL also exposes an `rlm_query()` function that spawns a **sub-task**, a new Copilot SDK session with its own code-writing loop.

When the corpus is too large to process in one pass, the agent chunks it and delegates:

```python
import re
sections = re.split(r'^## ', context, flags=re.M)[1:]
buffers = []
for section in sections:
    title = section.split('\n', 1)[0]
    answer = rlm_query(
        f"Summarize this section about {title}",
        sub_context=section[:8000],
    )
    buffers.append(f"{title}: {answer}")

Final = rlm_query(
    f"Based on these summaries, answer: {query}",
    sub_context="\n".join(buffers),
)
```
*Illustrative: the LLM decides its own chunking strategy at runtime. See [rlm/repl_init.py](https://github.com/aymenfurter/rlm-on-azure/blob/main/rlm/repl_init.py) for the REPL setup.*

## The Implementation

For orchestration I used the **GitHub Copilot SDK** with BYOK (Bring Your Own Key), pointing at my own Microsoft AI Foundry endpoint. The root session gets a single `run_python` tool with all built-in tools disabled:

```python
llm = await create_root_session_with_tool(
    system_prompt, repl, on_step, counter, max_iterations,
)

response = await llm.send(
    f"Query: {question}\n\n"
    f"Use the run_python tool to analyze the `context` variable "
    f"and answer this query."
)
```
*Source: [rlm/agents.py](https://github.com/aymenfurter/rlm-on-azure/blob/main/rlm/agents.py)*

The sandbox runs on **Azure Container Apps Dynamic Sessions**, disposable sandboxed environments that spin up on demand, execute untrusted code safely, and tear down when done. The full infrastructure deploys with `azd up` via Bicep.

## Where This Fits

The main advantage of the RLM approach is adaptability. The agent writes its own search strategy per query, so it can handle messy, unstructured, or unfamiliar data without upfront indexing. It works well for latency-insensitive tasks with frequently changing data, or analytical queries that require conditional logic and aggregation.

The drawbacks are real. Latency is 15-60 seconds per query. Token cost varies widely and can spike on complex tasks.

The project is MIT licensed: [https://github.com/aymenfurter/rlm-on-azure](https://github.com/aymenfurter/rlm-on-azure)

## References

- Zhang, A. L., Kraska, T., & Khattab, O. (2026). *Recursive Language Models*. [arXiv:2512.24601](https://arxiv.org/abs/2512.24601)
