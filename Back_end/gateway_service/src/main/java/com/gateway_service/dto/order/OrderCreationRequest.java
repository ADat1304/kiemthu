package com.gateway_service.dto.order;


import lombok.Data;

import java.util.List;

@Data
public class OrderCreationRequest {
    private String tableNumber;
    private String paymentMethodType;
    private List<OrderItemRequest> items;
}