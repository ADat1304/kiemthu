package com.order_service.demo.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    String orderId;
    LocalDateTime orderDate;
    BigDecimal totalAmount;
    String status;
    String tableId;
    String tableNumber;
    String paymentMethodId;
    String paymentMethodType;
    List<OrderItemResponse> items;
}
