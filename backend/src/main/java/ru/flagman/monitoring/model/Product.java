package ru.flagman.monitoring.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    /** кг, шт, л ... */
    @Column(nullable = false)
    private String unit;

    /** минимальный остаток, ниже которого нужно предупреждение / заказ поставки */
    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal minThreshold = BigDecimal.ZERO;

    /** Срок хранения по умолчанию (часы). Нужен для авторасчёта expirationDate партии. */
    private Integer shelfLifeHours;
}
