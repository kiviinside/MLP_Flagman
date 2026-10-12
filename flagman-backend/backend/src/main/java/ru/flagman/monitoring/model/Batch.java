package ru.flagman.monitoring.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "batches", indexes = {
        @Index(name = "idx_batch_product_exp", columnList = "product_id, expiration_date")
})
@Getter @Setter @NoArgsConstructor
public class Batch {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** номер / ID поставки */
    @Column(nullable = false)
    private String supplyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal remainingQuantity;

    @Column(nullable = false)
    private LocalDateTime supplyDate;

    @Column(nullable = false)
    private LocalDateTime expirationDate;
}
