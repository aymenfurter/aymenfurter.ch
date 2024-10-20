---
title: "Integrating AI-Powered Coding Assistance into Your Custom Web IDE"
date: 2024-04-10
draft: false
emoji: "💻"
description: "Exploring ways to incorporate Generative AI capabilities into Monaco-based Web IDEs for enhanced coding experiences."
tags: ["AI", "Web IDE", "Monaco", "Coding Assistance", "Azure OpenAI"]
weight: 20
link: https://www.linkedin.com/pulse/integrating-ai-powered-coding-assistance-your-custom-web-aymen-furter-pahce/
---

![Integrating AI-Powered Coding Assistance into Your Custom Web IDE](/images/ai-powered-coding-assistance.png)

Over the past few weeks, it has been my privilege to collaborate with my distinguished colleagues, [Damiano Curia](https://ch.linkedin.com/in/damianocuria), [Carlos Garcia Lalicata](https://ch.linkedin.com/in/carlosgarcialalicata), [Francesco Rinaldi](https://ch.linkedin.com/in/frarin), [Rolf Egli](https://ch.linkedin.com/in/rolf-egli-32251513a) and [Yasmin Sarbaoui](https://ch.linkedin.com/in/yasmin-sarbaoui), on investigating ways to incorporate Generative AI capabilities into Monaco-based Web IDEs.

Before diving deeper into our project, I want to pause and reflect on the tools that we used to build it. If you asked me what my favorite coding tool is, I'd say [VSCode](https://code.visualstudio.com/) without hesitation. And my favorite extension? That'd be [GitHub Copilot](https://github.com/features/copilot), closely followed by [VSCodeVim](https://github.com/VSCodeVim/Vim). I estimate that 80% of my code is written with the help of GitHub Copilot. It's like it's right at home with me, living directly in my code editor and offering me multiple lines of code suggestions as I type. I can even tailor its behavior further by being more specific with my requests to my AI coding companion, instructing it directly in my code through specific comments. Using Copilot's chat experience lets me ask questions about the code I'm writing, keeping me in the coding flow and focused.

Understanding this is key: not all development occurs within VSCode. Not every developer works on a giant codebase, building the next twelve-factor app. Some developers, doing work that's just as important, operate on code snippets, perhaps within a browser. This is common for low-code platforms or Integration-Platform-as-a-Service (iPaaS) apps that allow incorporating small code snippets into their applications. 

These types of apps often use an in-browser code editor like [Monaco](https://github.com/microsoft/monaco-editor) (the open-source project behind VSCode). With Monaco, it's possible to get the coding experience you're familiar with from VSCode and GitHub Codespaces directly in your browser. 

But how can you integrate AI code assistants into such an environment? There are two options:

1. The first option is to bring the low-code editor experience to VSCode. This can be achieved by developing your own VSCode extension, which integrates with your low-code solution through your API. This way, you can use both VSCode and the browser experience to build your code. When using VSCode, developers have access to GitHub Copilot.

2. The alternative is to bring the AI-assisted coding experience into your browser. This approach can work as long as the requirements for building context are not too complex. Usually in such web-editors, we have a small code snippet that implements part of the logic that cannot be achieved through the UI alone. So, the context is relatively small, making a custom AI assistant feasible.

But how are we building it? We'll use familiar tools: Azure OpenAI Service (GPT-4) for AI capabilities and Monaco for the code editor. In a production setting, we might add more components, like Azure AI Search, to enable dynamic few-shot prompting. We would probably also consider moving part of the completion logic to the server side, perhaps running it within an Azure Function for efficiency and scalability. But let's start with the basics. For demonstration purposes, we'll begin by directly integrating Azure OpenAI with a Monaco-based code editor. I want to introduce you to a sample project called [custom-monaco-copilot-demo](https://github.com/microsoft/custom-monaco-copilot-demo). This demo is a small web application that features a code editor using Monaco. Here, I chose the task of writing policy code for Azure API Management as the coding domain. The primary goal isn't necessarily to provide a productive, fully functional APIM Policy editor but to showcase a method of implementing such an AI code assistant.

First, let's examine code completions. What makes a prompt effective in generating a useful code suggestion? (abridged):

```
Generate code suggestion for the following prompt in the context of the provided code snippet:

Language: XML (Azure API Management policy code)
Prompt: ${prompt}
Context: ${context}
Surrounding Code: ${surroundingCode}
Previous Line: ${previousLine}
Next Line: ${nextLine}

Considerations:
- Only reply with the code snippet, no explanations.
- Only generate code that can be inserted as-is.
- Don't generate any surrounding code.
- Ensure the generated code is syntactically correct.
- Use appropriate variable names, function names.
- Consider the context and purpose of the code snippet to provide meaningful suggestions.
- If the text under the cursor corresponds to the beginning of your suggestion, please provide only the remaining part of the suggestion.
```

But how do we initiate AI code generation? It's straightforward. We utilize the built-in code suggestion feature of Monaco.

```javascript
this.completionItemProvider = monaco.languages.registerCompletionItemProvider('xml', {
  provideCompletionItems: (model, position) => this.provideCompletionItems(model, position),
});
```

Code suggestions can significantly boost productivity, but imagine incorporating a chat feature for Q&A-style conversations directly related to the current code you're working on. The concept is straightforward. For the system prompt we're adding:

```
system:
You are an AI assistant that helps with coding and Azure API Management policy development. Provide helpful suggestions and answers based on the code context and user messages.

user:
Here's the current code:
${currentCode}

User message: ${message}
```

Implementing a chat experience like this, we should enable streaming, if possible. This allows for a more familiar chat experience where people can follow along as the text is being generated.

I hope you found this write-up useful and that you might be able to reuse some of the code to bring GenAI capabilities to your own Monaco coding experience. 

Again, the repository is available on GitHub: [https://github.com/microsoft/custom-monaco-copilot-demo](https://github.com/microsoft/custom-monaco-copilot-demo)