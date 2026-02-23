---
title: "When Your AI Agent Has Admin Rights – Defense in Depth for Autonomous Copilots"
date: 2026-02-22T00:00:00Z
draft: false
emoji: "🛡️"
description: "How do you secure an autonomous agent that can deploy infrastructure, send messages, and call you on the phone? With layers — lots of them."
tags: ["AI", "Security", "Azure", "GitHub Copilot"]
categories: ["AI", "Security"]
weight: 100
---

![Layered security model](https://raw.githubusercontent.com/aymenfurter/polyclaw/27a2972f9d654a0630ec394ad0996e0178d6b163/app/frontend/public/layered-security.svg)

In my [previous article](/articles/building-an-ai-copilot-that-plans-remembers-and-calls-you-on-the-phone/) I introduced Polyclaw — an autonomous AI copilot inspired by [OpenClaw](https://github.com/openclaw/openclaw) and rebuilt to be Azure-native. It schedules its own work, builds long-term memory, and can call you on the phone. The follow-up question everyone asks is always the same: *but how do you keep it from going rogue?*

Fair question. The honest answer is that there is no single switch you flip. Security for an autonomous agent is a dial, not a toggle. What I will walk through here is a set of layered controls — leveraging Azure-native services like Entra ID, Azure AI Content Safety, and Container Apps Dynamic Sessions — that you can tune based on how much autonomy your situation actually warrants.

## The Problem with Autonomous Agents

Let's be precise about what makes this different. A chatbot responds to *your* input. An autonomous agent acts on its own — it executes code, deploys infrastructure, sends messages, makes phone calls, schedules future work. The blast radius of a mistake is categorically larger.

The risks are not hypothetical:

- **Unintended actions.** The agent misinterprets an instruction and overwrites a file, commits to the wrong branch, or messages the wrong channel.
- **Prompt injection.** A malicious website or document smuggles instructions that hijack the agent's behavior.
- **Credential misuse.** The agent has Azure credentials. If exploited, an attacker operates with whatever permissions the agent holds.
- **Cost overruns.** A scheduling loop or runaway tool chain spins up resources and generates unexpected bills.

You will not eliminate these risks. What you *can* do is shrink the blast radius, enforce least privilege, and insert humans at the right decision points. That is exactly what Polyclaw's security architecture is designed for.

## Separated Runtimes

The first architectural decision — and arguably the most important one — was splitting Polyclaw into two containers: **admin** and **runtime**.

![Admin and agent runtime architecture](https://aymenfurter.github.io/polyclaw/screenshots/web-hardening-network-container-arch.png)

| Container | Port | Purpose |
|-----------|------|---------|
| **Admin** | 9090 | UI, configuration, deployment, identity provisioning |
| **Runtime** | 8080 (internal) | Agent execution, tool invocation, chat, bot webhook |

The admin container owns all configuration, deployment, and management. Your personal Azure CLI session lives here. The runtime container executes the agent with its own scoped identity — and nothing else.

Each container has its own HOME directory (`/admin-home` and `/runtime-home`). The only shared surface is a `/data` volume for session data and configuration.

The implication: even if the agent runtime is compromised, the damage is confined to whatever permissions the runtime identity has. Which brings us to the next layer.

## Agent Identity

Polyclaw provisions a **dedicated Azure identity** for the runtime. The strategy depends on where you deploy:

| Deployment | Identity Type |
|------------|---------------|
| Docker / Docker Compose | Service principal (`polyclaw-runtime`) with client secret |
| Azure Container Apps | User-assigned managed identity (`polyclaw-runtime-mi`) |

The runtime identity is assigned the **minimum RBAC roles** required for operation:

| Role | Scope | Purpose |
|------|-------|---------|
| Azure Bot Service Contributor | Resource group | Create/update bot registrations |
| Reader | Resource group | Enumerate resources |
| Key Vault Secrets Officer | Key Vault | Read/write bot credentials |
| Session Executor | Session pool | Execute code in sandbox sessions |
| Cognitive Services User | Content Safety | Call Prompt Shields |

No Owner, no Contributor, no User Access Administrator. The security preflight checker verifies this automatically and flags any elevated roles it finds.

This is environment engineering applied to security. You do not tell the agent "please don't delete the resource group." You make it *impossible* — the identity simply does not have the permission.

## Guardrails Framework

![Guardrails](https://aymenfurter.github.io/polyclaw/screenshots/web-hardening-guardrails-intropage.png)

Identity and runtime isolation handle the infrastructure layer. But what about the agent's actual tool calls? What stops it from sending an email to the wrong person or committing to the wrong branch? This is where guardrails come in.

Every tool invocation — built-in tool, MCP server call, skill, file operation — is intercepted *before* execution and evaluated against a configurable policy. The policy routes each call to one of six strategies:

| Strategy | Behavior |
|----------|----------|
| **Allow** | Immediate permit. The tool executes without intervention. |
| **Deny** | Immediate block. The tool call is rejected and logged. |
| **HITL** | Human-in-the-Loop. An approval prompt appears in the chat or messaging channel. The operator has 300 seconds to approve or deny. |
| **PITL** (Experimental) | Phone-in-the-Loop. The agent calls a configured phone number for voice approval. |
| **AITL** | AI-in-the-Loop. A separate Copilot session reviews the tool call for safety. |
| **Filter** | Content analysis. Azure AI Prompt Shields scan the input; the tool proceeds if clean. |

![HITL approval in chat](https://aymenfurter.github.io/polyclaw/screenshots/web-chat-humanintheloop.png)

### Presets

You do not need to configure every tool individually. Three presets — **permissive**, **balanced**, and **restrictive** — define a `(context, risk) → strategy` matrix. The key insight: interactive and background contexts are treated differently. During interactive sessions, requiring approval is barely a burden — you are already at the keyboard. But for background tasks (scheduler, bot, realtime), waiting for approval that may never come defeats the purpose. Background presets are stricter by default, denying high-risk calls outright instead of waiting for human approval.

### Model-Aware Policies

Here is where it gets genuinely interesting. Different models have different susceptibility to adversarial behavior. Stronger models are harder to prompt-inject. And yet, most guardrail implementations treat all models the same. Why?

In Polyclaw, the effective preset shifts based on the model's trust tier:

| Model Tier | Examples | Adjustment |
|------------|----------|------------|
| Tier 1 (Strong) | `claude-opus-4.6`, `gpt-5.3-codex` | Loosened by one step |
| Tier 2 (Standard) | `claude-sonnet-4.6`, `gpt-5.2` | Preset used as-is |
| Tier 3 (Cautious) | `gpt-5-mini`, `claude-haiku-4.5` | Tightened by one step |

So if you select "balanced" and run with a Tier 1 model, the effective policy loosens to "permissive." Switch to a Tier 3 model and it tightens to "restrictive." The model's trust level automatically adjusts how much rope it gets.

![Model-level policy matrix](https://aymenfurter.github.io/polyclaw/screenshots/web-hardening-guardrails-modellevelmatrix.png)

### Phone-in-the-Loop

For the most critical operations — imagine the agent discovers a corrupted database and wants to trigger a backup restore — text-based approval might not cut it. You could be away from the dashboard. PITL calls you on the phone using Azure Communication Services and the OpenAI Realtime API. A voice prompt describes the tool call and its arguments. You approve or deny by speaking.

Still experimental, but the concept is sound: match the approval channel to the severity of the action.

## Prompt Shields

Azure AI Content Safety Prompt Shields add a content analysis layer on top of everything else. When enabled, every tool invocation matching the `filter` strategy is scanned for prompt injection attacks before execution.

Three design decisions matter here:

- **Entra ID authentication** — no API keys floating around, uses `DefaultAzureCredential`
- **Fail-closed** — if the Content Safety service is down, tools are *blocked*, not allowed. This is non-negotiable.
- **Combinable** — Prompt Shields run alongside any other strategy. When combined with HITL or AITL, the shield check runs first. Attack detected? Denied immediately, no human or AI reviewer ever sees it.

The guardrails page also includes a **red teaming** section. You can throw adversarial prompts at the agent and verify that shields and policies catch them. Test your defenses before someone else does.

![Red teaming](https://aymenfurter.github.io/polyclaw/screenshots/web-hardening-redteaming.png)

## AI-in-the-Loop

AITL takes a different approach: it spawns a *separate* Copilot session that acts as an independent safety reviewer. This second AI evaluates every flagged tool call for prompt injection, data exfiltration, destructive actions, and privilege escalation.

The clever bit is the **spotlighting** defense. Untrusted content has its whitespace replaced with `^`, marking it as external input. This prevents indirect prompt injection against the reviewer itself — tool arguments cannot trick the reviewer into approving something dangerous because they are visually and semantically marked as foreign data.

The review has a 30-second timeout. No response? Denied. Fail-closed, always.

## Tool Activity Audit Trail

Every tool call — successful, denied, or errored — is recorded in an append-only JSONL audit log. No exceptions. Each entry captures:

- Tool name, arguments, and result
- Automated risk score (0–100) with matched risk factors
- Guardrail strategy used (HITL, AITL, Filter, etc.)
- Prompt Shield outcome (clean, attack, error)
- Execution duration and session context
- Manual flagging for human review

![Tool activity inspection](https://aymenfurter.github.io/polyclaw/screenshots/web-toolactivityinspect.png)

The dashboard provides filterable views, per-session breakdowns, timeline charts, and CSV export. This is not just logging — it is a proper enterprise audit trail.

## Sandbox Execution

Even with guardrails and identity isolation, the agent still runs code on the host container by default. For workloads where that is too much exposure, Polyclaw can redirect code execution to **Azure Container Apps Dynamic Sessions** — completely isolated sandbox environments in the cloud.

![Sandbox configuration](https://aymenfurter.github.io/polyclaw/screenshots/web-infra-sandboxconfig.png)

When sandbox mode is enabled:

1. The agent's code-execution tool calls are intercepted
2. On the first call, the agent's codebase and whitelisted data files are uploaded to a remote container
3. Code runs inside the remote container — no access to Azure credentials, no access to the host filesystem
4. Results are synced back when the session is destroyed

The critical property: **Azure auth context is not propagated** to the sandbox. Even if the agent generates malicious code, it cannot touch your Azure environment. The trade-off is latency and reduced capability — sandboxed code cannot automate Azure resources directly.

## Putting It All Together

No single control is sufficient. The security model works because the layers compound:

1. **Runtime isolation** separates credentials between admin and agent
2. **Agent identity** enforces least-privilege RBAC
3. **Guardrails** intercept every tool call with configurable policies
4. **Model-aware policies** adjust autonomy based on the model's trust tier
5. **Prompt Shields** detect injection attacks at the content level
6. **AITL** provides an independent AI safety review
7. **HITL/PITL** keeps humans in the loop for high-risk operations
8. **Sandbox execution** isolates code execution from credentials
9. **Tool Activity** provides a complete audit trail for everything that happened

You dial in the combination that matches your risk appetite. A personal assistant on your home server can run permissive. An agent with access to production Azure resources should be locked down — balanced or restrictive presets, Prompt Shields on, HITL for high-risk tools.

The guardrails framework is also available as a standalone open-source project — [agent-policy-guard](https://github.com/agent-policy/guard) — usable independently of Polyclaw.

Full project on GitHub: [https://github.com/aymenfurter/polyclaw](https://github.com/aymenfurter/polyclaw)

> **Warning:** Polyclaw is an autonomous agent. It can execute code, deploy infrastructure, send messages, and make phone calls. The agent runtime is architecturally separated from the admin plane and operates under its own Azure managed identity with least-privilege RBAC. Understand the risks before running it.
