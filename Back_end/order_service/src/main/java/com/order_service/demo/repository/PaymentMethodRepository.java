package com.order_service.demo.repository;

import com.order_service.demo.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, String> {
    Optional<PaymentMethod> findByPaymentMethodType(String paymentMethodType);
}
