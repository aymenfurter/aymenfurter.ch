---
title: "Reading From Sheets During a Batch Job"
description: "One would usually use an interactive login to access the Google Sheets on behalf of a user. This approach works perfectly if the user is sitting in front of the computer at the time of access. However, if we want to access Google Sheet information during a batch job, an alternative way is to use service accounts."
date: 2022-06-01
categories: ["Development"]
authors: ["Aymen Furter"]
tags: ["Automation", "Development"]
draft: false
---

One would usually use an interactive login to access the Google Sheets on behalf of a user. This approach works perfectly if the user is sitting in front of the computer at the time of access. However, if we want to access Google Sheet information during a batch job (or during the runtime of a Github action, for example), this approach won't work. An alternative way is to use service accounts.

## Setting up the Service Account

The service account panel can be reached by opening [IAM & Admin in Google Cloud](https://console.cloud.google.com/iam-admin/serviceaccounts). After we create the service account, we will get the email of the service account with the following structure <principal-name>@project-name-12345.iam.gserviceaccount.com. Next, we go to the tab "KEYS", and generate a JSON key. The key will automatically download to your computer.

Last but not least we share the sheet with the newly created service account

![Service Account Setup](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*Y2VWQd6j5tUhyGfOjF-mOA.png)

## Reading Sheets data using the Java SDK

Now that we have our sheet and the service account is prepared, we can start with the code.

First, we create a **Credential** object that points to the JSON key we downloaded earlier (the file should be located in src/main/resources)

```java
InputStream in = GoogleAPI.class.getResourceAsStream("/google-sheets-client-secret.json");
GoogleCredential credential = GoogleCredential.fromStream(in);
List<String> scopes = Arrays.asList(SheetsScopes.SPREADSHEETS);
credential = credential.createScoped(scopes);
```

Now we are able to access the sheet, no login required:

```java
Sheets sheets = Sheets.Builder(
    GoogleNetHttpTransport.newTrustedTransport(),
    GsonFactory.getDefaultInstance(),
    credential)
    .setApplicationName("foobar")
    .build();

BatchGetValuesResponse response = sheets.spreadsheets().values()
    .batchGet(SPREADSHEET_ID)
    .setRanges(Arrays.asList("A1:A"))
    .execute();
```
