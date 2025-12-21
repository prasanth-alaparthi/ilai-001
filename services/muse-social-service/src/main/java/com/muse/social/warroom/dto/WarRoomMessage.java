package com.muse.social.warroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarRoomMessage {
    private String type;
    private Long roomId;
    private Long userId;
    private String content;
    private String error;
    private Long timestamp;
    private VariableUpdateDto variableUpdate;
    private List<VariableUpdateDto> variables;
}
