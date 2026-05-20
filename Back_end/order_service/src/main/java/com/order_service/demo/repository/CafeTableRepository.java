package com.order_service.demo.repository;

import com.order_service.demo.entity.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CafeTableRepository extends JpaRepository<CafeTable, String> {
    Optional<CafeTable> findByTableNumber(String tableNumber);
}