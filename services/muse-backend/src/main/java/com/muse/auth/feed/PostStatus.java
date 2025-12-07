package com.muse.auth.feed;


public enum PostStatus {
    VISIBLE,          // normal visible post
    PENDING_REVIEW,   // waiting for teacher/university review
    BLOCKED           // blocked by moderation; not shown in normal feeds
}