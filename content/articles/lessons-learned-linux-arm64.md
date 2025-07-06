+++
title = "Lessons learned from moving to linux-arm64"
date = "2022-05-01"
author = "Aymen Furter"
description = "I recently moved to a Macbook M1 as my daily driver (running Linux on top). It came to my surprise how well everything worked it was."
cover = "images/lessons-learned-linux-arm64.jpeg"
tags = ["Development", "Infrastructure"]
+++

![Lessons learned from moving to linux-arm64](/images/lessons-learned-linux-arm64.jpeg)

I recently moved to a Macbook M1 as my daily driver (running Linux on top). It came to my surprise how well everything worked it was.

## **Virtualization**

There are currently three options for how to run a Linux VM on top of macOS on the M1. Parallels, VMWare Fusion and UTM. I used all of them in the past, they all work fine. UTM is based on qemu and has generally more sharp edges.

## **Linux Setup**

I selected Ubuntu Desktop 20.04 LTS. [An ISO for the arm version is available](https://cdimage.ubuntu.com/focal/daily-live/current/) out of the box. Installation was super easy and painless. i3wm, neovim and zsh were installable through the ubuntu repositories. Alacritty (my terminal emulator of choice) was installable through cargo.

## Developer Tools

Setting up developer tools started to get tricky. Azure CLI on arm is only available through pip (pip install azure-cli), IntelliJ is not yet officially supported (but works fine), and my favorite file comparison tool "beyond compare" does not (yet) provide an arm64 version. Other tools I use like VSCode, Terraform, k9s, docker, and kubectl were no problem to install.

## Conclusion

Using an arm64 based Linux environment as a daily driver is a viable option. Thanks to the popularity of AWS Graviton and Raspberry Pi 4, most applications and tools already provide support for ARM64.
