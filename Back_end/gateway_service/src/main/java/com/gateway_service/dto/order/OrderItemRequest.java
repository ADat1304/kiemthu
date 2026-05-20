package com.gateway_service.dto.order;

import lombok.Data;

@Data
public class OrderItemRequest {
    private String productName;
    private Integer quantity;
    private String notes;
}