---
title: "Document Your AI Agents Like Code: A GitHub Template for A2A Agent Inventories"
date: 2025-07-20T00:00:00Z
draft: false
description: "A Git-based solution for creating an internal inventory of your A2A-compatible AI agents, providing a searchable interface for documenting and discovering agents within your organization."
tags: ["AI", "Development", "Automation", "Integration"]
categories: ["Technology", "AI Systems"]
cover:
  image: "images/IMG_0006.png"
  alt: "Document Your AI Agents Like Code"
---

![Agent Directory](/images/IMG_0006.png)

Many years ago, I was part of a project migrating legacy APIs from an old XML-based protocol to modern, REST-based OpenAPI specs. A lesson that has stuck with me from that experience is that while you're building, everything feels clean and modern. You might take shortcuts to meet a deadline, telling yourself you'll clean it up later. But "later" rarely comes. The team's focus shifts, new deadlines appear, and the small documentation gaps become permanent technical debt.

What I learned then was the critical importance of not only documenting what your APIs do but also understanding their ecosystem: Who consumes them? What business processes are impacted by a change?

Fast forward to today, and we're in a similar, yet far more complex, situation with AI agents. Agents aren't just static endpoints; their behaviour is dynamic. They use a set of tools, collaborate with other agents, and their execution path isn't always predictable just by reading the code. This makes understanding dependencies and fostering reuse incredibly challenging.

Emerging standards like the Model Context Protocol (MCP) for tools and the Agent-to-Agent (A2A) protocol for agent interoperability are solving the standardization problem. But a protocol is only half the battle. The other, equally important half is discoverability. How do teams find out which agents already exist before building new ones?

## An Internal Agent Inventory

To address this gap, I created the Agent Directory Template, a simple, Git-based solution for creating an internal inventory of your A2A-compatible AI agents. It provides a beautiful, searchable interface for documenting and discovering agents within your organization.

🌟 [View Live Demo](https://aymenfurter.github.io/agent-dir/) | 🚀 [Get the Template on GitHub](https://github.com/aymenfurter/agent-dir)

This template is designed for human discoverability and documentation, not for runtime discovery. It's a "phonebook" for your agents, helping you track their capabilities, find points of contact, and prevent reinventing the wheel.

![Agent Directory Interface](/images/IMG_0007.png)

## A GitOps Approach to Agent Documentation

The philosophy is simple: treat your agent docs like you treat your code. The entire directory is managed through a Git repository, making it a single source of truth.

1. **Document Agents as Agent Cards**: Developers define their agents using the standard A2A AgentCard JSON schema. This file details the agent's name, skills, input/output modes, endpoints, and contact information. All agent definitions live in the `/agents` directory of the repository.

2. **Commit and Push**: New agents or updates are added via a pull request. This creates a natural review process where teams can ensure documentation is complete—for instance, checking that a point of contact under `provider.organization` is correct and up to date.

3. **Build Process**: A GitHub Actions workflow triggers on every push to the main branch.

4. **Static Site Generation**: Hugo takes the Markdown content and data file and builds a complete, static HTML website.

5. **Deploy Anywhere**: The generated `public/` folder is deployed automatically to GitHub Pages, but it can be hosted on any static hosting service like Azure Static Web Apps. By adding OIDC security, you can easily restrict access to your internal organization.

## The Hidden Cost of Skipping Documentation

We are at the beginning of building complex, automated processes with AI agents. The standards and protocols we use today will inevitably evolve. This makes establishing good documentation habits right now more critical than ever.

This template helps you:

- **Foster Reuse**: Enable teams to discover and leverage existing agent capabilities.
- **Manage Complexity**: Get a clear overview of your agent landscape and its dependencies.
- **Prevent Technical Debt**: Ensure every agent is documented as part of its lifecycle.
- **Prepare for the Future**: A well-documented inventory makes future migrations and modernizations manageable. While this directory is a simple first step, it builds the foundational discipline needed for a scalable agent ecosystem.

## Getting Started

You can have your own agent directory up and running in minutes. The project is available on GitHub and includes sample agents to get you started.

1. **Fork or Clone the Repository**: [github.com/aymenfurter/agent-dir](https://github.com/aymenfurter/agent-dir)
2. **Add Your Agents**: Place your AgentCard JSON files in the `/agents` directory.
3. **Push Your Changes**: The GitHub Action will automatically build and deploy the site to your GitHub Pages.

I welcome anyone to try it out. Even if you haven't fully adopted the A2A standard yet, this template offers a structured way to think about documenting the agents you're building today.
