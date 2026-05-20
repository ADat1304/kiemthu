package com.example.product_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "Product",
        indexes = {
                @Index(name = "idx_product_name", columnList = "productName"),
                @Index(name = "idx_product_category", columnList = "categoryID")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "productID", length = 36, nullable = false, updatable = false, columnDefinition = "VARCHAR(36)")
    String productID;

    @Column(name = "productName", nullable = false, length = 150)
    String productName;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    BigDecimal price = BigDecimal.ZERO;

    @Column(name = "amount", nullable = false)
    Integer amount = 0;

    // Many products -> one category (nullable = true as in schema ON DELETE SET NULL)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoryID", referencedColumnName = "categoryID",
            foreignKey = @ForeignKey(name = "fk_product_category"))
    Category category;

    // One product -> many images
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Image> images;

}

