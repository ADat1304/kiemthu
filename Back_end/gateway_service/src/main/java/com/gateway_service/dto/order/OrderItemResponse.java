package com.gateway_service.dto.order;


import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemResponse {
    private String productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private String notes;
}