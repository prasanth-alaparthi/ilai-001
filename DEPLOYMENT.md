# Deployment Guide for Ilai (Muse)

This guide will help you deploy the Ilai application using Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose installed on your machine or server.
- Java JDK 21 (for building the backend).
- Node.js and npm (for building the frontend).

## Step 1: Build the Backend Services

You need to build the JAR file for each microservice. Open a terminal in the project root and run the following commands:

```bash
# Auth Service
cd services/muse-auth-service
./mvnw clean package -DskipTests
cd ../..

# Notes Service
cd services/muse-notes-service
./mvnw clean package -DskipTests
cd ../..

# Feed Service
cd services/muse-feed-service
./mvnw clean package -DskipTests
cd ../..

# Parental Service
cd services/muse-parental-service
./mvnw clean package -DskipTests
cd ../..

# Journal Service
cd services/muse-journal-service
./mvnw clean package -DskipTests
cd ../..
```

*Note: If you don't have `./mvnw` (Maven Wrapper) in the directories, use `mvn clean package -DskipTests` if you have Maven installed globally.*

## Step 2: Build the Frontend

Build the React application for production.

```bash
cd frontend/web
npm install
npm run build
cd ../..
```

This will create a `dist` folder in `frontend/web` which Docker will use.

## Step 3: Configure Environment Variables

Ensure you have a `.env` file in the root directory (or set these variables in your deployment environment). You can copy `.env.example` to `.env` and update the values.

Key variables to check:
- `DB_PASSWORD`: Your database password.
- `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: Secure random strings.
- `GEMINI_API_KEY`: Your Google Gemini AI API key.
- `SENDGRID_API_KEY`: For email services (if used).

## Step 4: Run with Docker Compose

From the root directory of the project, run:

```bash
docker-compose up --build -d
```

This command will:
1.  Build the Docker images for all services.
2.  Start the PostgreSQL database.
3.  Start all backend microservices.
4.  Start the Nginx frontend server.

## Step 5: Access the Application

Once all containers are running (you can check with `docker-compose ps`), access the application at:

**http://localhost** (or your server's IP address)

## Troubleshooting

- **Database Connection**: If services fail to start, check the logs (`docker-compose logs -f`) to see if they are waiting for the database. They are configured to wait, but sometimes timeouts occur.
- **Ports**: Ensure ports 80, 8081, 8082, 8083, 8084, 8085 are not occupied by other services on your host.
