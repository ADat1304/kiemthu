package com.example.product_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Entity
@Table(name = "category",
        indexes = {
                @Index(name = "idx_category_name", columnList = "categoryName")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "categoryID", length = 36, nullable = false, updatable = false)
    String categoryID;

    @Column(name = "categoryName", nullable = false, length = 100)
    String categoryName;

    @OneToMany(mappedBy = "category")
    Set<Product> products;
}

