---
title: "Relevance and Recency in AI Apps"
date: 2023-10-08
draft: true 
emoji: "🕰️"
description: "Exploring the challenges and solutions for balancing relevance and recency in AI-powered chatbots and search systems."
tags: ["AI", "Chatbots", "Vector Search", "Azure Cognitive Search", "RAG"]
weight: 50
link: https://www.linkedin.com/pulse/relevance-recency-ai-apps-aymen-furter/
---

![Relevance and Recency in AI Apps](/images/relevance-recency-header.jpeg)

In [past articles](https://www.linkedin.com/pulse/journey-crafting-ai-chatbot-aymen-furter/), I talked about making a chatbot called "Upskiller" that uses the vast information from YouTube videos about Azure. While it effectively handles specific queries such as "How can I integrate an Azure Function into a Virtual Network?", it struggles with time-sensitive queries like "What's new on Azure Functions?"

![Upskiller Chatbot Example](/images/upskiller-chatbot-example.png)

### But why is that? 🤔

The answer has two parts. Firstly, the model isn't aware of the current time. Keep in mind, when we use the RAG Pattern (Retrieval Augmented Generation), we're adding relevant context to the prompt. Even if we provide the correct context (like including up-to-date and relevant data), the model might not recognize that the data is recent because it's unaware of the present time. This issue can be resolved by adding the current date and time to the prompt. In Semantic Kernel, this can be done with the built-in TimeSkill.

The second part is more complex. Since "Upskiller" uses pure vector search, all we consider for the query is how relevant the data is, not how recent. If we were to create a visual representation, it might appear as follows:

![Vector Search Visualization](/images/vector-search-visualization.png)

What we're primarily concerned with is semantic relevance. Whether the data is recent (shown as magenta in the image) or not isn't considered. There might be data points much more recent and slightly less semantic relevant that are therefore not included in the prompt.

### But how can we fix it?

Firstly, not every question seeks recent information. Often, when we query a chatbot, we're primarily looking for the most relevant details. However, there are times when both relevance and timeliness matter. So, our initial task is to distinguish between these scenarios. One method to achieve this is through an extra inference call to the LLM. In Semantic Kernel, we can create a new skill that can distinguish based on the user's intention. Let's examine the prompt:

```
Analyze the following query and return with one of the following options:

NONE = User is not interested in a specific timespan or recency.
RECENT = User is interested in recent information
MONTH = User is interested in information from the past month.
YEAR = User is interested in information from the past year.

Current Date: {{$date}}
Query: {{$query}}

Output:
```

For this Skill, [we can configure](https://github.com/aymenfurter/upskiller/blob/main/webapi/TranscriptCopilot/Skills/SortSkill/Sort/config.json) maxTokens=2 (since all 4 options: NONE, RECENT, MONTHLY, and YEAR have exactly 2 tokens). This is a relatively fast inference call, so the performance impact isn't too significant (though there's still a slight performance hit). For queries like "How can I integrate an Azure Function into a Virtual Network?", the prompt will respond with "NONE", allowing us to proceed with the usual logic (using the standard Vector search). 

But for queries that ask about recent information, we need a new query technique! 

### Time-framed vector search

Here's an approach that suited my needs well:

Initially, we'll boost the number of results returned by the vector search (top-k). For my rather small use case, raising it to 150 was effective (given I have around ~50k vectors indexed). The higher we raise this number, the more emphasis we place on timeliness. Additionally, we'll apply a filter based on the previously identified filter option. For instance, I set a filter to only consider entries from the past 2 weeks if the option is set to "RECENT". 

![1](/images/1.png)

With Azure Cognitive Search, this is straightforward because you can perform both vector search and filters in a single query execution (See [full example on GitHub](https://github.com/aymenfurter/azure-transcript-search-openai-demo/blob/main/webapi/Connectors/AzureSearchMemoryClient.cs#L53)):

```csharp
var options = new SearchOptions
{
    Vector = vector,
    Filter = $"CreatedAt ge {recent:o}";
    Size = 150;
};

searchResult = await client
        .SearchAsync<AzureSearchMemoryRecord>(query, options, cancellationToken: cancellationToken)
        .ConfigureAwait(false);
```

Finally, for our LLM inference call, we'll incorporate the ten newest entries out of the 150 returned (on the backend side). 

There you have it! Now, when we ask questions like "What's new on Azure Functions?", we receive much better answers!

![2](/images/2.png)

You can try it out using my sample repository. All the code can be found in my video transcript search project on GitHub titled: [Sample ChatGPT-style Q&A app via RAG-pattern on Video transcripts](https://github.com/aymenfurter/azure-transcript-search-openai-demo). If you'd like to run it on your own, you can easily deploy this sample using just one 'azd up' command! 😎