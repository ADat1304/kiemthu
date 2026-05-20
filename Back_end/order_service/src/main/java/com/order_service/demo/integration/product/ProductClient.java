package com.order_service.demo.integration.product;

import com.order_service.demo.common.ApiResponse;
import com.order_service.demo.common.exception.AppException;
import com.order_service.demo.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductClient {

    private final RestTemplate restTemplate;

    @Value("${services.product.url:http://localhost:8082}")
    private String productServiceUrl;

    public ProductSummary fetchProductByName(String productName) {
        // [FIX] Sử dụng buildAndExpand để Spring tự xử lý encode đúng chuẩn 1 lần duy nhất
        String url = UriComponentsBuilder.fromHttpUrl(productServiceUrl)
                .path("/products/name/{name}") // Sử dụng placeholder
                .buildAndExpand(productName)   // Điền giá trị vào placeholder
                .toUriString();

        try {
            ResponseEntity<ApiResponse<ProductSummary>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<ApiResponse<ProductSummary>>() {}
            );

            if (response.getBody() == null || response.getBody().getResult() == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            return response.getBody().getResult();

        } catch (HttpClientErrorException ex) {
            log.error("Product service error fetching {}: {}", productName, ex.getResponseBodyAsString());
            // Kiểm tra mã lỗi từ Product Service trả về
            if (ex.getResponseBodyAsString().contains("1007") || ex.getStatusCode().value() == 404) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            throw new AppException(ErrorCode.PRODUCT_SERVICE_UNAVAILABLE);
        } catch (RestClientException ex) {
            log.error("Connection error fetching product {}", productName, ex);
            throw new AppException(ErrorCode.PRODUCT_SERVICE_UNAVAILABLE);
        }
    }

    public void decreaseInventory(String productId, int quantity) {
        // [FIX] Cũng nên dùng buildAndExpand cho đồng bộ, dù ID thường không có ký tự đặc biệt
        String url = UriComponentsBuilder.fromHttpUrl(productServiceUrl)
                .path("/products/{id}/inventory/decrease")
                .buildAndExpand(productId)
                .toUriString();

        try {
            HttpEntity<InventoryUpdateRequest> request = new HttpEntity<>(new InventoryUpdateRequest(quantity));
            restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<ApiResponse<ProductSummary>>() {}
            );
        } catch (HttpClientErrorException ex) {
            String responseBody = ex.getResponseBodyAsString();
            log.error("Failed to decrease inventory: {}", responseBody);

            if (responseBody.contains("1008")) { // PRODUCT_OUT_OF_STOCK
                throw new AppException(ErrorCode.PRODUCT_OUT_OF_STOCK);
            }
            if (responseBody.contains("1007")) { // PRODUCT_NOT_FOUND
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            throw new AppException(ErrorCode.PRODUCT_SERVICE_UNAVAILABLE);
        } catch (RestClientException ex) {
            log.error("Service unavailable when updating inventory for {}", productId, ex);
            throw new AppException(ErrorCode.PRODUCT_SERVICE_UNAVAILABLE);
        }
    }
    public void increaseInventory(String productId, int quantity) {
        String url = UriComponentsBuilder.fromHttpUrl(productServiceUrl)
                .path("/products/{id}/inventory/increase")
                .buildAndExpand(productId)
                .toUriString();

        try {
            HttpEntity<InventoryUpdateRequest> request = new HttpEntity<>(new InventoryUpdateRequest(quantity));
            restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<ApiResponse<ProductSummary>>() {}
            );
        } catch (HttpClientErrorException ex) {
            String responseBody = ex.getResponseBodyAsString();
            log.error("Failed to increase inventory: {}", responseBody);

            if (responseBody.contains("1007")) { // PRODUCT_NOT_FOUND
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            throw new AppException(ErrorCode.PRODUCT_SERVICE_UNAVAILABLE);
        } catch (RestClientException ex) {
            log.error("Service unavailable when updating inventory for {}", productId, ex);
            throw new AppException(ErrorCode.PRODUCT_SERVICE_UNAVAILABLE);
        }
    }

}