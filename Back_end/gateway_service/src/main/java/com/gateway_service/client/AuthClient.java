package com.gateway_service.client;


import com.gateway_service.common.ApiResponse;
import com.gateway_service.config.ServiceEndpointsProperties;
import com.gateway_service.dto.auth.AuthenticationRequest;
import com.gateway_service.dto.auth.AuthenticationResponse;
import com.gateway_service.dto.auth.IntrospectRequest;
import com.gateway_service.dto.auth.IntrospectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class AuthClient {

    private final RestTemplate restTemplate;
    private final ServiceEndpointsProperties endpointsProperties;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AuthenticationRequest> entity = new HttpEntity<>(request, headers);

        ResponseEntity<ApiResponse<AuthenticationResponse>> response = restTemplate.exchange(
                endpointsProperties.getUser() + "/auth/token",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public IntrospectResponse introspect(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        IntrospectRequest request = new IntrospectRequest();
        request.setToken(token);

        HttpEntity<IntrospectRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<IntrospectResponse>> response = restTemplate.exchange(
                endpointsProperties.getUser() + "/auth/introspect",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }
}