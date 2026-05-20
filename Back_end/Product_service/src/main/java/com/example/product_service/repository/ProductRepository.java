package com.example.product_service.repository;

import com.example.product_service.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    boolean existsByProductName(String productName);

    List<Product> findByCategory_CategoryNameIgnoreCase(String categoryName);
    Optional<Product> findByProductName(String productName);
}