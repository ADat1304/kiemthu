package com.order_service.demo.mapper;

import com.order_service.demo.dto.response.OrderItemResponse;
import com.order_service.demo.dto.response.OrderResponse;
import com.order_service.demo.entity.OrderDetail;
import com.order_service.demo.entity.Orders;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "orderId", source = "orderID")
    @Mapping(target = "tableId", source = "table.tableID")
    @Mapping(target = "tableNumber", source = "table.tableNumber")
    @Mapping(target = "paymentMethodId", source = "paymentMethod.paymentMethodID")
    @Mapping(target = "paymentMethodType", source = "paymentMethod.paymentMethodType")
    @Mapping(target = "items", source = "orderDetails", qualifiedByName = "mapOrderItems")
    OrderResponse toOrderResponse(Orders order);

    @Named("mapOrderItems")
    default List<OrderItemResponse> mapOrderItems(List<OrderDetail> orderDetails) {
        if (Objects.isNull(orderDetails)) {
            return Collections.emptyList();
        }
        return orderDetails.stream()
                .map(this::toOrderItemResponse)
                .collect(Collectors.toList());
    }

    @Mapping(target = "productId", source = "productId")
    @Mapping(target = "productName", source = "productName")
    @Mapping(target = "lineTotal", expression = "java(calculateLineTotal(detail))")
    OrderItemResponse toOrderItemResponse(OrderDetail detail);

    default BigDecimal calculateLineTotal(OrderDetail detail) {
        if (Objects.isNull(detail.getUnitPrice()) || Objects.isNull(detail.getQuantity())) {
            return BigDecimal.ZERO;
        }
        return detail.getUnitPrice().multiply(BigDecimal.valueOf(detail.getQuantity()));
    }
}