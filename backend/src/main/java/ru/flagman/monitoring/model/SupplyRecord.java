package ru.flagman.monitoring.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="supply_records", indexes=@Index(name="idx_supply_records_created", columnList="created_at"))
@Getter @Setter @NoArgsConstructor
public class SupplyRecord {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="supply_id", nullable=false, unique=true) private String supplyId;
    @Column(nullable=false) private String supplier;
    @Column(name="created_at", nullable=false) private LocalDateTime createdAt;
    @Column(name="total_amount", nullable=false, precision=19, scale=2) private BigDecimal totalAmount=BigDecimal.ZERO;
    @Column(nullable=false) private String status="RECEIVED";
}
