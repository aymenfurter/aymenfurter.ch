---
title: "Looking Glass"
date: 2017-12-21
draft: false
emoji: "🖥️"
description: "Exploring Looking Glass, a Linux application that enables fast frame relay from virtual machines with pass-through GPUs to host machines."
tags: ["Infrastructure", "Experimentation"]
weight: 10
---

No, I'm not talking about Mozilla's newest mass-roll-outed Mr Robot Addon. Looking Glass is a Linux app developed by Geoffrey McRae of HostFission. It lets you relay frames rendered within a virtual machine (with a Pass-through GPU) to the host machine in a very fast fashion. It also handles mouse and keyboard input.

## What is Looking Glass?

Looking Glass is a revolutionary application that allows you to run a virtual machine with GPU passthrough while seamlessly displaying the VM's output on your host system. This is particularly useful for running Windows games or applications on a Linux host without the typical performance penalties associated with traditional virtualization.

## Key Features

- **Low Latency**: Minimal delay between VM rendering and host display
- **GPU Passthrough**: Utilizes dedicated GPU hardware for the virtual machine
- **Seamless Input**: Mouse and keyboard input handling between host and guest
- **High Performance**: Near-native gaming performance in virtualized environments

## Use Cases

The setup is particularly valuable for:
- Gaming on Windows while maintaining a Linux host system
- Running Windows-specific applications with full GPU acceleration
- Testing and development scenarios requiring isolated Windows environments
- Maintaining security separation while preserving performance

This technology represents a significant advancement in virtualization, bridging the gap between the security and flexibility of virtual machines and the performance requirements of modern applications and games.
