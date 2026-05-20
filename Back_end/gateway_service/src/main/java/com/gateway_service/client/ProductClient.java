package com.gateway_service.client;

import com.gateway_service.common.ApiResponse;
import com.gateway_service.config.ServiceEndpointsProperties;
import com.gateway_service.dto.product.InventoryUpdateRequest;
import com.gateway_service.dto.product.ProductCreationRequest;
import com.gateway_service.dto.product.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder; // Import quan trọng

import java.net.URI;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProductClient {

    private final RestTemplate restTemplate;
    private final ServiceEndpointsProperties endpointsProperties;

    public ProductResponse createProduct(ProductCreationRequest request, String token) {
        HttpHeaders headers = defaultHeaders(token);
        HttpEntity<ProductCreationRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<ProductResponse>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public List<ProductResponse> getAllProducts() {
        ResponseEntity<ApiResponse<List<ProductResponse>>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }

    public ProductResponse getProductByName(String name) {
        ResponseEntity<ApiResponse<ProductResponse>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products/name/" + name,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public ProductResponse decrementInventory(String productId, InventoryUpdateRequest request, String token) {
        return updateInventory(productId, "decrease", request, token);
    }

    public ProductResponse incrementInventory(String productId, InventoryUpdateRequest request, String token) {
        return updateInventory(productId, "increase", request, token);
    }

    private ProductResponse updateInventory(String productId, String action, InventoryUpdateRequest request, String token) {
        HttpHeaders headers = defaultHeaders(token);
        HttpEntity<InventoryUpdateRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<ProductResponse>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products/" + productId + "/inventory/" + action,
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    private HttpHeaders defaultHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null && !token.isBlank()) {
            headers.setBearerAuth(token);
        }
        return headers;
    }

    // [CẬP NHẬT] Cũng nên sửa đoạn này dùng UriComponentsBuilder để an toàn hơn
    public List<ProductResponse> getProductsByCategory(String categoryName) {
        URI uri = UriComponentsBuilder
                .fromHttpUrl(endpointsProperties.getProduct())
                .path("/products/category/{categoryName}")
                .buildAndExpand(categoryName)
                .toUri();

        ResponseEntity<ApiResponse<List<ProductResponse>>> response = restTemplate.exchange(
                uri,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }

    public List<String> getAllCategories() {
        ResponseEntity<ApiResponse<List<String>>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products/categories",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                }
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }

    public ProductResponse updateProduct(String productId, ProductCreationRequest request, String token) {
        HttpHeaders headers = defaultHeaders(token);
        HttpEntity<ProductCreationRequest> entity = new HttpEntity<>(request, headers);
        ResponseEntity<ApiResponse<ProductResponse>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products/" + productId,
                HttpMethod.PUT,
                entity,
                new ParameterizedTypeReference<>() {}
        );
        return response.getBody() != null ? response.getBody().getResult() : null;
    }

    public void deleteProduct(String productId, String token) {
        HttpHeaders headers = defaultHeaders(token);
        restTemplate.exchange(
                endpointsProperties.getProduct() + "/products/" + productId,
                HttpMethod.DELETE,
                new HttpEntity<>(headers),
                Void.class
        );
    }

    public List<ProductResponse> resetAllInventory(Integer quantity, String token) {
        HttpHeaders headers = defaultHeaders(token);
        InventoryUpdateRequest payload = InventoryUpdateRequest.builder()
                .quantity(quantity != null ? quantity : 100)
                .build();

        ResponseEntity<ApiResponse<List<ProductResponse>>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products/inventory/reset",
                HttpMethod.POST,
                new HttpEntity<>(payload, headers),
                new ParameterizedTypeReference<>() {}
        );

        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }
    public List<ProductResponse> importHighlands(String token) {
        HttpHeaders headers = defaultHeaders(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<ApiResponse<List<ProductResponse>>> response = restTemplate.exchange(
                endpointsProperties.getProduct() + "/products/import/highlands",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<>() {}
        );
        return response.getBody() != null ? response.getBody().getResult() : List.of();
    }
}