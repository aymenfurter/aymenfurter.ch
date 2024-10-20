---
title: "The Journey of Crafting an AI Chatbot"
date: 2023-08-07
draft: false
emoji: "🤖"
description: "Ever wondered how to build AI chatbots and launch new revisions of prompt templates with confidence?"
tags: ["AI", "Chatbots", "Vector Search", "Azure Cognitive Search", "RAG"]
weight: 50
link: https://www.linkedin.com/pulse/journey-crafting-ai-chatbot-aymen-furter/
---

![The Journey of Crafting an AI Chatbot](/images/crafting-ai-chatbot-header.png)

I often study a lot of material to understand the details of Azure services. Interestingly, I've found that sometimes the most insightful resources aren't always in written form. Instead, they are presented in the form of videos. These videos might be meticulously crafted by professionals pursuing it as a passion project, or they could be official recordings from industry events and meetups available on YouTube.

![AI Chatbot Concept](/images/ai-chatbot-concept.png)

So, it got me thinking - why not design a chatbot that can simplify this search process for me?

Let's delve into this concept. We imagine a chatbot designed specifically to help us find relevant YouTube videos based on our questions or interests. For this to work, the chatbot must have access to my own data. Specifically, I'd like it to utilize transcriptions from YouTube content.

## Where to Begin?

Prompts are not written in code but in natural language. This may appear advantageous. However, upon closer reflection, it's evident that it introduces a new layer of complexity. We've been developing software as code for over fifty years, and over time, we've sharped our skills in creating robust, reliable, and scalable code. This has been achieved through techniques like unit testing, continuous integration, modularization, design patterns, code reviews, and more (the list goes on). But when it comes to natural language? Regardless of the prompt we provide to a Large Language Model (LLM), we will always receive a response. There are no compile errors, no failed unit tests, no linting warnings and no static code analysis. We simply get generated text.

Our first step should always be to ensure that the LLM can carry out the desired activity. At this stage, we experiment with various prompt designs, proving that it's feasible. Often, we also want to confirm not only its feasibility but also its cost-effectiveness and acceptable user experience in terms of inference speed.

During this early experimentation stage, a recently introduced tool named [Prompt flow](https://learn.microsoft.com/en-us/azure/machine-learning/prompt-flow/overview-what-is-prompt-flow?view=azureml-api-2) proves to be useful. It is a component of the Machine Learning Studio. When we begin to construct and compare different prompts, Prompt flow can be used to create various prompt variants. Since Prompt flow supports the use of Python code snippets, we can also use orchestration libraries such as Langchain. 

### Diving Deep into Our Specific Scenario

Let's examine our scenario. We need to prove that our LLM can extract information and accurately reference it from a list of YouTube transcripts. This is a common pattern known as Retrieval Augmented Generation (RAG). Here is the prompt we will construct:

```
[...] Below are pertinent YouTube snippets along with their IDs:
Transcript from: YouTube-ID: I7fdWafTcPY Timecode: 02:00:00 Text: <transcript of this YouTube video>
Transcript from: YouTube-ID: FyY0fEO5jVY Timecode: 00:31:00 Text: <transcript of this YouTube video>
Chat history: What is the concept of grounding in chatbot design?

SINGLE RESPONE FROM BOT TO USER:
```

Now, let's visualize how this will be rendered in Prompt flow and analyze the generated results. First, we define the prompt. It's similar to the one mentioned earlier, but with sections that vary based on the data we're using replaced by placeholders. This lets us test various scenarios later on.

![Prompt Flow Visualization](/images/prompt-flow-visualization.png)

Having successfully defined our prompt variants, we can now use the LLM tool to perform inference:

![LLM Inference Results](/images/llm-inference-results.png)

When comparing the output of different variants, we find that both GPT-4 and GPT-35-Turbo produce acceptable output. This confirms that our use case is achievable with GPT-35-Turbo. If new foundation models, potentially cheaper or more powerful, are released in the future, we can revisit this flow and assess their performance.

## The Stack

OK - we've proven that, from an LLM perspective, it can be done! Now, we can think about how our co-pilot stack might look. In the example above, we provided various transcripts directly in the prompt, but keep in mind that the context size of an LLM prompt is limited. We can't feed gigabytes of text into the prompt; we need a method to choose the right sections from specific transcripts based on a given question. In other words, we need a search engine! This is often achieved using a vector database.

Next, we'll need a chat interface for our bot. This must be tailored to the audience we aim to serve. There are various options, ranging from MSTeams bots to standalone frontends. Additionally, we may require an orchestration library like Semantic Kernel or Langchain. These are essential for simplifying the creation of multiple (sometimes simultaneous) calls to the LLM. It acts as a bridge between the foundation model and the UI, handling not only the various calls to the LLM but also integrating relevant data from our vector storage/search engine.

Finally, we should consider the capabilities our chatbot should have. For instance, does the bot need to execute specific tasks on behalf of the user, such as sending an email? These functionalities are typically termed "Skills" or "Plugins". We can develop our chatbot in stages: beginning with a basic version, then integrating it with our data, and ultimately enhancing its interactivity with plugins. It's common to maintain a separate data store for additional chatbot-related data, such as user settings or chat logs.

At this stage, I began to take my project more seriously, so it needed a name. I chose the name "Upskiller." For the frontend, I decided to build a simple UI based on Angular, given my previous experience with it. For the orchestration layer, I selected Semantic Kernel (SK). SK supports various programming languages, including both Python and .NET. Recently, they introduced a Java-flavored release. What I appreciate most about Semantic Kernel is the planner component that allows chaining multiple plugin calls. I hadn't planned to use this feature at first, but I ended up leveraging it during this project (more on that later). For vector storage, I opted for [Azure Cognitive Search](https://azure.microsoft.com/en-us/products/ai-services/cognitive-search) (ACS). ACS has recently added support for [vector search](https://learn.microsoft.com/en-us/azure/search/vector-search-overview), but it's much more than just a vector store. It enables the combination of traditional field-level queries with vector search (So called "Hybrid search"). I didn't require a data store for user settings and chat history, as I wanted to keep this project simple. If I ever need to implement persistent chat sessions, I'll choose CosmosDB for that.

## The Data

Now that we've defined our stack, it's time to begin constructing our data store. The typical procedure when using a vector database is as follows:

1. Obtain the original data (for instance, a set of PDFs).
2. Chunk the data, which means dividing the data into smaller segments. The process of chunking can be intricate and is an area worth experimenting with on its own. Multiple chunking strategies exist, such as segmenting based on paragraphs or sentences, with or without overlap.
3. Convert each chunk into a vector representation using an embedding model. With OpenAI, the ada model (specifically, text-embedding-ada) is employed.
4. Store each chunk alongside the text it originated from in your vector database.
5. We can now utilize this vector database to retrieve the most relevant chunks during a chatbot interaction! This involves taking the user's search query, converting it into an embedding representation, and then pulling the "k nearest neighbors (kNN)" from our vector database.
6. Once we've identified the "k nearest neighbors" (e.g., the 5 closest segments in our vector database), we obtain the corresponding text and incorporate it into our prompt.

First, we'll need an instance of Azure Cognitive Services. Setting this up is straightforward. Any of the available SKUs support vector search. Within ACS, you can then create an index. This index should have at least the following fields:

![Azure Cognitive Services Index Fields](/images/acs-index-fields.png)

- A unique identifier.
- A text field for the content.
- A vector type field to store the vector.

You can also add other fields, such as those used for filtering or additional metadata. For details on setting up the index, refer to: [https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index](https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-create-index)

Now that our index is set up, we need a method to ingest the data. Azure Cognitive Search operates on a "bring your own embeddings" principle, which means you're required to send not just the chunked text data, but also its corresponding vectors. For a code example, take a look here: [Azure-Search-OpenAI-Demo](https://github.com/Azure-Samples/azure-search-openai-demo/blob/vectors/scripts/prepdocs.py).

Recently, Semantic Kernel added support for ACS as a memory store. It also offers tools to transform text into embeddings. More details are available at this link: [Announcing Semantic Kernel Integration with Azure Cognitive Search](https://devblogs.microsoft.com/semantic-kernel/announcing-semantic-kernel-integration-with-azure-cognitive-search/).

Alternatively, ACS offers a PowerSkill that can transform text into an embedding. You can find it here: [EmbeddingGenerator PowerSkill](https://github.com/Azure-Samples/azure-search-power-skills/tree/main/Vector/EmbeddingGenerator). PowerSkills are compact plugins designed to be activated before a new entry is persisted in the index.

While developing my chatbot, Semantic Kernel hadn't yet introduced native support for Azure Cognitive Search. Consequently, I devised my own ingestion solution. For chunking, I've opted for non-overlapping chunks, dividing the entire video transcript minute by minute. Although I'm not convinced this is the optimal approach, I've been quite satisfied with the chatbot's performance. I might consider revising this methodology in the future.

## Perfecting the Prompt With Prompt Flow

Awesome! We've set up our data store! At that moment, I became excited. After all, with a functional prompt and our data in place, connecting everything should be straightforward, right? I began constructing the chatbot, deployed it, and shared it with friends and colleagues. To my surprise, it began to hallucinate. I hadn't considered every possible scenario. When asked some questions, the chatbot did not always use the information provided from transcripts. Instead, it either made up answers or used what it already knew. To address the hallucinations, I thought a simple fix would be to add grounding instructions to the prompt. After refining the prompt and redeploying my bot, it began to respond with "I don't know" when uncertain. Success? Not so fast!

![Chatbot Hallucination Example](/images/chatbot-hallucination.png)

A new issue arose: it now often defaulted to saying "I don't know", even in use cases where it previously provided good answers. It now only responded when absolutely certain. This goes to show, there may be situations where a bot can be too grounded!

This leads to the question: how can we modify our prompts without inadvertently introducing new issues? Prompt flow to the rescue! A recently introduced feature allows not only LLM calls but also connections to vector stores. Moreover, it supports what's known as "batch testing".

A great way to dive in this pattern is by using the Bring Your Own Data QnA template available in the gallery. While this example assumes we are using the "Vector index" feature, it's not necessary if we already possess an existing ACS index. We can integrate our existing vector store using the "Vector DB lookup" tool. With this tool, we can link to the vector store that we'll later employ in our actual chatbot. This lets us use Prompt flow for both crafting initial prompts and testing various scenarios with our data. 

![Prompt Flow Vector DB Lookup](/images/prompt-flow-vector-db.png)

If we select the "Bulk test" option within a flow, we can upload our own CSV file containing multiple questions. For example, we might have a list of 20 essential questions we aim for our bot to address. Before rolling out updated prompts, inference models, or data stores, Prompt flow can be used to ensure there's no dip in performance for these critical scenarios. 

But how can we determine the quality of the response? How can we evaluate its effectiveness? One method is to review all the responses and check, for example, if there are any inaccuracies or "hallucinations". However, why do this manually when a Large Language Model (LLM) can do the evaluation? This is where [evaluation flows](https://learn.microsoft.com/en-us/azure/machine-learning/prompt-flow/how-to-develop-an-evaluation-flow?view=azureml-api-2) come in. They enable us to assess the quality of our output.

![Prompt Flow Evaluation](/images/prompt-flow-evaluation.png)

A typical use case, for which an example can be found in the gallery, involves using the response from a conversation, possibly generated by a quicker, more affordable model like GPT-35-Turbo, and then rating it with a more advanced model, such as GPT-4. This is especially useful when we might be hesitant to use GPT-4 regularly due to its costs. Yet, we can still utilize it to gauge how effective our responses are and determine if they are well-grounded.

This is precisely why "prompt flow" is revolutionary for prompt engineering. It empowers us to launch new versions of our bot with confidence!

## The Code

And how can we efficiently create a copilot? Should we begin from the very beginning? I'd suggest not. Instead, let us take advantage of the various sample implementations and solution accelerators that Microsoft provides and continually updates. These examples are specifically designed to help us get started more rapidly. They present an opinionated approach to give us an idea of what a copilot might look like.

Here are a couple of my top picks:

![ChatGPT + Enterprise Data with Azure OpenAI](/images/chatgpt-enterprise-data.png)

- ChatGPT + Enterprise Data with Azure OpenAI: [Link](https://github.com/Azure-Samples/azure-search-openai-demo) - This is a straightforward example of how to set up a RAG-style conversational bot. It's the perfect option if our team has expertise in Python and wants a solution for reasoning over a collection of documents or PDF files.

![Copilot Chat with Semantic Kernel](/images/copilot-chat-semantic-kernel.png)

- Copilot Chat with Semantic Kernel: [Link](https://github.com/microsoft/chat-copilot) - Consider this the gold standard of sample implementations. It demonstrates a variety of functionalities and patterns using the semantic kernel. Features include intent recognition, sustained chat history, and memory using a vector database, among others.

For my use case, I selected the Chat Copilot Sample Application by Semantic Kernel as a foundation. It's like an all-inclusive kit. I sift through it all, taking what fits best for my needs. It does cater to most requirements a copilot-style chatbot might need. As for the frontend, I opted to craft my own, as the sample's appearance wasn't quite to my taste.

A crucial component when developing a chat experience is the "main conversation orchestration flow" (you can also explore the full code [here](https://github.com/aymenfurter/upskiller/blob/main/webapi/CopilotChat/Skills/ChatSkills/ChatSkill.cs#L139)):

```csharp
var userIntent = await this.GetUserIntentAsync(chatContext);
if (chatContext.ErrorOccurred)
{
    return string.Empty;
}

var remainingToken = this.GetChatContextTokenLimit(userIntent);
var youTubeTransscriptContextTokenLimit = (int)(remainingToken * this._promptOptions.DocumentContextWeight);
var youTubeMemories = await this.QueryTranscriptsAsync(chatContext, userIntent, youTubeTransscriptContextTokenLimit);
if (chatContext.ErrorOccurred)
{
    return string.Empty;
}

// Fill in chat history
var chatContextComponents = new List<string>() { youTubeMemories };
var chatContextText = string.Join("\n\n", chatContextComponents.Where(c => !string.IsNullOrEmpty(c)));
var chatContextTextTokenCount = remainingToken - Utilities.TokenCount(chatContextText);
if (chatContextTextTokenCount > 0)
{
    var chatHistory = await this.GetChatHistoryAsync(chatContext, chatContextTextTokenCount);
    if (chatContext.ErrorOccurred)
    {
        return string.Empty;
    }
    chatContextText = $"{chatContextText}\n{chatHistory}";
}

// Invoke the model
chatContext.Variables.Set("UserIntent", userIntent);
chatContext.Variables.Set("ChatContext", chatContextText);

var promptRenderer = new PromptTemplateEngine();
var renderedPrompt = await promptRenderer.RenderAsync(
    this._promptOptions.SystemChatPrompt,
    chatContext);

var completionFunction = this._kernel.CreateSemanticFunction(
    renderedPrompt,
    skillName: nameof(ChatSkill),
    description: "Complete the prompt.");

chatContext = await completionFunction.InvokeAsync(
    context: chatContext,
    settings: this.CreateChatResponseCompletionSettings());
```

This is the essence of the orchestration. Here, we craft the prompt, incorporating context from the transcript, as well as the user's detected intent and the ongoing chat history. 

Interestingly, I managed to leverage the Semantic Kernel's planner capabilities:

```csharp
var actionPlanner = new SequentialPlanner(this._plannerKernel);
var ask = "Given the following statement by a chatbot, use youtube skill to generate most relevant youtube links:" + chatContext.Result;
var plan = await actionPlanner.CreatePlanAsync(ask);
var result = await plan.InvokeAsync();
```

When generating a response using the LLM, I directed the bot to reference relevant YouTube video IDs and timestamps. I intended to display these YouTube links beneath a given response, if any were relevant. For this purpose, I employed a planner. In essence, we make an extra call, directing the LLM to extract all mentioned YouTube links and populate a separate response variable. This planner interfaces with the YouTubePlugin, which can translate YouTube IDs and timestamps into embed codes:

```csharp
using Microsoft.SemanticKernel.SkillDefinition;
using Microsoft.SemanticKernel.Orchestration;
using System.Linq;

namespace CopilotChat.Skills.YouTube
{
    public class YouTubePlugin 
    {
        [SKFunction("Used if you want to link to a specific YouTube Video. Only use this skill if you already know what the youtubeid is (e.g. QH2-TGUlwu4))")]
        [SKFunctionContextParameter(Name = "youtubeid", Description = "ID of the YouTube video")]
        [SKFunctionContextParameter(Name = "timestamp", Description = "Timestamp to jump to (e.g. 00:01:00)")]
        public string LinkYouTubeVideo(SKContext context)
        {
            string youtubeid = context["youtubeid"];
            string timestamp = context["timestamp"];

            // if support is 00:02, make it to 00:00:02
            if (timestamp.Count(c => c == ':') == 1)
            {
                timestamp = "00:" + timestamp;
            }

            if (string.IsNullOrEmpty(timestamp))
            {
                return $"https://www.youtube.com/embed/{youtubeid}";
            }
            var timeParts = timestamp.Split(':').Select(int.Parse).ToArray();
             int totalSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
            return $"https://www.youtube.com/embed/{youtubeid}?start={totalSeconds}";
        }
    }
}
```

The respective component can be accessed [here](https://github.com/aymenfurter/upskiller/blob/main/webapi/CopilotChat/Skills/YouTube/YouTubePlugin.cs).

## The Infrastructure

Now that we have both the frontend and backend components of our copilot, we need a way to run them. Depending on our specific needs, we might consider containerized options. If our team already has expertise in Kubernetes, it would be practical to utilize the [Azure Kubernetes Service](https://azure.microsoft.com/en-us/products/kubernetes-service), especially if we have an existing setup. I personally chose to deploy my application on [Azure Container Apps](https://azure.microsoft.com/en-us/products/container-apps). The [deployment script](https://github.com/aymenfurter/upskiller/blob/main/.github/workflows/deploy.yml) is simple: 

```yaml
az config set extension.use_dynamic_install=yes_without_prompt
az containerapp env create --name ${{ env.ENV_NAME }} --resource-group ${{ env.RESOURCE_GROUP }}
az containerapp create\
            --resource-group ${{ env.RESOURCE_GROUP }}\
            --name ${{ env.CHAT_APP_NAME }}\
            --image ghcr.io/aymenfurter/upskiller/chat:6a3aba105fc6598da3e1e2b6d22082d5ee196f55\
            --environment ${{ env.ENV_NAME }}\
            --ingress external\
            --secrets acskey="${{ secrets.ACS_KEY }}"\
              acsinstance="${{ secrets.ACS_INSTANCE }}"\
              openaikey="${{ secrets.OPEN_AI_KEY }}"\
            --env-vars ACS_KEY=secretref:acskey\
              ACS_INSTANCE=secretref:acsinstance\
              OPEN_AI_KEY=secretref:openaikey\
            --target-port 5000
az containerapp create\
            --resource-group ${{ env.RESOURCE_GROUP }}\
            --environment ${{ env.ENV_NAME }}\
            --name ${{ env.WEBUI_APP_NAME }}\
            --ingress external\
            --image ghcr.io/aymenfurter/upskiller/webui:6a3aba105fc6598da3e1e2b6d22082d5ee196f55\
            --target-port 80
```

One of the benefits of Azure Container Apps is its ability to scale down to zero, meaning we only pay when our container is active and handling traffic. If we are planning a gradual scale-up, accommodating more users over time, this can be a cost-effective solution. Plus, since it's based on open-source technology, we can easily transition to a full-scale Kubernetes cluster like AKS if we ever need to.

Regarding the LLM aspect, we'll need to deploy an [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service) instance. This service provides both AD-based authentication and API-key authentication. The API-key method is great for simple use cases. For more advanced scenarios, it's worth exploring [securing an OpenAI Service through managed identities](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/managed-identity). There's a specific role - the Azure OpenAI User role - which is designed exclusively for inference.

## Conclusion

Creating a copilot-style chatbot is not just about engineering its responses and interactions to ensure maximum effectiveness and relevancy. With tools like Azure Cognitive Search, Semantic Kernel, and Prompt flow, developers have an armory of capabilities to refine and perfect the bot's performance. Using sample implementations like the Copilot Chat can accelerate the development process and ensure a seamless chatbot experience. Whether it's refining prompts, deploying effectively, or making sure the chatbot is grounded in its responses, having the right toolset is essential for success.

Here is an example interaction with the "Upskiller" chatbot:

![Upskiller Chatbot Interaction](/images/upskiller-chatbot-interaction.png)

The source code is of course available on [GitHub](https://github.com/aymenfurter/upskiller).