package com.gateway_service.dto.esb;


import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ProductSummary {
    private String productId;
    private String productName;
    private BigDecimal price;
    private Integer availableAmount;
    private List<String> images;
}