package com.muse.auth.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClaimedPrekeyRepository extends JpaRepository<ClaimedPrekey, Long> {
    List<ClaimedPrekey> findByTargetUserIdAndTargetDeviceIdAndConsumedFalse(Long userId, String deviceId);
}