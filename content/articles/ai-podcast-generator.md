---
title: "Building an Interactive Text-to-Podcast Experience with GPT-4o Real Time API"
date: 2024-10-19
draft: false
emoji: "🎙️"
description: "Exploring the creation of an AI-powered, real-time interactive podcast generator using OpenAI's Real-Time Voice API and Azure services."
tags: ["AI", "Azure", "Experimentation"]
weight: 10
link: https://www.linkedin.com/pulse/building-interactive-text-to-podcast-experience-gpt-4o-aymen-furter
---

![Building an Interactive Text-to-Podcast Experience with GPT-4o Real Time API](/images/article-cover.png)

Before diving into the article, there's also a podcast version available! 😉

[🔊 Listen to the Podcast](https://soundcloud.com/aymen-furter/ai-generated-podcast-demo-1)

We've all been there --- you have an article or a training you want to dive into, but your day is packed, and you just can't seem to fit it in. Much of the content we consume daily is only available in one format. It might be a YouTube video, an article, or a podcast. However, the form of content often depends more on the author's preference than on the nature of the topic itself. But wouldn't it be convenient if you could switch between formats as needed, so that article you've been wanting to read could turn into something you can listen to while doing the dishes?

This is where AI steps in. A popular example is the recent surge of Text-to-Podcast AI generators. Users can simply paste a link or text into these tools, and they generate an audio podcast version in return. There are several websites offering this kind of service, and I absolutely love this type of AI use case. Whenever AI adapts to fit seamlessly into our lives, rather than forcing us to adapt to it, that's a win.

Inspired by this, I decided to explore building my own version of a real-time, interactive podcast generator. One of the key advantages of a live podcast is the potential for interactivity. Listeners can ask questions or request more in-depth discussions through a chat interface. This functionality was something I was determined to incorporate into my app, so that the "audience" (you!) could interact directly with the podcast and steer the conversation toward specific points of interest. (The soundcloud demo above actually illustrates this with the 'audience question' featured midway through the podcast.)

## Act 1: The Podcast Outline

Before diving into the technical aspects of building voice output, it's crucial to first create a strong outline for the podcast. I found success by breaking this process down into several steps. The first step is generating a comprehensive summary of the content using GPT-4o, the standard text-based ChatCompletion API. Then, using a method called the "chain of density" technique, we refine this summary by iteratively asking the Large Language Model to condense it further without losing any key information. 

Once we've distilled the summary into a clear and concise form, we can move on to creating an outline --- or, more precisely, a set of "talking points" to guide the podcast. This step is critical for ensuring a smooth and engaging flow in the conversation, as it helps structure the content in a way that keeps the listener engaged. 

For example, here's the final outline generated from the very article you're reading now:

```python
### Main Topics

1. **The Challenge of Consuming Diverse Content**
   - The need for time-efficient methods to consume information
   - Examples of situations where multitasking (like doing dishes) is ideal for audio content

2. **Creating a Real-Time Podcast Generator with OpenAI's Real-Time Voice API**
   - Step-by-step process overview:
     - Summarizing content to create a script
     - Outlining the main points for the audio version
     - Setting up Websockets for real-time data transfer
     - Techniques to maintain listener engagement throughout the AI-generated audio
   - Practical tips and challenges encountered during the setup process

3. **Future Enhancements and Advanced Uses of AI Audio**
   - Potential improvements in AI Text-to-Podcast technology
   - Advanced applications beyond basic content conversion, such as personalized audio newsletters and interactive voice responses
```

## Act 2: Your virtual podcast hosts

Now that we have the content for the podcast, the challenge is how to turn it into an engaging experience. The solution lies in using OpenAI's Real-Time Voice API, which enables real-time voice capabilities. Instead of simply relying on traditional text-to-speech (TTS) systems, we provide the API with the podcast outline and allow the AI to "speak freely." 

### Introduction to OpenAI's Real-Time Voice API

OpenAI's [Real-Time API](https://openai.com/index/introducing-the-realtime-api/) is available via [Azure's OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-quickstart) (currently in East US 2 and Sweden Central). This API allows developers to create real-time voice applications by leveraging Websockets, which support both text and voice modalities. Unlike the existing HTTP-based APIs, this method communicates using events. You can read more about event-based communication [here](https://platform.openai.com/docs/guides/realtime/events).

### Setting Up the Podcast Interaction

The process begins by establishing a Websocket connection, which enables real-time communication between the server and client. Once the connection is set up, the next step is to configure the session. This involves specifying the voice settings (i.e. what voice to use for the audio output), providing a set of instructions, and including both the podcast outline, original content and the current transcript. Below is an example of how this is implemented:

```python
ws.send_json({
     "type": "session.update",
     "session": { "modalities": ["text", "audio"],
     "instructions": ( f"You are {speaker}. {context}. Respond in 1-2 sentences at a time. " f"Continue the conversation from where it left off:\n" f"{combined_transcript}\n\n{speaker}: <your new message>" ),
     "voice": voice, "input_audio_format": "pcm16",
     "output_audio_format": "pcm16",
     "turn_detection": None,
     "temperature": 0.6, }
})
```

How can we ensure that the AI podcast hosts stay on topic? A useful approach is to differentiate between the roles of host and the guest. The host is responsible for asking questions and making sure the topics provided in the podcast outline are covered. Meanwhile, the guest focuses on answering the questions and serves as the subject matter expert. 

The AI sometimes generates responses for multiple speakers, slightly altering the voices, and occasionally repeats itself. By clearly specifying where the AI should pick up the conversation and defining the conversation boundaries in the instructions parameter, these issues can be minimized. While this approach helps, it doesn't completely eliminate the problem.

### Managing the Conversation

Once the session is set up, we generate both the voice and text output of the next turn. The text output will be added to the ongoing transcript of the conversation.

```python
await ws.send_json({
     "type": "response.create",
     "response": { "modalities": ["audio", "text"],
     "voice": voice, "output_audio_format":
     "pcm16",
     "temperature": 0.6, }
})
```

### Handling the Response

After sending the request, the AI generates the response in the form of an event. For the audio, the response is received as response.audio.delta --- which contains the audio bytes. The text response is captured in response.audio_transcript.done, which is the transcript of the generated audio.

In this approach, we do not transfer actual audio bytes for processing. The audio is simply used for local playback, simplifying the API interaction. Instead of maintaining a session across multiple interactions, we create a new session for each turn and provide the ongoing transcript to ensure context continuity.

### Looking to Future Enhancements

OpenAI has introduced an [audio generation](https://platform.openai.com/docs/guides/audio) feature in their Chat Completion API. Although it's not yet available on Azure, adopting it once it becomes accessible would make the implementation more elegant.

## Act 3: Presentation

Finally, we need a way to present the conversation and enable the user to interact with the podcast team. How do we achieve that? By dynamically modifying the podcast transcription and injecting "audience questions" whenever a user submits one. This allows the podcast to remain interactive and responsive to audience input in real time.

For the presentation, I've created a simple javascript-based web app that first lets the user specify the content of the podcast: 

![User input for podcast content](/images/user-input.png)

Once the outline has been generated, the playback begins. After each segment of the conversation, the next segment is requested through the REST API. This process ensures smooth, continuous playback that simulates a real, ongoing conversation: 

![Podcast playback interface](/images/playback-interface.png)

If you're interested and would like to explore more examples, check out the links below:

1) [PerksPlus Program](https://soundcloud.com/aymen-furter/ai-generated-podcast-demo-3?si=46b987ead9a541e5b2fad714807fde30&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing) ([Source Content](https://github.com/Azure-Samples/chat-with-your-data-solution-accelerator/blob/main/data/PerksPlus.pdf))

2) [Salad Theory](https://soundcloud.com/aymen-furter/ai-podcast-generator-demo?si=486524b77f77444d8ef402b13c1c0827&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing) ([Source Content](https://saladtheory.github.io/))

I hope you enjoyed this exploration into OpenAI's Real-Time API. Feel free to experiment with the demo app yourself. All you need is Python installed, and an Azure OpenAI Service endpoint deployed with a GPT-4o Real-Time deployment.

The project is available on GitHub: [github.com/aymenfurter/ai-podcast-generator](https://github.com/aymenfurter/ai-podcast-generator)