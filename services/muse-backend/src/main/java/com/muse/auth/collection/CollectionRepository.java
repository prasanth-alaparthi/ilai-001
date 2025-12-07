package com.muse.auth.collection;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CollectionRepository extends JpaRepository<CollectionEntity, Long> {
    List<CollectionEntity> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);
}