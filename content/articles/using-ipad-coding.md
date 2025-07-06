---
title: "Using an iPad for Coding"
description: "It is probably no surprise for you if I tell you that I am writing this on an iPad. Recently I was looking into GitHub Codespaces. A tool that makes your development experience independent of your physical device or location."
date: 2022-07-01
categories: ["Development"]
authors: ["Aymen Furter"]
tags: ["Development", "Experimentation"]
draft: false
---

It is probably no surprise for you if I tell you that I am writing this on an iPad. Recently I was looking into [GitHub Codespaces](https://github.com/features/codespaces). A tool that makes your development experience independent of your physical device or location. It is based on a browser-based VSCode instance, paired with surprisingly powerful dev containers (Even supporting "docker in docker").

## The Keyboard Layout

The first issue I've experienced is the keyboard layout. The typical issue is the missing Escape key. However, I found that not to be a big problem for me personally. iOS offers the ability to bind other keys to "Escape" (I use the 🌐 key). As I like to write my code using the de_CH keyboard, the bigger problem was actually the bracket keys ({ } [ ]). On a de_CH mac keyboard you get some little used letters like æ and ¶ instead of curly brackets. Since I am using the [VIM Plugin](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim) for VSCode, those letters can be rebound through configuration easily.

I use the following vim plugin configuration:

```json
"vim.insertModeKeyBindings": [
    {
        "before": ["'"],
        "after": ["["]
    },
    {
        "before": ["§"],
        "after": ["["]
    },
    {
        "before": ["æ"],
        "after": ["{"]
    },
    {
        "before": ["¶"],
        "after": ["}"]
    }
]
```

For the terminal / devcontainer vim runtime I have a similar [config](https://github.com/aymenfurter/dotfiles-ipados/blob/main/.vimrc).

## App Ecosystem

I found myself uninstalling a lot of apps. Medium does not work well for writing. GitHub does only allow you limited repository access. Generally, I often prefer to use the web apps instead of the dedicated apps with the iPad (for coding). For learning and reading the apps work great. I like to use the LinkedIn Learning App while taking notes on GoodNotes.
