package com.gateway_service.dto.auth;

import lombok.Data;

@Data
public class AuthenticationResponse {
    private String token;
    private boolean authenticated;
}