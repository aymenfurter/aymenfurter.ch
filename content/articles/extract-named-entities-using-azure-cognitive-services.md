---
title: "Extract named entities using Azure Cognitive Services"
date: 2022-04-01T00:00:00Z
tags: ["Azure", "AI"]
draft: false
description: "Learn how to extract named entities from text using Azure Cognitive Services Text Analytics, demonstrated through a practical example from a Hack Zurich project."
---

This year I helped to build [drugplug](https://github.com/drugpug/drugpug) as part of [Hack Zurich](https://hackzurich.com/). One key feature of the app is the extraction of relevant information or warnings out of a drug leaflet. We used Azure Cognitive Services in combination with fuse.js (for fuzzy search) for this purpose.

Integrating Text Analytics into our "data pipeline" was super easy. The following code will extract the named entities and store them as an array.

```javascript
const entityResults = await client.recognizeEntities( [text] );
for (let document of entityResults) {
    if (document.entities) {
        processedEntities = {}
        for (let entity of document.entities) {
            if (!drug[element.key]) {
                drug[element.key] = [];
            }
            
            var tag = {};
            tag.name = entity.text;
            tag.category = entity.category;
            drug[element.key].push(tag);
        }
    }
};
```

We then displayed those entities within our Single Page Application:

![Cognitive Services entities response interface](/images/cognitive-services-entities-response.png)

The complete code is available on [github](https://github.com/drugpug/drugpug/blob/main/scraper/extract-text.js).
