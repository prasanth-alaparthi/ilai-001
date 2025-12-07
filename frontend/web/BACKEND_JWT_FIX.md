# Backend JWT Configuration Fix

Based on your provided `application.properties` for the **Auth Service**, the secret key being used is:

`temporary-insecure-access-secret-for-local-dev-only-32-chars`

You must configure the **Notes Service** to use this **exact same secret key** so it can validate tokens locally.

### Step 1: Locate the Configuration File

Find the `application.properties` or `application.yml` file in your **Notes Service** source code (e.g., `src/main/resources/application.properties`).

### Step 2: Add the Secret Key

Add the following configuration to the Notes Service properties file.

**If using `application.properties`:**

```properties
# JWT Configuration
# MUST match the secret in Auth Service (app.jwt.access-secret)
spring.security.oauth2.resourceserver.jwt.jws-algorithm=HS256
spring.security.oauth2.resourceserver.jwt.secret-key=temporary-insecure-access-secret-for-local-dev-only-32-chars
```

**If using `application.yml`:**

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jws-algorithm: HS256
          secret-key: temporary-insecure-access-secret-for-local-dev-only-32-chars
```

### Step 3: Restart Notes Service

Restart the `muse-notes-service`. It should now be able to validate the Bearer tokens sent by the frontend without needing to call the Auth Service.
