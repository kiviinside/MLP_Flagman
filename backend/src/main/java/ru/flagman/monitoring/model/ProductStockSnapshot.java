package ru.flagman.monitoring.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_stock_snapshots", indexes = {
        @Index(name = "idx_product_stock_snapshot_product_time", columnList = "product_id, taken_at")
})
@Getter
@Setter
@NoArgsConstructor
public class ProductStockSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "taken_at", nullable = false)
    private LocalDateTime takenAt;

    @Column(name = "total_quantity", nullable = false, precision = 19, scale = 3)
    private BigDecimal totalQuantity;

    public ProductStockSnapshot(Long productId, LocalDateTime takenAt, BigDecimal totalQuantity) {
        this.productId = productId;
        this.takenAt = takenAt;
        this.totalQuantity = totalQuantity;
    }
}
