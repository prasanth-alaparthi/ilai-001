# Backend Configuration Fix

## Issue: Notes Service Missing Property

The error `Could not resolve placeholder 'app.jwt.access-secret'` in the **Notes Service** indicates that your `ResourceServerConfig` (or similar bean) in the Notes Service is also trying to read this property, likely to configure a custom JWT decoder or validator.

Even though you added `spring.security.oauth2.resourceserver.jwt.secret-key`, some custom code in your Notes Service still expects `app.jwt.access-secret`.

## The Solution

You must add `app.jwt.access-secret` to the **Notes Service** `application.properties` as well.

### Correct `application.properties` for Notes Service:

```properties
server.port=8082

spring.datasource.url=jdbc:postgresql://localhost:5433/muse_notes
spring.datasource.username=postgres
spring.datasource.password=Prasanth
spring.jpa.hibernate.ddl-auto=update
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration/notes

# JWT Secret - REQUIRED by Spring Security
spring.security.oauth2.resourceserver.jwt.jws-algorithm=HS256
spring.security.oauth2.resourceserver.jwt.secret-key=temporary-insecure-access-secret-for-local-dev-only-32-chars

# JWT Secret - REQUIRED by your custom code (ResourceServerConfig)
app.jwt.access-secret=temporary-insecure-access-secret-for-local-dev-only-32-chars

# URL for the Auth Service
muse.auth-service.url=http://localhost:8081

# --- Google Gemini AI Configuration ---
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent
gemini.api.key=AIzaSyAKyCdKczfLIj_FPnNEfuX50pnwf4yzxTA

# --- Multipart Configuration ---
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

**Action Required:**
1.  **Uncomment** or **Add** the `app.jwt.access-secret` line in your **Notes Service** `application.properties`.
2.  Ensure it matches the secret key exactly.
3.  **Restart** the Notes Service.
