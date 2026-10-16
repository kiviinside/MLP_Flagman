package ru.flagman.monitoring.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="stock_snapshots", indexes=@Index(name="idx_stock_snapshot_taken_at", columnList="taken_at"))
@Getter @Setter @NoArgsConstructor
public class StockSnapshot {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="taken_at", nullable=false) private LocalDateTime takenAt;
 @Column(name="total_quantity", nullable=false, precision=19, scale=3) private BigDecimal totalQuantity;
 @Column(name="expiring_quantity", nullable=false, precision=19, scale=3) private BigDecimal expiringQuantity;
 @Column(name="expired_quantity", nullable=false, precision=19, scale=3) private BigDecimal expiredQuantity;
 public StockSnapshot(LocalDateTime at, BigDecimal total, BigDecimal expiring, BigDecimal expired) { this.takenAt=at; this.totalQuantity=total; this.expiringQuantity=expiring; this.expiredQuantity=expired; }
}
