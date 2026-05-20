package com.gateway_service.client;

import com.gateway_service.common.ApiResponse;
import com.gateway_service.config.ServiceEndpointsProperties;
import com.gateway_service.dto.user.UserCreationRequest;
import com.gateway_service.dto.user.UserResponse;
import com.gateway_service.dto.user.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserClient {

    private final RestTemplate restTemplate;
    private final ServiceEndpointsProperties endpointsProperties;

    public UserResponse createUser(UserCreationRequest request, String token) {
        HttpHeaders headers = defaultHeaders(token);
        HttpEntity<UserCreationRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<UserResponse>> response = restTemplate.exchange(
                endpointsProperties.getUser() + "/users",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public List<UserResponse> getUsers(String token) {
        ResponseEntity<ApiResponse<List<UserResponse>>> response = restTemplate.exchange(
                endpointsProperties.getUser() + "/users",
                HttpMethod.GET,
                new HttpEntity<>(defaultHeaders(token)),
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }

    public UserResponse getUserById(String userId, String token) {
        ResponseEntity<ApiResponse<UserResponse>> response = restTemplate.exchange(
                endpointsProperties.getUser() + "/users/" + userId,
                HttpMethod.GET,
                new HttpEntity<>(defaultHeaders(token)),
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public UserResponse updateUser(String userId, UserUpdateRequest request, String token) {
        HttpHeaders headers = defaultHeaders(token);
        HttpEntity<UserUpdateRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<UserResponse>> response = restTemplate.exchange(
                endpointsProperties.getUser() + "/users/" + userId,
                HttpMethod.PUT,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public void deleteUser(String userId, String token) {
        restTemplate.exchange(
                endpointsProperties.getUser() + "/users/" + userId,
                HttpMethod.DELETE,
                new HttpEntity<>(defaultHeaders(token)),
                Void.class
        );
    }

    private HttpHeaders defaultHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        return headers;
    }
}