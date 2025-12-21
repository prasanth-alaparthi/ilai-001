# muse-social-service Architecture

## Overview
A **Spring Boot 3.5.7** microservice handling **Social Features, Feed, and Chat** for the ILAI platform.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Spring Boot 3.5.7 (Java 21) |
| **Database** | PostgreSQL + Flyway migrations |
| **Cache** | Redis |
| **Real-time** | WebSocket (STOMP) |
| **Security** | Spring Security + OAuth2 Resource Server |
| **HTTP Client** | WebFlux (WebClient) |
| **RSS Parsing** | Rome 2.1.0 |
| **Vector Search** | Hibernate Vector (pgvector) |

---

## Module Structure

```
muse-social-service/
├── SocialServiceApplication.java           # Main entry point
│
├── chat/                                    # Real-time Chat Module
│   ├── controller/
│   │   ├── ChatController.java             # STOMP messaging
│   │   ├── MediaController.java            # File uploads
│   │   └── VideoSignalingController.java   # WebRTC signaling
│   ├── model/
│   │   ├── Conversation.java
│   │   ├── Message.java
│   │   └── ConversationParticipant.java
│   ├── repository/
│   └── service/
│       └── ChatService.java
│
└── feed/                                    # Social Feed Module
    ├── controller/
    │   ├── PostController.java             # CRUD for posts
    │   ├── CommentController.java          # Comments on posts
    │   ├── ReactionController.java         # Likes, reactions
    │   ├── GroupController.java            # Study groups
    │   ├── SmartFeedController.java        # AI-powered feed
    │   ├── FeedSourceController.java       # RSS sources
    │   ├── HashtagController.java          # Trending hashtags
    │   └── SocialController.java           # Follow/unfollow
    ├── entity/
    │   ├── Post.java
    │   ├── Comment.java
    │   ├── Reaction.java
    │   ├── StudyGroup.java
    │   ├── RssFeedSource.java
    │   ├── UserFollow.java
    │   ├── FeedUserProfile.java
    │   └── SavedPost.java
    ├── config/
    │   ├── WebSocketConfig.java
    │   ├── ResourceServerConfig.java       # JWT validation
    │   └── WebConfig.java                  # CORS
    ├── client/
    │   ├── AuthServiceClient.java          # Call auth service
    │   └── NotesServiceClient.java         # Call notes service
    └── dto/
        ├── CreatePostRequest.java
        ├── FeedPostDTO.java
        └── StudyGroupDTO.java
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Posts & Feed** | Create, share, react to posts |
| **Study Groups** | Create/join groups by subject |
| **Real-time Chat** | WebSocket-based messaging |
| **Video Calls** | WebRTC signaling support |
| **RSS Feed** | Aggregate educational news |
| **Smart Feed** | AI-personalized content ranking |
| **Hashtags** | Trending topics |
| **Follow System** | User connections |

---

## API Endpoints (Port 8083)

### Posts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts` | GET | List posts |
| `/api/posts` | POST | Create post |
| `/api/posts/{id}` | GET | Get single post |
| `/api/posts/{id}/react` | POST | React to post |
| `/api/posts/{id}/share` | POST | Share post |

### Comments
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts/{id}/comments` | GET | List comments |
| `/api/posts/{id}/comments` | POST | Add comment |

### Groups
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/groups` | GET | List groups |
| `/api/groups` | POST | Create group |
| `/api/groups/{id}/join` | POST | Join group |
| `/api/groups/{id}/leave` | POST | Leave group |

### Social
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/social/follow/{userId}` | POST | Follow user |
| `/api/social/unfollow/{userId}` | POST | Unfollow user |
| `/api/social/followers` | GET | List followers |
| `/api/social/following` | GET | List following |

### Feed
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/feed/smart` | GET | AI-ranked feed |
| `/api/feed/sources` | GET | RSS sources |
| `/api/hashtags/trending` | GET | Trending hashtags |

### WebSocket Endpoints
| Endpoint | Protocol | Description |
|----------|----------|-------------|
| `/ws/chat` | STOMP | Real-time chat |
| `/ws/video` | STOMP | Video call signaling |

---

## Database Schema (Flyway)

```sql
-- posts
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT,
    media_urls TEXT[],
    visibility VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- reactions
CREATE TABLE reactions (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES posts(id),
    user_id BIGINT NOT NULL,
    type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- study_groups
CREATE TABLE study_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100),
    subject VARCHAR(50),
    description TEXT,
    owner_id BIGINT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE
);

-- conversations
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- messages
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES conversations(id),
    sender_id BIGINT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Configuration

```yaml
# application.yml
server:
  port: 8083

spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/muse_social}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD}
  
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
  
  flyway:
    enabled: true
    locations: classpath:db/migration

  security:
    oauth2:
      resourceserver:
        jwt:
          secret: ${JWT_ACCESS_SECRET}
```

---

## Dependencies

- `spring-boot-starter-data-jpa` - JPA/Hibernate
- `spring-boot-starter-security` - Authentication
- `spring-boot-starter-oauth2-resource-server` - JWT validation
- `spring-boot-starter-websocket` - WebSocket/STOMP
- `spring-boot-starter-data-redis` - Caching
- `spring-boot-starter-webflux` - Non-blocking HTTP client
- `rome` - RSS feed parsing
- `hibernate-vector` - pgvector support
- `flyway-database-postgresql` - Migrations
