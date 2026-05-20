package com.gateway_service.dto.product;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductResponse {
    private String productID;
    private String productName;
    private BigDecimal price;
    private Integer amount;
    private String categoryName;
    private List<String> images;
}