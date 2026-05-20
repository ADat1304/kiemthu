package com.gateway_service.client;


import com.gateway_service.common.ApiResponse;
import com.gateway_service.config.ServiceEndpointsProperties;
import com.gateway_service.dto.table.CafeTableResponse;
import com.gateway_service.dto.table.TableStatusUpdateRequest;
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
public class TableClient {

    private final RestTemplate restTemplate;
    private final ServiceEndpointsProperties endpointsProperties;

    public List<CafeTableResponse> getAllTables(String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }

        ResponseEntity<ApiResponse<List<CafeTableResponse>>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/tables",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {
                }
        );

        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }

    public CafeTableResponse updateTableStatus(String tableNumber, Integer status, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }

        TableStatusUpdateRequest request = TableStatusUpdateRequest.builder()
                .status(status)
                .build();

        ResponseEntity<ApiResponse<CafeTableResponse>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/tables/" + tableNumber + "/status",
                HttpMethod.PATCH,
                new HttpEntity<>(request, headers),
                new ParameterizedTypeReference<>() {
                }
        );

        return response.getBody() != null ? response.getBody().getResult() : null;
    }
}