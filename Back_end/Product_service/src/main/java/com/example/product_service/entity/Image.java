package com.example.product_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "Image")

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "imageID", length = 36, nullable = false, updatable = false)
    private String imageID;

    @Column(name = "imageLink", length = 512, nullable = false)
    String imageLink;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "productID", referencedColumnName = "productID",
            foreignKey = @ForeignKey(name = "fk_image_product"))
    Product product;
}
