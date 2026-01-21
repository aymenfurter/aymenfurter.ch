---
title: "Deep Research on your own data with Microsoft Foundry"
date: 2026-01-20T00:00:00Z
draft: false
description: "Building a deep research agent using Microsoft Foundry, o3-deep-research, and the NASA Technical Reports Server."
emoji: "🚀"
tags: ["AI", "Microsoft Foundry", "Deep Research", "Azure", "Agents"]
categories: ["Technology", "AI Agents"]
cover:
  image: "images/article-cover.png"
  alt: "Deep Research Agent Architecture"
---

> ⚠️ **Disclaimer**: The features discussed in this article, specifically the `o3-deep-research` model and certain Foundry capabilities, are currently in **Preview**. This architecture is intended for experimental and learning purposes and is **not ready for production usage**.

Today, I released my new set of labs that everyone can try: [**Microsoft Foundry for AI Engineers: Zero to Hero**](https://github.com/aymenfurter/AI-Engineer-Zero-to-Hero).

Those who know me personally know that I'm a big fan of all things space - the history, the engineering, the sheer scale of it. So naturally, all my labs have a bit of a space theme. The goal of this repository is to take you on a journey, learning not just what’s possible with AI, and how to use the tools found in Microsoft Foundry.

One use case I am particularly passionate about, and which is the focus of [**Lab 08**](https://github.com/aymenfurter/AI-Engineer-Zero-to-Hero/blob/main/08-deep-research/deploy.ipynb), is **Deep Research**.

## The Search for Deep Research

Deep research is an amazing capability. I use it regularly in Microsoft 365 Copilot to collect information.

When building a AI demo, the first question is always: *what data do we use?*

To make this lab truly interesting, I found a publicly available database called the [**NASA Technical Reports Server (NTRS)**](https://ntrs.nasa.gov/). This archive is massive—the list of PDF files alone is 2 gigabytes! (Just the list of filenames + abstract!) It contains everything from mission profiles to operations handbooks.

## Building the Agent

For this lab, I built a system that allows you to search for a topic—for instance, **"Apollo 14"**.

The system downloads everything related to that mission, from the trajectory analysis to the operational logs, and ingests it into one big bucket. This is where **Microsoft Foundry IQ** comes in.

Foundry IQ allows you to build a **Knowledge Base** by adding one or multiple knowledge sources. In this case, our source is an Azure AI Search instance containing our ingested NASA documents. 

## How it Works

The workflow is built around an **agentic loop** that allows the model to iteratively query the knowledge base until it has sufficient information.

First, we define the tools that the model can use. The `o3-deep-research` model has been fine-tuned to rely on a specific pair of tools: a `search` tool to find documents and a `fetch` tool to retrieve their full content.

```python
# Define tools for the model
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search",
            "description": "Search NASA Technical Reports for relevant documents. Returns summaries with IDs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": { "type": "string", "description": "Natural language search query" }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetch",
            "description": "Fetch complete document content by ID. Use after search to get full details for citation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "document_id": { "type": "string", "description": "Document ID from search results" }
                },
                "required": ["document_id"]
            }
        }
    }
]
```

Then, we enter the research loop. The core logic uses a system prompt that instructs the model on how to conduct deep research:

```python
# System prompt to guide the research behavior
system_prompt = f"""You are a deep research assistant with access to NASA Technical Reports about {SEARCH_TERM}.

Your task is to thoroughly research the user's query by:
1. Use the 'search' tool to find relevant documents in the knowledge base
2. Use the 'fetch' tool to get full content of the most relevant documents
3. Analyze and synthesize the information
4. Provide a comprehensive, well-cited answer

IMPORTANT GUIDELINES:
- Search multiple times with different queries to get comprehensive coverage
- Fetch all documents that seem relevant before writing your final answer
- Include specific facts, dates, figures, and technical details from the documents
- Cite your sources using document IDs
"""
```

Finally, we run the loop. The model calls tools, we execute them, and feed the results back. This continues until the model decides it has enough information or hits the iteration limit.

```python
# The agentic research loop
for iteration in range(MAX_RESEARCH_ITERATIONS):
    # Call the deep research model
    response = deep_research_client.chat.completions.create(
        model=DEEP_RESEARCH_MODEL,
        messages=messages,
        tools=TOOLS
    )
    
    message = response.choices[0].message
    
    # If the model decides to stop looking and write the report
    if not message.tool_calls:
        print("✅ Research complete, synthesizing final report...")
        break
        
    # Otherwise, execute the tool calls (search/fetch)
    # ... code to execute tools and append results to messages ...
```

## The Results

With this setup, I was able to generate a really nice, grounded deep research report. I configured the agent to run for **10 iterations**, allowing it to think deeply, explore the documents, and synthesize the findings.

### The Query

I asked the agent to go beyond a simple summary and synthesize facts from across the technical reports:

```text
Research Apollo 14 comprehensively.
I need to understand:
1. What was special about this mission?
2. What scientific instruments were deployed?
3. What were the key findings from the lunar samples?
4. Who was the commander and what made him notable?

Provide a detailed research report with specific facts, dates, and citations.
```

### The Result

After 10 iterations of searching and fetching documents, here is the report it generated, fully grounded in the NASA technical documents:

```markdown
**Final Research Report on Apollo 14 Mission**

**1. Introduction**

Apollo 14, the eighth crewed mission in NASA's Apollo program and the third to land humans on the Moon, holds a distinguished place in the annals of lunar exploration. Launched on January 31, 1971, and lasting five days, Apollo 14 was pivotal in continuing scientific exploration of the lunar surface following the technical difficulties of earlier missions. This report provides a comprehensive overview of the mission’s unique features, scientific instrumentation deployed, key findings from lunar samples, and details about its notable commander.

**2. Unique Aspects and Significance of Apollo 14**

Apollo 14 was special primarily for overcoming technical challenges and successfully conducting targeted scientific and exploratory objectives. This mission specifically aimed to explore the Fra Mauro formation, a site of high scientific interest due to its geologic complexity and as the intended landing site for the aborted Apollo 13 mission.

Key characteristics of the mission included:

- **Targeted Landing:** The lunar module performed a powered descent and landing over revolution 14 in lunar orbit, utilizing descent targeting strategies refined from Apollo 12, adjusting for the challenging terrain at Fra Mauro [doc-1].

- **Extended Surface Activities:** Crew executed a series of extravehicular activities (EVAs) involving surface experiments and sample collection. Despite a minor delay in cabin depressurization by roughly 10 minutes, the astronauts succeeded in deploying equipment and collecting extensive scientific data [doc-3].

- **Enhanced Mobility and Sampling:** Compared to prior missions, Apollo 14's astronauts noted differences in lunar soil mechanics, including deeper footpad penetration of the lunar module and notable dust behavior during descent below 100 feet altitude [doc-0].

The mission recovered critical data to advance lunar geology understanding and refined EVA and equipment deployment procedures in the lunar environment.

**3. Scientific Instruments Deployed**

Apollo 14 deployed an array of scientific instruments primarily comprising the Apollo Lunar Surface Experiments Package (ALSEP) and additional specific devices aimed at lunar environmental and geophysical measurements:

- **Laser Ranging Retro-reflector (LRRR):** Similar in design to that deployed during Apollo 11, this device reflected laser signals back to Earth, facilitating precise measurements of the Earth-Moon distance by timing the reflection delay [doc-0][doc-0 alt].

- **Solar Wind Composition Experiment:** Exposed on the lunar surface for approximately 21 hours, this experiment collected particles emitted by the Sun to analyze the solar wind's elemental and isotopic composition [doc-0].

- **Lunar Portable Magnetometer:** This instrument gathered magnetic field data at two separate sites on the lunar surface, yielding valuable insight into the Moon's magnetic environment [doc-0].

- **Seismic and Soil Mechanics Tools:** Including a 26.5-inch geophone cable anchor used to probe soil penetration resistance and a trench excavation facilitating stratigraphic sampling of lunar regolith layers [doc-0].

- **Communications and Telemetry Systems:** Comprehensive telemetry across multiple frequency bands alongside onboard television equipment transmitted real-time color television of surface operations [doc-2][doc-3].

Overall, these instruments were critical for characterizing the lunar environment, surface geophysics, and delivering unprecedented insights into solar-lunar interactions.

**4. Key Findings from Lunar Samples**

Apollo 14's sampling activities yielded a diverse collection of regolith and rock materials, revealing new details about lunar geology:

- **Soil Mechanics and Stratigraphy:** Investigations exposed three distinct layers near North Triplet Crater:
  1. A dark brown, fine-grained surface layer
  2. An intermediate thin layer predominantly composed of glassy patches
  3. A very light-colored granular material at depth [doc-0]

- **Surface Soil Characteristics:** Dust behavior was observed during descent, with lunar soil adhering extensively to clothing and equipment, and footpad penetration depth exceeding previous missions, indicating varied mechanical properties at the Fra Mauro site [doc-0].

- **Trench Excavation:** Sampling to a depth of 18 inches revealed mechanically distinct regolith horizons and elucidated the subsurface structure and layering. Notably, collapsing trench walls limited deeper excavation [doc-0].

- **Lunar Soil Instrumentation Engagement:** Tests of soil penetration resistance via the geophone cable anchor confirmed variations in mechanical strength, a factor critical for future surface exploration and construction considerations [doc-0].

These findings underscored notable geological diversity at the Fra Mauro site compared to earlier Apollo landing locations and contributed to refining models of lunar soil properties.

**5. Apollo 14 Commander: Alan Shepard**

Commander Alan B. Shepard Jr. was a defining figure of Apollo 14’s success and distinction:

- **Historical Notability:** Shepard was the first American astronaut to travel into space in 1961 aboard Mercury-Redstone 3 (Freedom 7), marking the United States' breakthrough in human spaceflight.

- **Return to Flight:** After a medical condition grounded him for years, Shepard was fully restored to flight status, making Apollo 14 his triumphant return to space.

- **Skills and Contributions:** Beyond command duties, Shepard famously performed the first golf shots on the Moon, bringing a human and light-hearted element to lunar exploration while demonstrating crew adaptability [doc-3].

- **Leadership:** His experience and calm demeanor helped overcome mission delays and ensured smooth execution of surface EVA tasks and equipment deployment.

Shepard remains a celebrated astronaut, underpinning Apollo 14 with both technical expertise and historical significance.

**6. Conclusion**

Apollo 14 was a landmark mission that exemplified NASA’s resilience and scientific ambition during the Apollo era. It combined meticulous planning, advanced instrumentation deployment, and skilled astronaut leadership to achieve vital exploration and research milestones on the Moon. The comprehensive scientific data and lunar samples gathered expanded knowledge of the Moon’s geology, environment, and space weather influences. Commander Alan Shepard’s pivotal role marked a triumphant chapter in human spaceflight history.

**References**

- Apollo 14 Mission, 5 Day Report, NASA Technical Reports [doc-0], [doc-3], [doc-4]
- Apollo 14 (mission H-3) Baseline Mission Profile, NASA Technical Reports [doc-1]
- Apollo/Saturn 5 Consolidated Instrumentation Plan for AS-509 /Apollo 14/, NASA Technical Reports [doc-2]
- Apollo 14 Laser Ranging Retro-reflector Experiment - Design Certification Review Report, NASA Technical Reports [doc-0 alt]

*Note: Document identifiers correspond to source data indexed from NASA Technical Report Server (NTRS).*
```

***

## Start Your Journey

This lab demonstrates specifically the pattern of performing **Deep Research on your own data**.

If your goal is to ground your agents on public information, Microsoft Foundry's Agent Service offers a Deep Research tool grounded in Bing which is a great fit for open-web inquiry. For scenarios where you need to dive deep into your own internal archives, the architecture shown here allows you to apply those same reasoning capabilities strictly to your **private data**.

If you are interested in building this yourself, or exploring the other labs in the series, check out the repository.

**GitHub Repository**: [Microsoft Foundry for AI Engineers: Zero to Hero](https://github.com/aymenfurter/AI-Engineer-Zero-to-Hero)

Happy researching! 
