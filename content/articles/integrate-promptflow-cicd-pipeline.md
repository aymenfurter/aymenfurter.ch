---
title: "Integrate PromptFlow into a CI/CD pipeline (On-Agent)"
date: 2023-12-30
draft: false
emoji: "🔄"
description: "Exploring how to leverage PromptFlow for improving and evaluating prompts, and integrating it natively into the CI/CD cycle of application development."
tags: ["Automation", "AI", "Development"]
weight: 40
link: https://www.linkedin.com/pulse/integrate-promptflow-acicd-pipeline-on-agent-aymen-furter-hl59e
---

![Integrate PromptFlow into a CI/CD pipeline (On-Agent)](/images/promptflow-cicd-header.png)

With the ongoing updates in Large Language Models (LLMs) and their orchestration libraries, it is important to recognize and prepare for potential changes that may arise when upgrading to newer releases. These changes can manifest in two key areas: first, updating to a newer version of a library might alter how the AI app functions or handles prompts; second, newer versions of large language models themselves may respond differently to the same prompts, leading to variations in outputs. 

I recently explored leveraging [PromptFlow](https://github.com/microsoft/promptflow) not only for improving and evaluating prompts but also for integrating it natively into the CI/CD cycle of application development. The remarkable thing about [PromptFlow](https://github.com/microsoft/promptflow) is that it's not only a managed service you can run within your Azure AI Studio instance, but also has a CLI version ([https://github.com/microsoft/promptflow](https://github.com/microsoft/promptflow)) and a VSCode extension. With the CLI version, you can run a flow on your own Azure DevOps build agent. Moreover, since we can call other Python code through a custom tool within a flow, we can directly execute Python code fragments within our flows. This is incredibly powerful and allows us to gradually add evaluation flows to an existing AI app.

Here's an example of how such a CI/CD pipeline looks in Azure DevOps:

```yaml
stages:
- stage: promptflow
  displayName: 'promptflow'
  jobs:
  - job: PromptflowEvals
    displayName: 'run promptflow evals'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    [...]
    - script: |
        pf run create --file run.yml --stream --name run
        pf run create --file eval.yml --run run --stream --name eval
      displayName: 'Run PromptFlow evals'
    [...]
    - script: |
        pf run visualize --name eval
         mv /tmp/*.html $(Build.ArtifactStagingDirectory)/
      displayName: 'Generate Visualizations'
```

(You can find the complete example on [GitHub](https://github.com/aymenfurter/promptflow-local-cicd/blob/main/azure-pipelines.yaml))

We trigger a batch run by using pf run create. Batch runs enable testing across various scenarios. This way, we can deploy an updated version with confidence.

Upon completion of the [PromptFlow](https://github.com/microsoft/promptflow) runs, visualizations (i.e., reports) are produced. These reports can include various metrics such as the "groundedness" (i.e. if there were any hallucinations) of the produced output in relation to the context. There are many more types of [built-in metrics](https://learn.microsoft.com/en-us/azure/machine-learning/prompt-flow/how-to-bulk-test-evaluate-flow?view=azureml-api-2#understand-the-built-in-evaluation-metrics). And of course, we can also build our own metrics. For instance, a custom evaluation metric I constructed previously assesses whether the response contains proper citations. Once the tests have been completed, the report can be downloaded in HTML format as an artifact:

![PromptFlow Evaluation Report](/images/promptflow-evaluation-report.png)

The full code is available [on GitHub.](https://github.com/aymenfurter/promptflow-local-cicd)

This sample demonstrates adding PromptFlow evaluations in existing Python applications, including LangChain and others like Semantic Kernel's Python version. It's ideal for smaller applications with an established deployment setup, looking to use PromptFlow solely for evaluation purposes. If you are looking for an end-to-end solution using PromptFlow, I recommend exploring the [LLMOps template repository on GitHub.](https://github.com/microsoft/llmops-promptflow-template/)