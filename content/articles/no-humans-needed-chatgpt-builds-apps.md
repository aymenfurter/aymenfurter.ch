---
title: "No Humans Needed: How ChatGPT Builds Apps Without You"
date: 2023-03-19
draft: false
emoji: "🤖"
description: "Experimenting with giving ChatGPT access to a Linux shell using the ReAct prompt technique to build applications autonomously."
tags: ["AI", "Automation", "Experimentation", "Development"]
weight: 10
---

![ChatGPT Autopilot](/images/chatgpt-autopilot.png)

*Disclaimer: I'm just experimenting with this as a personal hobby / for fun.*

There has been a lot of buzz lately surrounding the ReAct Prompt Technique ([https://react-lm.github.io/](https://react-lm.github.io/)), enabling LLMs to engage in reasoning and build thought processes. Additionally, ReAct provides a means for LLMs to articulate when they intend to execute an action, such as calling an API.

## ChatGPT-On-Autopilot: Connecting ChatGPT With a Linux Shell

What would happen if we were to use the ReAct Prompt technique and grant ChatGPT access to a Linux shell (i.e. forwarding all of its 'Actions' to a shell and then returning the output)? I've built a tool called "ChatGPT-on-autopilot" that does exactly that.

Will the AI be able to autonomously construct an app by iteratively running shell commands and subsequently testing it, all without any human intervention?

Let's find out. We start with a single sentence:

> build and test a cli based todo app in nodejs. feel free to install components as needed

Remember, in the ReactPrompt technique, every iteration has a **Observation**, **Thought** and **Action** step. I called those iterations "packages". Let's take a look at the first package:

```
Package 1 - Observation: I need to create a command-line todo app using Node.js.
Package 1 - Thought: I should first check if Node.js is installed and install necessary dependencies.
Package 1 - Action: Shell[node -v || curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash - && sudo apt-get install -y nodejs && npm init -y && npm install --save yargs]
```

After reviewing the shell environment, ChatGPT checked whether Node was installed. Remarkably, the command installs Node.js automatically if it's not yet present! In addition, it initializes a new Node.js project and install the yargs dependency (yargs is a popular framework for building CLI apps).

This was the output provided back ChatGPT:

```
v14.21.3
Reading package lists...
Building dependency tree...
Reading state information...
nodejs is already the newest version (14.21.3-deb-1nodesource1).
0 upgraded, 0 newly installed, 0 to remove and 8 not upgraded.
Wrote to /tmp/package.json:
{
  "name": "tmp",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "yargs": "^17.7.1"
  },
  "devDependencies": {},
  "description": ""
}
npm WARN tmp@1.0.0 No description
npm WARN tmp@1.0.0 No repository field.
+ yargs@17.7.1
updated 1 package and audited 16 packages in 0.453s
found 0 vulnerabilities
```

Let's take a look at the next iteration:

```
Package 2 - Observation: Node.js is installed, and the yargs package has been added.
Package 2 - Thought: I need to create the main JavaScript file for the todo app and implement the basic commands.
Package 2 - Action: Shell[echo 'const yargs = require("yargs");
yargs.command("add", "Add a new task", {}, argv => {
console.log(`Task added: ${argv.task}`);
});
yargs.command("list", "List all tasks", {}, () => {
console.log("Listing all tasks");
});
yargs.command("delete", "Delete a task", {}, argv => {
console.log(`Task deleted: ${argv.task}`);
});
yargs.parse();
' > todo.js && node todo.js list]
```

As we can see, the AI follows a common approach among programmers by creating the boilerplate code first. What's interesting is that it not only stores program as a file, but also immediately calls it to check if the boilerplate code works correctly.

This was the shell output provided back:

```
Listing all tasks
```

Alright, let's look at package number 3 (This is the good part!):

```
Package 3 - Observation: The basic structure of the todo app has been created, and the "list" command is working.
Package 3 - Thought: Now, I need to implement actual functionality for adding, listing, and deleting tasks by storing them in a file.
Package 3 - Action: Shell[echo 'const fs = require("fs");
const yargs = require("yargs");
const loadTasks = () => {
  try {
    const dataBuffer = fs.readFileSync("tasks.json");
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    return [];
  }
};
const saveTasks = tasks => {
  const dataJSON = JSON.stringify(tasks);
  fs.writeFileSync("tasks.json", dataJSON);
};
yargs.command("add", "Add a new task", {
  task: {
    describe: "Task description",
    demandOption: true,
    type: "string"
  }
}, argv => {
  const tasks = loadTasks();
  tasks.push({ task: argv.task });
  saveTasks(tasks);
  console.log(`Task added: ${argv.task}`);
});
yargs.command("list", "List all tasks", {}, () => {
  const tasks = loadTasks();
  tasks.forEach(task => {
    console.log(task.task);
  });
});
yargs.command("delete", "Delete a task", {
  task: {
    describe: "Task description",
    demandOption: true,
    type: "string"
  }
}, argv => {
  const tasks = loadTasks();
  const remainingTasks = tasks.filter(task => task.task !== argv.task);
  saveTasks(remainingTasks);
  console.log(`Task deleted: ${argv.task}`);
});
yargs.parse();
' > todo.js && node todo.js add --task="Sample task" && node todo.js list && node todo.js delete --task="Sample task" && node todo.js list]
```

During this step, the AI confirmed that the code was working correctly and proceeded to develop the required functionality. Next, it executed a series of operations, including calling the add, list, and delete functions. This iterative feedback loop allowed for continuous refinement of the program.

This was the output:

```
Task added: Sample task
Sample task
Task deleted: Sample task
```

So, what did we just witness the AI do?

- The AI set up our Linux environment, ensuring node is installed.
- It made the decision to import a code dependency necessary for the project.
- The AI generated the boilerplate code for the CLI logic.
- Following that, it created the business logic for our todo list app.
- Finally, the AI conducted testing on the business logic, all without any human intervention.

Truly impressive!

## How Does It All Work?

To use GPT-4, I created a browser extension for ChatGPT that intercepts messages and forwards them to a Python-based shell proxy. The shell proxy executes any commands sent to it and returns the output. While this method has been effective, I've encountered occasional issues with rate limiting. Some things like indentation doesn't work. Due to the current limit of 25 messages per 3 hours, I was unable to test as many scenarios as I would have liked. Hopefully, the limit will be increased in the near future to allow for more extensive testing.

You can find the code for the extension and the Shell Proxy on [GitHub](https://github.com/aymenfurter/ChatGPT-on-autopilot). The generated code is also [available](https://github.com/aymenfurter/todo.js/tree/main).

## Conclusion

This experiment demonstrates the incredible potential of combining Large Language Models with system-level access. By giving ChatGPT the ability to execute shell commands and receive feedback, we've created a primitive but functional autonomous developer that can:

1. **Assess and prepare environments** automatically
2. **Make intelligent decisions** about dependencies and tools
3. **Write and iterate on code** based on testing feedback
4. **Test and validate** its own implementations

While this is still experimental and has limitations, it provides a fascinating glimpse into the future of AI-assisted development and potentially fully autonomous coding systems.
