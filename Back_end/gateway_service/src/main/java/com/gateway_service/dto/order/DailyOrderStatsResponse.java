package com.gateway_service.dto.order;


import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DailyOrderStatsResponse {
    private LocalDate date;
    private BigDecimal totalAmount;
    private long orderCount;
}