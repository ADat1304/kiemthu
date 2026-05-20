package com.order_service.demo.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "PaymentMethod")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "paymentMethodID", length = 36, nullable = false, updatable = false, columnDefinition = "VARCHAR(36)")
    String paymentMethodID;

    @Column(name = "paymentMethodType", nullable = false, length = 50)
    String paymentMethodType;
}
