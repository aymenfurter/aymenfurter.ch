---
title: "Exploring the Capabilities of Large Language Models: Analyzing Unstructured Text 🕵️"
date: 2023-02-27T00:00:00Z
draft: false
description: "Recently, there has been a lot of hype around large language models and their application in chatbots. However, there is so much more that this technology can offer."
tags: ["AI", "Azure", "Experimentation"]
categories: ["Technology", "Artificial Intelligence"]
cover:
  image: "images/exploring-llm-capabilities.gif"
  alt: "Exploring the Capabilities of Large Language Models"
---

![Exploring LLM Capabilities](/images/exploring-llm-capabilities.gif)

Recently, there has been a lot of hype around large language models and their application in chatbots. However, there is so much more that this technology can offer. Since the Large Language Models were introduced, I was curious about their potential for analyzing unstructured text. That was the reason why I decided to build InsightGPT, to see if it would be possible to reason over this type of data. As a test drive, I analyzed two specific use cases — accident and ufo sightings reports.

InsightGPT is a web-based application that utilizes the Azure OpenAI Service, which runs the Davinci model, to analyze unstructured text. The results were impressive, with the tool extracting key information such as the shape of the observed object and the type of observation (e.g. naked eye). In the accident example, the model was able to reason about the reports and determine whether the accident was preventable, as well as what measures could have helped.

The potential for large language models to analyze unstructured text is enormous, as this type of data is often mostly unused within organizations.

If you're interested in exploring InsightGPT's yourself, you can check out the code on [GitHub](https://github.com/aymenfurter/InsightGPT). You can also try the [demo](https://aymenfurter.github.io/InsightGPT) on the web.
