package com.order_service.demo.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemResponse {
    String productId;
    String productName;
    Integer quantity;
    BigDecimal unitPrice;
    BigDecimal lineTotal;
    String notes;
}
