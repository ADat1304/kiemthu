package com.order_service.demo.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;

@Value
@Builder
public class DailyOrderStatsResponse {
    LocalDate date;
    BigDecimal totalAmount;
    long orderCount;
}