package com.muse.auth.auth.dto;

import lombok.Data;

@Data
public class CreateInstitutionRequest {
    private String name;
    private String type;
    private String address;
    private String contactEmail;
    private String contactPhone;
}
