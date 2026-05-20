package com.gateway_service.controller;


import com.gateway_service.client.AuthClient;
import com.gateway_service.dto.auth.AuthenticationRequest;
import com.gateway_service.dto.auth.AuthenticationResponse;
import com.gateway_service.dto.auth.IntrospectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/esb/auth")
@RequiredArgsConstructor
public class EsbAuthController {

    private final AuthClient authClient;

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        AuthenticationResponse response = authClient.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<IntrospectResponse> validate(@RequestHeader(name = "Authorization", required = false) String authorization) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        log.debug("Validating token through ESB");
        IntrospectResponse response = authClient.introspect(token);
        return ResponseEntity.ok(response);
    }
}