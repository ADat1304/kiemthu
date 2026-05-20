package com.gateway_service.controller;


import com.gateway_service.client.ProductClient;
import com.gateway_service.dto.product.InventoryUpdateRequest;
import com.gateway_service.dto.product.ProductCreationRequest;
import com.gateway_service.dto.product.ProductResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/esb/products")
@RequiredArgsConstructor
public class EsbProductController {

    private final ProductClient productClient;
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @RequestBody ProductCreationRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(productClient.createProduct(request, token));
    }
    @GetMapping
    public ResponseEntity<List<ProductResponse>> listProducts() {
        return ResponseEntity.ok(productClient.getAllProducts());
    }
    @GetMapping("/category/{categoryName}")
    public ResponseEntity<List<ProductResponse>> getByCategory(@PathVariable String categoryName) {
        return ResponseEntity.ok(productClient.getProductsByCategory(categoryName));
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<ProductResponse> getByName(@PathVariable String name) {
        return ResponseEntity.ok(productClient.getProductByName(name));
    }

    @PostMapping("/{productId}/inventory/decrease")
    public ResponseEntity<ProductResponse> decrementInventory(
            @PathVariable String productId,
            @RequestBody InventoryUpdateRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(productClient.decrementInventory(productId, request, token));
    }

    @PostMapping("/{productId}/inventory/increase")
    public ResponseEntity<ProductResponse> incrementInventory(
            @PathVariable String productId,
            @RequestBody InventoryUpdateRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(productClient.incrementInventory(productId, request, token));
    }
    @PostMapping("/inventory/reset")
    public ResponseEntity<List<ProductResponse>> resetAllInventory(
            @RequestBody(required = false) InventoryUpdateRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        Integer quantity = request != null ? request.getQuantity() : null;
        return ResponseEntity.ok(productClient.resetAllInventory(quantity, token));
    }
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(productClient.getAllCategories());
    }
    // [THÊM MỚI] Endpoint Sửa
    @PutMapping("/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable String productId,
            @RequestBody ProductCreationRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(productClient.updateProduct(productId, request, token));
    }

    // [THÊM MỚI] Endpoint Xóa
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String productId,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        productClient.deleteProduct(productId, token);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/import/highlands")
    public ResponseEntity<List<ProductResponse>> importHighlands(
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(productClient.importHighlands(token));
    }
}