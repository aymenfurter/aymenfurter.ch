---
title: "Chat with Your Photos: Revolutionizing Asset Cataloging with GPT-4 Vision"
date: 2024-02-18
draft: false
emoji: "🖼️"
description: "Exploring how GPT-4 Vision can transform untagged image repositories into interactive, searchable databases."
tags: ["AI", "Azure", "Development"]
weight: 30
link: https://www.linkedin.com/pulse/chat-your-photos-revolutionizing-asset-cataloging-gpt-4-aymen-furter-inyle/
---

![Chat with Your Photos: Revolutionizing Asset Cataloging with GPT-4 Vision](/images/chat-with-photos.png)

In the digital era, extensive libraries of images have become ubiquitous across multiple industries, such as e-commerce, education, marketing, and online media. Often, these valuable image databases lack comprehensive tagging and captions, making pinpointing the desired assets a cumbersome task. Enter GPT-4 Vision, which stands to revolutionize how we interact with untagged image repositories. This article explores how GPT-4 Vision can transform these collections into interactive, searchable databases, allowing users to engage in a chat with your photos experience.

## Architectural Blueprint

The process begins with indexing the images using GPT-4 Vision to generate descriptive captions and tags. These captions are then converted into embeddings using OpenAI's text-embedding-ada-002 model, followed by indexing the data in Azure AI Search. After indexing, the image captions can be integrated into an interactive chat experience by incorporating the relevant text descriptions into the context of the LLM.

### Building Blocks

- Azure AI Search: Powers the search functionality
- GPT-4 Vision: Provides the vision capabilities.
- GPT-4-Turbo: for text inference. 
- Semantic Kernel: LLM orchestration, including backend logic and prompt handling.

### Image Indexing

The process begins with image indexing, which is made simple with the following sample code:

```python
def process_image(image_path):
    base64_image = encode_image_to_base64(image_path)
    response = openai.ChatCompletion.create(
        engine="gpt-4",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Describe the image in as much detail as possible. 200 words or more. At the end of the text, add comma separated tags for better search results.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                        },
                    }
                ],
            }
        ],
        max_tokens=300,
    )

    return response.choices[0].message.content
```

This code requests [GPT-4 Vision](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/gpt-with-vision?tabs=rest) to generate detailed captions, including tags, unlocking searchability in Azure AI Search. 

### Querying Images

The querying process is facilitated by the LLM orchestration layer (Semantic Kernel), utilizing Azure AI Search's [Hybrid search](https://learn.microsoft.com/en-us/azure/search/hybrid-search-how-to-query), which combines vector search with traditional keyword-based search, thereby improving the relevance of search results. Here's an example of how a search query might be configured:

```csharp
var options = new SearchOptions
{
    Size = 10,
    QueryType = SearchQueryType.Semantic,
    SemanticSearch = new SemanticSearchOptions
    {
        SemanticConfigurationName = "standard",
        QueryCaption = new(QueryCaptionType.Extractive),
        QueryAnswer = new(QueryAnswerType.Extractive)
    },
    Select = { "Text", "Description", "ExternalSourceName", "Id", "File" }
};

options.VectorSearch = new VectorSearchOptions()
{
    Queries = { new VectorizedQuery(queryEmbeddings.ToArray()) { KNearestNeighborsCount = 10, Fields = { "Vector" } } }
};

searchResult = await client.SearchAsync<AISearchMemoryRecord>(query, options, cancellationToken: cancellationToken);
```

This configuration retrieves the top ten most relevant entries. Additionally, [Semantic ranking](https://learn.microsoft.com/en-us/azure/search/semantic-search-overview) is configured to further improve the relevancy of the search results.

## Conclusion

By harnessing the power of GPT-4 Vision and integrating it with Azure AI Search and OpenAI's Ada model, we pave the way for a novel chat with your photos experience. This solution not only enhances the accessibility of image databases but also introduces a new paradigm in data interaction, where users can effortlessly navigate and discover images through conversational AI.

If you're curious, you can try this out with your own images. You can find the steps and more details over on the GitHub repository: [azure-chat-with-your-photos-demo](https://github.com/microsoft/azure-chat-with-your-photos-demo).