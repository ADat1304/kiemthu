package com.gateway_service.dto.auth;

import lombok.Data;

@Data
public class IntrospectResponse {
    private boolean valid;
}