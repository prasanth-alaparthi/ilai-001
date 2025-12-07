package com.muse.auth.flash.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "user_xp")
@Data
public class UserXp {

    @Id
    private String username;

    private Long xp;

    private Instant lastUpdated;
}
