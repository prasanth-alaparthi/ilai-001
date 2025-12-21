package com.muse.social.warroom.repository;

import com.muse.social.warroom.entity.RoomVariable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomVariableRepository extends JpaRepository<RoomVariable, Long> {
    List<RoomVariable> findByRoomId(Long roomId);

    Optional<RoomVariable> findByRoomIdAndSymbol(Long roomId, String symbol);
}
