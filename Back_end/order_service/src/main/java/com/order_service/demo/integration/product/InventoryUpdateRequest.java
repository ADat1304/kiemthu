package com.order_service.demo.integration.product;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InventoryUpdateRequest {
    private Integer quantity;
}