package ru.flagman.monitoring.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "write_off_logs", indexes = @Index(name = "idx_wol_date", columnList = "write_off_date"))
@Getter @Setter @NoArgsConstructor
public class WriteOffLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Batch batch;

    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false)
    private LocalDateTime writeOffDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WriteOffReason reason;

    public WriteOffLog(Batch batch, BigDecimal quantity, LocalDateTime date, WriteOffReason reason) {
        this.batch = batch;
        this.quantity = quantity;
        this.writeOffDate = date;
        this.reason = reason;
    }
}
