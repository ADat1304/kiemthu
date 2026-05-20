package com.order_service.demo.repository;

import com.order_service.demo.entity.Orders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import com.order_service.demo.dto.response.TopProductResponse;
public interface OrderRepository extends JpaRepository<Orders,String> {
    @Override
    Optional<Orders> findById(String OrderId);
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Orders o WHERE o.orderDate >= :start AND o.orderDate < :end AND o.status = :status")
    BigDecimal sumTotalAmountByOrderDateBetweenAndStatus(@Param("start") LocalDateTime start,
                                                         @Param("end") LocalDateTime end,
                                                         @Param("status") String status);

    long countByOrderDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);

    @Query("SELECT new com.order_service.demo.dto.response.TopProductResponse(d.productId, d.productName, SUM(d.quantity)) " +
            "FROM OrderDetail d " +
            "GROUP BY d.productId, d.productName " +
            "ORDER BY SUM(d.quantity) DESC")
    List<TopProductResponse> findTopSellingProducts(Pageable pageable);
}
