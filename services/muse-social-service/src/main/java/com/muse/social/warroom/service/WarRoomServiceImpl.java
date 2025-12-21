package com.muse.social.warroom.service;

import com.muse.social.warroom.entity.RoomVariable;
import com.muse.social.warroom.repository.RoomVariableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarRoomServiceImpl implements WarRoomService {

    private final RoomVariableRepository variableRepository;

    @Override
    public List<RoomVariable> getRoomVariables(Long roomId) {
        return variableRepository.findByRoomId(roomId);
    }

    @Override
    @Transactional
    public RoomVariable updateVariable(Long roomId, Long userId, String symbol, String value,
            String unit, Map<String, Long> incomingClock, String source, boolean verified) {

        RoomVariable existing = variableRepository.findByRoomIdAndSymbol(roomId, symbol)
                .orElse(RoomVariable.builder()
                        .roomId(roomId)
                        .symbol(symbol)
                        .vectorClock(new HashMap<>())
                        .build());

        // Vector Clock Comparison (HAPPENED-BEFORE logic)
        Map<String, Long> localClock = existing.getVectorClock();
        int comparison = compareClocks(localClock, incomingClock);

        if (comparison < 0) {
            // Incoming is newer - Accept
            existing.setValue(value);
            existing.setUnit(unit);
            existing.setSource(source);
            existing.setIsVerified(verified);
            existing.setLastUpdatedBy(userId);
            existing.setVectorClock(mergeClocks(localClock, incomingClock));
            log.debug("Variable {} updated in room {} (Incoming newer)", symbol, roomId);
        } else if (comparison == 0) {
            // Concurrent (Conflict) - LWW (Last Writer Wins) strategy for simplicity
            // In production, we could use user level or timestamp here
            existing.setValue(value);
            existing.setLastUpdatedBy(userId);
            existing.setVectorClock(mergeClocks(localClock, incomingClock));
            log.warn("Conflict detected for variable {} in room {}. Applied LWW.", symbol, roomId);
        } else {
            // Incoming is older - Reject/Ignore
            log.debug("Stale update rejected for variable {} in room {}", symbol, roomId);
        }

        return variableRepository.save(existing);
    }

    private int compareClocks(Map<String, Long> local, Map<String, Long> remote) {
        if (remote == null)
            return 1;
        if (local == null || local.isEmpty())
            return -1;

        boolean localGreater = false;
        boolean remoteGreater = false;

        for (String node : remote.keySet()) {
            if (remote.get(node) > local.getOrDefault(node, 0L))
                remoteGreater = true;
            if (local.getOrDefault(node, 0L) > remote.get(node))
                localGreater = true;
        }

        for (String node : local.keySet()) {
            if (local.get(node) > remote.getOrDefault(node, 0L))
                localGreater = true;
        }

        if (remoteGreater && !localGreater)
            return -1; // remote is newer
        if (localGreater && !remoteGreater)
            return 1; // local is newer
        return 0; // concurrent
    }

    private Map<String, Long> mergeClocks(Map<String, Long> local, Map<String, Long> remote) {
        Map<String, Long> merged = new HashMap<>(local != null ? local : new HashMap<>());
        if (remote != null) {
            for (Map.Entry<String, Long> entry : remote.entrySet()) {
                merged.merge(entry.getKey(), entry.getValue(), Math::max);
            }
        }
        return merged;
    }
}
