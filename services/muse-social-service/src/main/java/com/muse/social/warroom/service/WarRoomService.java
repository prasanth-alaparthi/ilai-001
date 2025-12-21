package com.muse.social.warroom.service;

import com.muse.social.warroom.entity.RoomVariable;
import java.util.List;
import java.util.Map;

public interface WarRoomService {
    List<RoomVariable> getRoomVariables(Long roomId);

    RoomVariable updateVariable(Long roomId, Long userId, String symbol, String value,
            String unit, Map<String, Long> vectorClock, String source, boolean verified);
}
