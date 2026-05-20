package com.example.product_service.Controller;


import com.example.product_service.common.ApiResponse;
import com.example.product_service.dto.request.InventoryUpdateRequest;
import com.example.product_service.dto.request.ProductCreationRequest;
import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.service.ProductService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Objects;

@Slf4j
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductController {

    ProductService productService;

    @PostMapping
//    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody ProductCreationRequest request) {
        ProductResponse productResponse = productService.createProduct(request);
        return ApiResponse.<ProductResponse>builder()
                .result(productResponse)
                .build();
    }
    @GetMapping("/category/{categoryName}")
    public ApiResponse<List<ProductResponse>> getByCategory(@PathVariable String categoryName) {
        List<ProductResponse> products = productService.getProductsByCategory(categoryName);
        return ApiResponse.<List<ProductResponse>>builder()
                .result(products)
                .build();
    }

    @GetMapping
    public ApiResponse<List<ProductResponse>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ApiResponse.<List<ProductResponse>>builder()
                .result(products)
                .build();
    }

    @GetMapping("/name/{productName}")
    public ApiResponse<ProductResponse> getByName(@PathVariable String productName) {
        ProductResponse product = productService.getProductByName(productName);
        return ApiResponse.<ProductResponse>builder()
                .result(product)
                .build();
    }

    @PostMapping("/{productId}/inventory/decrease")
    public ApiResponse<ProductResponse> decrementInventory(@PathVariable String productId,  @Valid @RequestBody InventoryUpdateRequest request) {

        ProductResponse product = productService.decrementInventory(productId, request);
        return ApiResponse.<ProductResponse>builder()
                .result(product)
                .build();
    }

    @PostMapping("/{productId}/inventory/increase")
    public ApiResponse<ProductResponse> incrementInventory(@PathVariable String productId, @Valid @RequestBody InventoryUpdateRequest request) {

        ProductResponse product = productService.incrementInventory(productId, request);
        return ApiResponse.<ProductResponse>builder()
                .result(product)
                .build();
    }
    @PostMapping("/inventory/reset")
    public ApiResponse<List<ProductResponse>> resetInventory(@RequestBody(required = false) InventoryUpdateRequest request) {
        int quantity = Objects.nonNull(request) ? request.getQuantity() : 100;
        return ApiResponse.<List<ProductResponse>>builder()
                .result(productService.resetAllInventoryTo(quantity))
                .build();
    }
    @GetMapping("/categories")
    public ApiResponse<List<String>> getAllCategories() {
        return ApiResponse.<List<String>>builder()
                .result(productService.getAllCategoryNames())
                .build();
    }
    @PostMapping("/import/highlands")
    public ApiResponse<List<ProductResponse>> importHighlandsCoffeeMenu() {
        return ApiResponse.<List<ProductResponse>>builder()
                .result(productService.importHighlandsCoffeeMenu())
                .build();
    }
    // [THÊM MỚI] API Sửa
    @PutMapping("/{productId}")
    public ApiResponse<ProductResponse> updateProduct(@PathVariable String productId, @Valid @RequestBody ProductCreationRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .result(productService.updateProduct(productId, request))
                .build();
    }

    // [THÊM MỚI] API Xóa
    @DeleteMapping("/{productId}")
    public ApiResponse<String> deleteProduct(@PathVariable String productId) {
        productService.deleteProduct(productId);
        return ApiResponse.<String>builder()
                .result("Product has been deleted")
                .build();
    }
}
