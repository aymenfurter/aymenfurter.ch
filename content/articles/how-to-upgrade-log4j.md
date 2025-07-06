---
title: "How to Upgrade log4j"
date: 2021-12-12T00:00:00Z
description: "With the recent log4j vulnerability, everyone is currently patching their Java Applications. In this article, we're going to take a look how such a patch can look like."
tags: ["Security", "Development"]
---

With the recent [log4j vulnerability](http://cve.mitre.org/cgi-bin/cvename.cgi?name=2021-44228), everyone is currently patching their Java Applications. In this article, we're going to take a look how such a patch can look like.

Usually, we don't use log4j directly, but get it through another maven dependency transiently. To identify what log4j version we are using, the following command can be used:

```bash
$ mvn dependency:tree | grep log4j
```

This command will print the complete tree of dependencies, then filter for the term "log4j". The output may look something like that:

```
org.apache.logging.log4j:log4j-api:jar:2.7:compile
org.apache.logging.log4j:log4j-core:jar:2.7:compile
org.apache.logging.log4j:log4j-slf4j-impl:jar:2.7:compile
```

As we can see we're using a vulnerable version of log4j (2.7). To upgrade to a safe version (2.17.0) we can now add the following code to the pom.xml file:

```xml
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-api</artifactId>
  <version>2.17.0</version>
</dependency>
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-core</artifactId>
  <version>2.17.0</version>
</dependency>
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-slf4j-impl</artifactId>
  <version>2.17.0</version>
</dependency>
```

If we now execute this command again, we can see that the vulnerable log4j dependency is gone:

```bash
$ mvn dependency:tree | grep log4j
```

```
org.apache.logging.log4j:log4j-api:jar:2.17.0:compile
org.apache.logging.log4j:log4j-core:jar:2.17.0:compile
org.apache.logging.log4j:log4j-slf4j-impl:jar:2.17.0:compile
```

You may only find the **log4j-api** dependency in your output. This means you are not using the vulnerable **log4j-core** dependency.
