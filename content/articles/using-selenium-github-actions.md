---
title: "Using Selenium within GitHub Actions"
description: "When working with GitHub Actions it can be useful to use Selenium. A common use case is for example the verification of a deployment (e.g. checking if a SPA is rendered correctly). With Selenium code, a user using a browser can be simulated."
date: 2022-08-01
categories: ["Development"]
authors: ["Aymen Furter"]
tags: ["Automation", "Development", "Web Development"]
draft: false
---

When working with GitHub Actions it can be useful to use Selenium. A common use case is for example the verification of a deployment (e.g. checking if a SPA is rendered correctly). With Selenium code, a user using a browser can be simulated.

## Setting up the Chrome Driver

The Chrome Driver must be set up specifically to work correctly within a GitHub Action Runtime. This is the configuration I am currently using:

```java
ChromeOptions options = new ChromeOptions();
options.setHeadless(true);
options.addArguments("--disable-dev-shm-usage");
options.addArguments("--no-sandbox");
options.addArguments("--disable-extensions");
options.addArguments("--disable-gpu");
WebDriver driver = new ChromeDriver(options);
```

## Configuring the GitHub Action Pipeline

To execute the action we use the **ubuntu-latest** image. However, this image does not have Google Chrome or Selenium installed. This means we have to install these components before we can execute our code. Here is the sample code for GitHub Actions which shows how to do this:

```yaml
name: Selenium Example
on:
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven
    - name: Setup Selenium
      run: |
        sudo wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - && \
        sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' && \
        sudo apt-get -y update && \
        sudo apt-get install -y google-chrome-stable && \
        sudo apt-get install -yqq unzip && \
        sudo wget -O /tmp/chromedriver.zip http://chromedriver.storage.googleapis.com/`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE`/chromedriver_linux64.zip && \
        sudo unzip /tmp/chromedriver.zip chromedriver -d /usr/local/bin/ && \
        DISPLAY=:99 && \
        sudo apt install -y python3-pip && \
        sudo pip install --upgrade pip && \
        sudo pip install selenium
    - name: Build with Maven
      run: cd my-selenium-app && mvn -DskipTests -B package --file pom.xml
    - name: Execute Selenium app
      run: cd my-selenium-app && java -jar target/my-selenium-app.jar update-index-flatfox
```

With this pipeline the installation of both Chrome and Selenium roughly takes about 17 seconds.
