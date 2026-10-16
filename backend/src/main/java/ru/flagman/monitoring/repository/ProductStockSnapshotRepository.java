package ru.flagman.monitoring.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.flagman.monitoring.model.ProductStockSnapshot;

import java.time.LocalDateTime;
import java.util.List;

public interface ProductStockSnapshotRepository extends JpaRepository<ProductStockSnapshot, Long> {
    List<ProductStockSnapshot> findTop8640ByProductIdOrderByTakenAtDesc(Long productId);

    @Query("select max(s.takenAt) from ProductStockSnapshot s where s.productId = :productId")
    LocalDateTime latestTimeByProductId(@Param("productId") Long productId);
}
