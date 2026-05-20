package com.order_service.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "cafetable")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CafeTable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "tableID", length = 36, nullable = false, updatable = false, columnDefinition = "VARCHAR(36)")
    String tableID;

    @Column(name = "tableNumber", nullable = false, length = 20)
    String tableNumber;

    @Column(name = "status", nullable = false)
    Integer status = 0;
}
