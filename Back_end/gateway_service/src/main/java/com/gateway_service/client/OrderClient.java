package com.gateway_service.client;


import com.gateway_service.common.ApiResponse;
import com.gateway_service.config.ServiceEndpointsProperties;
import com.gateway_service.dto.order.*;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OrderClient {

    private final RestTemplate restTemplate;
    private final ServiceEndpointsProperties endpointsProperties;

    public OrderResponse createOrder(OrderCreationRequest request, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        HttpEntity<OrderCreationRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<OrderResponse>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/orders",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public List<OrderResponse> getAllOrders(String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        ResponseEntity<ApiResponse<List<OrderResponse>>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/orders",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }

    public OrderResponse addItem(String orderId, OrderItemRequest request, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        HttpEntity<OrderItemRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<OrderResponse>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/orders/" + orderId + "/items",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public OrderResponse decreaseItem(String orderId, OrderItemRequest request, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        HttpEntity<OrderItemRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<OrderResponse>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/orders/" + orderId + "/items/decrease",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }
    public OrderResponse updateStatus(String orderId, OrderStatusUpdateRequest request, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        HttpEntity<OrderStatusUpdateRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<OrderResponse>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/orders/" + orderId + "/status",
                HttpMethod.PATCH,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public DailyOrderStatsResponse getDailyStats(String date, String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }

        String url = UriComponentsBuilder
                .fromHttpUrl(endpointsProperties.getOrder() + "/orders/daily-stats")
                .queryParamIfPresent("date", date == null || date.isBlank() ? Optional.empty() : Optional.of(date))
                .toUriString();

        ResponseEntity<ApiResponse<DailyOrderStatsResponse>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }
    public List<Object> getPaymentMethods(String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        ResponseEntity<ApiResponse<List<Object>>> response = restTemplate.exchange(
                endpointsProperties.getOrder() + "/orders/payment-methods",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }
    public List<TopProductResponse> getTopSelling(int limit, String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }

        String url = UriComponentsBuilder
                .fromHttpUrl(endpointsProperties.getOrder() + "/orders/top-selling")
                .queryParam("limit", limit)
                .toUriString();

        ResponseEntity<ApiResponse<List<TopProductResponse>>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }

    public BigDecimal getRevenue(String startDate, String endDate, String token) {
        HttpHeaders headers = new HttpHeaders();
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }

        String url = UriComponentsBuilder
                .fromHttpUrl(endpointsProperties.getOrder() + "/orders/revenue")
                .queryParam("startDate", startDate)
                .queryParam("endDate", endDate)
                .toUriString();

        ResponseEntity<ApiResponse<BigDecimal>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<>() {}
        );
        return response.getBody() != null ? response.getBody().getResult() : BigDecimal.ZERO;
    }
}
