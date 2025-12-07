package com.muse.auth.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    Optional<Device> findByUserIdAndDeviceId(Long userId, String deviceId);
    List<Device> findByUserId(Long userId);
}