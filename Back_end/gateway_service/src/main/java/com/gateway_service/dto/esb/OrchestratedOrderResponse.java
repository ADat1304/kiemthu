package com.gateway_service.dto.esb;


import com.gateway_service.dto.order.OrderResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrchestratedOrderResponse {
    private String requestedBy;
    private OrderResponse order;
    private List<ProductSummary> products;
}
