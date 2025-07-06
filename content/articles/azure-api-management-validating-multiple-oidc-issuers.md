---
title: "Azure API Management: Validating Multiple OIDC Issuers for a Single API"
date: 2023-06-08
draft: false
emoji: "🔐"
description: "Learn how to configure Azure API Management to validate JWT tokens from multiple OIDC issuers using the choose policy and validate-jwt policy."
tags: ["Azure", "Security", "Infrastructure"]
weight: 10
---

Azure API Management can give you security-in-depth by already identifying invalid requests containing no or invalid JWT tokens on your requests before they even reach your backend.

You can use the [validate-jwt policy](https://learn.microsoft.com/en-us/azure/api-management/validate-jwt-policy) to validate any OIDC provider and specify the required claims, audiences, issuers, and signing keys. However, there might be situations where a single API should support multiple issuers. In that case, you can use the [choose policy](https://learn.microsoft.com/en-us/azure/api-management/choose-policy) to apply different validation rules based on the issuer claim.

## Identifying the Issuer

First, we need to identify the issuer. The issuer is encoded in base64 and stored in the JWT. We can use a variable to store the issuer after decoding it.

In the below example we support both AAD as well as an external IDP:

```xml
<policies>
    <inbound>
        <set-variable name="issuer" value="@{
            string auth = context.Request.Headers.GetValueOrDefault("Authorization", "");
            if (string.IsNullOrEmpty(auth) || !auth.StartsWith("Bearer ")) { return ""; }
            string jwt = auth.Substring("Bearer ".Length);
            string[] jwtParts = jwt.Split('.');
            if (jwtParts.Length != 3) { return ""; }
            string payloadBase64 = jwtParts[1];
            int paddingLength = payloadBase64.Length % 4;
            if (paddingLength > 0)
            {
                payloadBase64 += new string('=', 4 - paddingLength);
            }
            string payloadJson = Encoding.UTF8.GetString(Convert.FromBase64String(payloadBase64));
            JObject payload = JObject.Parse(payloadJson);
            return payload.Value<string>("iss");
        }" />
        <choose>
            <when condition="@(context.Variables.GetValueOrDefault<string>("issuer") == "https://<your-third-party-idp>/")">
                <validate-jwt header-name="Authorization" failed-validation-httpcode="401" failed-validation-error-message="Unauthorized" require-expiration-time="true" require-scheme="Bearer" require-signed-tokens="true">
                    <openid-config url="https://<your-third-party-idp>/.well-known/openid-configuration" />
                </validate-jwt>
            </when>
            <otherwise>
                <validate-jwt header-name="Authorization" failed-validation-httpcode="403" failed-validation-error-message="Forbidden">
                    <openid-config url="https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration" />
                    <issuers>
                        <issuer>https://sts.windows.net/<tenant-id>/</issuer>
                    </issuers>
                </validate-jwt>
            </otherwise>
        </choose>
        <base />
    </inbound>
    <backend>
        <base />
    </backend>
    <outbound>
        <base />
    </outbound>
    <on-error>
        <base />
    </on-error>
</policies>
```

This policy configuration allows you to support multiple OIDC issuers within a single API by:

1. **Extracting the issuer** from the JWT token payload
2. **Using conditional logic** to apply different validation rules based on the issuer
3. **Configuring different error codes** for different validation scenarios
4. **Supporting both Azure AD and external identity providers**

This approach provides flexibility when working with applications that need to authenticate users from multiple identity providers while maintaining security at the API gateway level.
