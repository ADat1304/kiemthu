package com.order_service.demo.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Orders {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "orderID", length = 36, nullable = false, updatable = false, columnDefinition = "VARCHAR(36)")
    String orderID;

    @Column(name = "orderDate", nullable = false)
    LocalDateTime orderDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tableID", referencedColumnName = "tableID", foreignKey = @ForeignKey(name = "fk_orders_table"))
    CafeTable table;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paymentMethodID", referencedColumnName = "paymentMethodID", foreignKey = @ForeignKey(name = "fk_orders_payment_method"))
    PaymentMethod paymentMethod;

    @Column(name = "totalAmount", nullable = false, precision = 12, scale = 2)
    BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "status", nullable = false, length = 30)
    String status = "OPEN";

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    List<OrderDetail> orderDetails = new ArrayList<>();
}