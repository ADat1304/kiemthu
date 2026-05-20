package com.gateway_service.dto.auth;


import lombok.Data;

@Data
public class IntrospectRequest {
    private String token;
}