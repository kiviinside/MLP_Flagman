package ru.flagman.monitoring.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.flagman.monitoring.model.Batch;

import java.time.LocalDateTime;
import java.util.List;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    /** Живые партии продукта в порядке FIFO (раньше истекает — раньше уходит) с блокировкой строк. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select b from Batch b
            where b.product.id = :pid and b.remainingQuantity > 0 and b.expirationDate > :now
            order by b.expirationDate asc, b.supplyDate asc, b.id asc""")
    List<Batch> lockFifo(@Param("pid") Long productId, @Param("now") LocalDateTime now);

    /** Суммарный доступный (не просроченный) остаток по всем продуктам. */
    @Query("""
            select b.product.id, sum(b.remainingQuantity) from Batch b
            where b.remainingQuantity > 0 and b.expirationDate > :now
            group by b.product.id""")
    List<Object[]> sumByProduct(@Param("now") LocalDateTime now);

    /** Партии с остатком, срок которых наступает до :until (включая уже просроченные). */
    @Query("""
            select b from Batch b join fetch b.product
            where b.remainingQuantity > 0 and b.expirationDate <= :until
            order by b.expirationDate asc""")
    List<Batch> findActiveExpiringBefore(@Param("until") LocalDateTime until);

    @Query("""
            select b from Batch b join fetch b.product
            where b.remainingQuantity > 0
            order by b.expirationDate asc, b.id asc""")
    List<Batch> findAllActive();
}
