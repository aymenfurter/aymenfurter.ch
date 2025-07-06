---
title: "Some Experiments with ChatGPT"
date: 2022-12-04T00:00:00Z
draft: false
tags: ["AI", "Development", "Experimentation"]
categories: ["AI", "Development", "Experiments"]
description: "ChatGPT is a GPT-based chatbot developed by OpenAI that allows users to engage in natural language conversations with a virtual assistant. This technology has numerous potential applications, but in this article, we will focus on three entertaining ways you can use ChatGPT."
---

[ChatGPT](https://chat.openai.com/chat) is a GPT-based chatbot developed by OpenAI that allows users to engage in natural language conversations with a virtual assistant. This technology has numerous potential applications, but in this article, we will focus on three entertaining ways you can use ChatGPT.

## Play an RPG Game!

With ChatGPT, users can transform the AI language model into an interactive role-playing game (RPG).

Use the following ChatGPT prompt to get going:

> 🐕 can be moved with the input "LEFT", "RIGHT", "UP", and "DOWN" to be moved around the map. The 🐕 is allowed to move on 🌱.
>
> Example emoji map:
>
> 🌲🌲🌲🌲🌲
> 🌲🌱🏠🐟🌲
> 🌲🌱🌱🌱🌲
> 🌲🌱🌱🌱🌲
> 🌲🐕🌲🌲🌲
>
> only print out the emoji map. Don't write "UP", "RIGHT", "LEFT", "DOWN" yourself.

The next step is to instruct ChatGPT to move. It still occasionally draws the incorrect emojis even after several iterations, so this one is somewhat hit-and-miss.

![ChatGPT RPG game experiment](/images/chatgpt-experiments-rpg.png)

## Design your Cloud Application

ChatGPT can't draw. Only text can be printed using it. I was wondering if printing out plantuml code would allow us to get over that restriction. I, therefore, asked ChatGPT to create a Cloud Architecture using Plantuml for my side project c14r.io. My prompt was as follows:

> 1 have an application that is java based. It regularly crawls data and stores it using mongoldb and neo4j. What data is still pending to be crawled is stored in kafka. Through an UI users can retrieve the indexed data or add new items to index into kafka. The application is microservices based. There are 3 microservices running in containers to index, process (in batch) and retrieve data (used by the UI). It is a fully containerized application. The application must be highly available. the solution must be DR-capable. the solution must run on Microsoft Azure. I want to replace kafka, mongoldb and neo4j with azure-native services if possible. my application has a web UI written in angular. The application is deployed with GitHub Actions.
>
> - generate azure cloud architecture using plantuml code (use package and component in diagram) @startuml, explain for some key elements what application requirement is fulfilled with the component
>
> Use the following syntax for relationships:
>
> "Service A" -down-> "Service B": description
>
> @enduml is the last word of the output. 300 lines output total.

This is what it produced!

![ChatGPT generated PlantUML cloud architecture](/images/chatgpt-experiments-plantuml.png)

Although not entirely accurate (one of those services doesn't exist), this is still quite impressive.

## Code your next Java Application

Even when using a particular library, like Apache Camel, ChatGPT did a great job writing the code. Using the following prompt:

> An apache camel java code that reads from activemq a topic called "documents", then check if within the XML body the element name "deliver" is set to either true or is null. If so, forward it to the dlq queue in activemq. if not, call a soap service through cxf called "DocumentSOAPService". Ensure that reading from activemq is optimized by configuring 5–6 different configurations (for instance the prefetch size and optimizeAcknowledge configuraiton). For both failure and positive case, put a message into a topic called "notifications" with the value of "documentId" field and state field. Split the routes into 3 direct routes (direct:sendSOAPservice, direct:updateNotification, direct:processAMQmessage) to separate them nicely.

Wow, this was the result:

```java
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.component.activemq.ActiveMQComponent;
import org.apache.camel.component.cxf.CxfEndpoint;
import org.apache.camel.model.dataformat.XmlJsonDataFormat;

public class MyRouteBuilder extends RouteBuilder {
    @Override
    public void configure() throws Exception {
        // Configure ActiveMQ component
        ActiveMQComponent activemq = getContext().getComponent("activemq", ActiveMQComponent.class);
        activemq.getConfiguration().setBrokerURL("tcp://localhost:61616");
        activemq.getConfiguration().setCacheLevelName("CACHE_CONSUMER");
        activemq.getConfiguration().setOptimizeAcknowledge(true);
        activemq.getConfiguration().setPrefetchPolicy(new PrefetchPolicy(5, 6));

        // Configure CXF endpoint for SOAP service
        CxfEndpoint cxfEndpoint = new CxfEndpoint();
        cxfEndpoint.setAddress("http://localhost:8080/services/DocumentSOAPService");
        cxfEndpoint.setServiceClass(DocumentSOAPService.class);

        // XML to JSON data format
        XmlJsonDataFormat xmlJsonFormat = new XmlJsonDataFormat();
        xmlJsonFormat.setEncoding("UTF-8");
        xmlJsonFormat.setForceTopLevelObject(true);

        // Route for sending messages to SOAP service
        from("direct:sendSOAPService")
            .marshal(xmlJsonFormat)
            .to(cxfEndpoint)
            .to("activemq:notifications?jmsMessageType=Text");

        // Route for updating notification messages
        from("direct:updateNotification")
            .setHeader("documentId", xpath("/document/id/text()"))
            .setHeader("state", constant("success"))
            .to("activemq:notifications?jmsMessageType=Text");

        // Main route for processing messages from ActiveMQ
        from("activemq:documents")
            .choice()
                .when(xpath("/document/deliver/text() = 'true'"))
                    .to("direct:sendSOAPService")
                .when(xpath("/document/deliver/text() = 'null'"))
                    .to("activemq:dlq")
                    .to("direct:updateNotification")
                .otherwise()
                    .to("direct:processAMQMessage")
            .end();
    }
}
```

In order to write a unit test for that code, I then asked it:

> write a camel unit test for the updateNotification route

```java
import org.apache.camel.CamelContext;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.component.mock.MockEndpoint;
import org.apache.camel.test.junit4.CamelTestSupport;
import org.junit.Test;

public class UpdateNotificationRouteTest extends CamelTestSupport {
    @Override
    protected RouteBuilder createRouteBuilder() throws Exception {
        return new MyRouteBuilder();
    }

    @Override
    protected CamelContext createCamelContext() throws Exception {
        CamelContext context = super.createCamelContext();
        // Use mock endpoint for testing
        context.addComponent("activemq", context.getComponent("mock", MockEndpoint.class));
        return context;
    }

    @Test
    public void testUpdateNotification() throws Exception {
        // Set expected values for message headers
        String documentId = "123456";
        String state = "success";

        // Set up mock endpoint and expectations
        MockEndpoint mockEndpoint = getMockEndpoint("mock:activemq:notifications");
        mockEndpoint.expectedHeaderReceived("documentId", documentId);
        mockEndpoint.expectedHeaderReceived("state", state);

        // Send a message to the direct route
        template.sendBodyAndHeader("direct:updateNotification", null, "documentId", documentId);

        // Verify that the mock endpoint received the expected message
        assertMockEndpointsSatisfied();
    }
}
```

ChatGPT demonstrates that the possibilities of large language models are vast — and they're only getting bigger! It's been a wild ride to witness artificial intelligence advancing so quickly. Experiencing ChatGPT first-hand was definitely an enjoyable experience.
