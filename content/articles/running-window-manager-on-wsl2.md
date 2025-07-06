---
title: "Running a window manager on top of WSL2"
date: 2023-01-22T00:00:00Z
draft: false
description: "WSL2 is the optimal solution for bringing the Linux command line experience to Windows. The user experience when using the Windows Terminal is great."
tags: ["Development", "Infrastructure", "Experimentation"]
categories: ["Technology", "System Administration"]
cover:
  image: "images/wsl2-window-manager.png"
  alt: "Running a window manager on top of WSL2"
---

![WSL2 Window Manager](/images/wsl2-window-manager.png)

WSL2 is the optimal solution for bringing the Linux command line experience to Windows. The user experience when using the Windows Terminal is great. Still — As a long-time user of i3wm, I was curious about the possibility of running i3wm within WSL2. Installing it is straightforward; the default WSL2 installation is Ubuntu, and i3wm is readily available in the repositories. But, how can you run it? WSL was not designed to run a window manager.

Most guides I've found involve setting up an X Server on your Windows installation (e.g. VcXsrv), which, of course, requires securing the corresponding port on your Windows Firewall. I sought a simpler and potentially safer solution, ideally keeping the X server within Linux. It is possible to [run GUI apps within the Windows Subsystem for Linux](https://github.com/microsoft/wslg). Is it possible to use this feature to somehow access an entire desktop environment? It turns out, yes! Xephyr is a nested X Server that runs as a standard X application. If you start it up, WSLg will recognize and display it as a new Linux app within Windows. After installing it (via apt-get install xserver-xephyr), I was able to start up Xephyr using the following command:

```bash
Xephyr :1 -fullscreen
```

With this configuration, Xephyr will launch a new DISPLAY (:1). To start i3wm on that new DISPLAY, we need to specify the display through an environment variable. On a separate shell, execute:

```bash
DISPLAY=:1 i3
```

I also needed to make a slight modification to my configuration, to set xterm to use display :1

```bash
bindsym $mod+Return exec xterm -display :1
```

In conclusion, it is possible to use Xephyr, a nested X Server, to access an entire desktop environment within WSL. The installation and setup process is relatively straightforward, but may require some modifications to your existing i3 config.

This is of course not what WSLg was designed for, so your mileage may vary.
