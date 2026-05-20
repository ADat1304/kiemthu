package com.gateway_service.controller;

import com.gateway_service.client.OrderClient;
import com.gateway_service.dto.esb.OrchestratedOrderResponse;
import com.gateway_service.dto.order.*;
import com.gateway_service.service.OrderOrchestrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/esb/orders")
@RequiredArgsConstructor
public class EsbOrderController {

    private final OrderOrchestrationService orchestrationService;
    private final OrderClient orderClient;

    @PostMapping
    public ResponseEntity<OrchestratedOrderResponse> createOrder(
            @RequestHeader(name = "Authorization") String authorization,
            @RequestBody OrderCreationRequest request
    ) {
        String token = authorization.replace("Bearer ", "");
        OrchestratedOrderResponse response = orchestrationService.orchestrateOrder(token, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> listOrders(
            @RequestHeader(name = "Authorization") String authorization
    ) {
        String token = authorization.replace("Bearer ", "");
        return ResponseEntity.ok(orderClient.getAllOrders(token));
    }
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable String orderId,
            @RequestHeader(name = "Authorization") String authorization,
            @RequestBody OrderStatusUpdateRequest request
    ) {
        String token = authorization.replace("Bearer ", "");
        return ResponseEntity.ok(orderClient.updateStatus(orderId, request, token));
    }
    @GetMapping("/daily-stats")
    public ResponseEntity<DailyOrderStatsResponse> getDailyStats(
            @RequestHeader(name = "Authorization") String authorization,
            @RequestParam(value = "date", required = false) String date
    ) {
        String token = authorization.replace("Bearer ", "");
        return ResponseEntity.ok(orderClient.getDailyStats(date, token));
    }
    @GetMapping("/payment-methods")
    public ResponseEntity<List<Object>> getPaymentMethods(
            @RequestHeader(name = "Authorization") String authorization
    ) {
        String token = authorization.replace("Bearer ", "");
        return ResponseEntity.ok(orderClient.getPaymentMethods(token));
    }
    @GetMapping("/top-selling")
    public ResponseEntity<List<TopProductResponse>> getTopSelling(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "5") int limit
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(orderClient.getTopSelling(limit, token));
    }

    @GetMapping("/revenue")
    public ResponseEntity<BigDecimal> getRevenue(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam String startDate,
            @RequestParam String endDate
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(orderClient.getRevenue(startDate, endDate, token));
    }
    @PostMapping("/{orderId}/items")
    public ResponseEntity<OrderResponse> addItem(
            @PathVariable String orderId,
            @RequestHeader(name = "Authorization") String authorization,
            @RequestBody OrderItemRequest request
    ) {
        String token = authorization.replace("Bearer ", "");
        return ResponseEntity.ok(orderClient.addItem(orderId, request, token));
    }

    @PostMapping("/{orderId}/items/decrease")
    public ResponseEntity<OrderResponse> decreaseItem(
            @PathVariable String orderId,
            @RequestHeader(name = "Authorization") String authorization,
            @RequestBody OrderItemRequest request
    ) {
        String token = authorization.replace("Bearer ", "");
        return ResponseEntity.ok(orderClient.decreaseItem(orderId, request, token));
    }

    @RequestMapping(value = "/{orderId}/items", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> handleItemsPreflight() {
        return ResponseEntity.ok().build();
    }

    @RequestMapping(value = "/{orderId}/items/decrease", method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> handleItemsDecreasePreflight() {
        return ResponseEntity.ok().build();
    }
}
