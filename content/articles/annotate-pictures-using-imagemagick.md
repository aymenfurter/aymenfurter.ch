---
title: "Annotate pictures using imagemagick"
date: 2022-03-01T00:00:00Z
tags: ["Automation", "Development"]
draft: false
description: "Learn how to automate image annotation using ImageMagick to generate hundreds of personalized stickers and graphics programmatically."
---

Recently I've started to publish sticker designs on [redbubble](https://www.redbubble.com/). As I am after the "[long-tail](https://www.investopedia.com/terms/l/long-tail.asp)" items, I planned to generate hundreds of personalized stickers. You can apply this pattern for all kinds of use cases (for instance to generate stickers for each birthday).

First, we start by creating a template image. This image will be the background on top we add the text.

Next, we execute the following command to write text on top of the image (You may have to tweak the geometry parameter):

```bash
convert -font font.ttf template.png -gravity center -background none -size 433x300! caption:mytext -geometry +10+170 -composite generated/mytext.png
```

Let's assume we have a text file and want to generate an image for each line in the text file:

```bash
#!/bin/sh
while read line
do
    convert -font font.ttf template-new.png -gravity center -background none -size 433x300! caption:$line -geometry +10+170 -composite generated/$line.png
done < birtdays.txt
```

There you go!
