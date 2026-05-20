package com.order_service.demo.service;

import com.order_service.demo.common.exception.AppException;
import com.order_service.demo.common.exception.ErrorCode;
import com.order_service.demo.dto.request.OrderCreationRequest;
import com.order_service.demo.dto.request.OrderItemRequest;
import com.order_service.demo.dto.request.OrderStatusUpdateRequest;
import com.order_service.demo.dto.response.DailyOrderStatsResponse;
import com.order_service.demo.dto.response.OrderResponse;
import com.order_service.demo.dto.response.TopProductResponse;
import com.order_service.demo.entity.CafeTable;
import com.order_service.demo.entity.OrderDetail;
import com.order_service.demo.entity.Orders;
import com.order_service.demo.entity.PaymentMethod;
import com.order_service.demo.integration.product.ProductClient;
import com.order_service.demo.integration.product.ProductSummary;
import com.order_service.demo.mapper.OrderMapper;
import com.order_service.demo.repository.CafeTableRepository;
import com.order_service.demo.repository.OrderRepository;
import com.order_service.demo.repository.PaymentMethodRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {

    OrderRepository orderRepository;
    CafeTableRepository cafeTableRepository;
    PaymentMethodRepository paymentMethodRepository;
    OrderMapper orderMapper;
    ProductClient productClient;

    @Transactional
    public OrderResponse createOrder(OrderCreationRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException(ErrorCode.ORDER_ITEMS_EMPTY);
        }

        Orders order = new Orders();
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("OPEN");

        if (request.getTableNumber() != null) {
            CafeTable table = cafeTableRepository.findByTableNumber(request.getTableNumber())
                    .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));
            order.setTable(table);
            table.setStatus(1); // Cập nhật bàn thành Bận
        }

        if (request.getPaymentMethodType() != null) {
            PaymentMethod paymentMethod = paymentMethodRepository.findByPaymentMethodType(request.getPaymentMethodType())
                    .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_METHOD_NOT_FOUND));
            order.setPaymentMethod(paymentMethod);
        }

        List<OrderDetail> details = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest item : request.getItems()) {
            // 1. Lấy thông tin sản phẩm
            ProductSummary product = productClient.fetchProductByName(item.getProductName());

            // 2. [FIX QUAN TRỌNG] Gọi hàm giảm tồn kho
            // Nếu hết hàng, ProductClient mới (ở trên) sẽ ném ra PRODUCT_OUT_OF_STOCK
            productClient.decreaseInventory(product.getProductID(), item.getQuantity());

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .productId(product.getProductID())
                    .productName(product.getProductName())
                    .quantity(item.getQuantity())
                    .unitPrice(product.getPrice())
                    .notes(item.getNotes())
                    .build();
            details.add(detail);

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(lineTotal);
        }

        order.setOrderDetails(details);
        order.setTotalAmount(totalAmount);

        Orders savedOrder = orderRepository.save(order);
        return orderMapper.toOrderResponse(savedOrder);
    }
    @Transactional
    public OrderResponse updateStatus(String orderId, OrderStatusUpdateRequest request) {
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        String normalizedStatus = request.getStatus() == null ? null : request.getStatus().trim().toUpperCase();

        if (!"OPEN".equals(normalizedStatus) && !"CLOSE".equals(normalizedStatus)) {
            throw new AppException(ErrorCode.ORDER_STATUS_INVALID);
        }

        order.setStatus(normalizedStatus);

        CafeTable table = order.getTable();
        if (table != null) {
            if ("CLOSE".equals(normalizedStatus)) {
                table.setStatus(0);
            } else if ("OPEN".equals(normalizedStatus)) {
                table.setStatus(1);
            }
            cafeTableRepository.save(table);
        }

        Orders updatedOrder = orderRepository.save(order);
        return orderMapper.toOrderResponse(updatedOrder);
    }
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(orderMapper::toOrderResponse)
                .collect(Collectors.toList());
    }
    public DailyOrderStatsResponse getDailyStats(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime startOfNextDay = targetDate.plusDays(1).atStartOfDay();

        BigDecimal totalAmount = orderRepository.sumTotalAmountByOrderDateBetweenAndStatus(startOfDay,startOfNextDay,"CLOSE");
        long orderCount = orderRepository.countByOrderDateBetweenAndStatus(startOfDay, startOfNextDay,"CLOSE");

        return DailyOrderStatsResponse.builder()
                .date(targetDate)
                .totalAmount(totalAmount)
                .orderCount(orderCount)
                .build();
    }
    public List<PaymentMethod> getAllPaymentMethods() {
        return paymentMethodRepository.findAll();
    }
    public List<TopProductResponse> getTopSellingProducts(int limit) {
        return orderRepository.findTopSellingProducts(PageRequest.of(0, limit));
    }

    // Bổ sung hàm lấy doanh thu theo khoảng thời gian (Optional)
    public BigDecimal getRevenueBetween(LocalDate startDate, LocalDate endDate,String status) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();
        return orderRepository.sumTotalAmountByOrderDateBetweenAndStatus(start, end,status);
    }
    @Transactional
    public OrderResponse addItem(String orderId, OrderItemRequest request) {
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if ("CLOSE".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CLOSED);
        }

        ProductSummary product = productClient.fetchProductByName(request.getProductName());
        productClient.decreaseInventory(product.getProductID(), request.getQuantity());

        OrderDetail existingDetail = order.getOrderDetails().stream()
                .filter(d -> d.getProductId().equals(product.getProductID()))
                .findFirst()
                .orElse(null);

        if (existingDetail != null) {
            existingDetail.setQuantity(existingDetail.getQuantity() + request.getQuantity());
        } else {
            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .productId(product.getProductID())
                    .productName(product.getProductName())
                    .quantity(request.getQuantity())
                    .unitPrice(product.getPrice())
                    .notes(request.getNotes())
                    .build();
            order.getOrderDetails().add(detail);
        }

        order.setTotalAmount(recalculateTotal(order));

        Orders savedOrder = orderRepository.save(order);
        return orderMapper.toOrderResponse(savedOrder);
    }

    @Transactional
    public OrderResponse decreaseItemQuantity(String orderId, OrderItemRequest request) {
        Orders order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if ("CLOSE".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CLOSED);
        }

        ProductSummary product = productClient.fetchProductByName(request.getProductName());

        OrderDetail targetDetail = order.getOrderDetails().stream()
                .filter(d -> d.getProductId().equals(product.getProductID()))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));

        int removeQuantity = Math.min(request.getQuantity(), targetDetail.getQuantity());
        productClient.increaseInventory(product.getProductID(), removeQuantity);

        targetDetail.setQuantity(targetDetail.getQuantity() - removeQuantity);
        if (targetDetail.getQuantity() <= 0) {
            order.getOrderDetails().remove(targetDetail);
        }

        order.setTotalAmount(recalculateTotal(order));

        Orders savedOrder = orderRepository.save(order);
        return orderMapper.toOrderResponse(savedOrder);
    }

    private BigDecimal recalculateTotal(Orders order) {
        return order.getOrderDetails().stream()
                .map(detail -> detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}