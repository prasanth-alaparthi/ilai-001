package com.muse.social.warroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariableUpdateDto {
    private String symbol;
    private String value;
    private String unit;
    private Map<String, Long> vectorClock;
    private Long updatedBy;
    private String source;
    private boolean verified;
}
