---
title: "Spinning up a temporary desktop environment within GitHub Codespaces"
date: 2022-09-01T00:00:00Z
draft: false
tags: ["Development", "Automation", "Experimentation"]
categories: ["Development"]
author: "Aymen Furter"
showToc: true
TocOpen: false
hidemeta: false
comments: false
description: "Learn how to create a full desktop environment within GitHub Codespaces using a webtop Docker container for remote development anywhere."
disableShare: false
disableHLJS: false
hideSummary: false
searchHidden: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
cover:
    image: "/images/github-codespaces-desktop.jpeg"
    alt: "GitHub Codespaces Desktop Environment"
    caption: "Image by Lara Far (https://unsplash.com/@lara_far)"
    relative: false
    hidden: false
---

As developers, we are always looking for ways to be more productive. An iPad with **GitHub Codespaces** is a great developer experience. The iPad is portable so it can be taken anywhere.

I was skeptical at first, but after using it for a while, I was convinced that it was a great way to develop software independent of location. Now, I use GitHub codespaces for everything. Building User Interfaces using TypeScript and Angular, Writing Microservices using Java, and even selenium-based automation. It has really helped me to streamline my work and get things done faster. Furthermore, I recommend this setup for developers who want to get work done while they're away from their desktops.

## Working with Devcontainers

Inside GitHub Codespaces, you use devcontainers to create and test your code. This allows you to package your code faster later on since you already know how to containerize it.

In this blog post, I will show you how to spin up a full desktop environment within GitHub codespaces!

## Setting up a WebTop Container

A webtop docker container is a great way to get a desktop environment within GitHub codespaces. It is based on Apache Guacamole. All you need to do is pull the image from Docker Hub and then run it with a single command:

```bash
docker run -d \
  --name=webtop \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Europe/London \
  -p 3000:3000 \
  -v /path/to/data:/config \
  --shm-size="1gb" \
  --restart unless-stopped \
  ghcr.io/linuxserver/webtop
```

## Accessing Your Desktop Environment

Once you have the webtop docker container up and running, you will have it available to you secured through GitHub. You can use all of the same tools that you would use on your local machine, without having to worry about traveling with a laptop.

## Important Considerations

Keep in mind that the webtop docker container does not persist data. This means that any changes you make to files within the container will be lost when you exit the container. If you need to save any data, you will need to mount a volume from your local machine into the container. You could for instance replace the **/path/to/data** path above, pointing to your git directory instead.

## Conclusion

GitHub Codespaces combined with a webtop Docker container provides an incredibly flexible development environment that can be accessed from anywhere. This setup is particularly powerful for developers who need the full capabilities of a desktop environment while working remotely. Whether you're on an iPad, a Chromebook, or any other device with a browser, you can have access to a complete Linux desktop environment with all your development tools.
