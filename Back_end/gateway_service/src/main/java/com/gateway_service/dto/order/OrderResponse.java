package com.gateway_service.dto.order;


import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private String orderId;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private String status;
    private String tableId;
    private String tableNumber;
    private String paymentMethodId;
    private String paymentMethodType;
    private List<OrderItemResponse> items;
}