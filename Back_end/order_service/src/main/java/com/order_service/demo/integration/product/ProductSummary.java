package com.order_service.demo.integration.product;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductSummary {
    private String productID;
    private String productName;
    private BigDecimal price;
    private Integer amount;
}
