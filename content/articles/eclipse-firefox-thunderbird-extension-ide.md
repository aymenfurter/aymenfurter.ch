---
title: "Eclipse as a Firefox / Thunderbird Extension IDE"
date: 2009-07-14T00:00:00Z
draft: false
emoji: "🔌"
description: "A guide on setting up Eclipse as a development environment for Firefox and Thunderbird extensions using Web Tools Platform and XUL Booster plugins."
tags: ["Eclipse", "Firefox", "Thunderbird", "JavaScript", "Development"]
categories: ["Development"]
weight: 100
---

Currently, Firefox and Thunderbird Extensions are very popular. Scripting an Extension is quite simple. All the information you need about the basic setup, you can find at the [Mozilla Dev Wiki](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons).

In this article I want to show how you can use Eclipse for developing Extensions.

First of all, you need to get Eclipse. You can download it at the [official Page](https://www.eclipse.org/).

Since Firefox/Thunderbird-Extensions are **JavaScript based**, it's strongly recommended to use the [Web Tools Platform](https://www.eclipse.org/webtools/) (WTP) Plugin. It's already installed in the JEE Package and it supports **JavaScript-Highlighting** and **Auto Completion**. If you like to edit the XUL-Files (GUI-Elements) and modify the rdf-Files **directly in Eclipse** you will need the XUL Booster-Plugin for Eclipse.

After installing you can add a new Extension-Project in Eclipse simply by creating a new project and setting the path to your Extension-Directory.

In Windows Vista you will find it at this location:

> `C:\Users\<Your User Account-Name>\AppData\Roaming\Thunderbird or Mozilla Firefox\Profiles\<Your Profile-Name>\extensions\<Your Extensions-GUID>\`

In Windows XP you will find it at this location:

> `C:\Users\<Your User Account-Name>\Applicationdata\Thunderbird or Mozilla Firefox\Profiles\<Your Profile-Name>\extensions\<Your Extensions-GUID>\`

Please notice that it is indispensable to use **a Jar-Free Manifest-Configuration**. You can find information about this point in the Mozilla Wiki at the link above.
