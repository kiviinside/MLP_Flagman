package ru.flagman.monitoring.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import ru.flagman.monitoring.model.StockSnapshot;
import java.time.LocalDateTime;
import java.util.List;
public interface StockSnapshotRepository extends JpaRepository<StockSnapshot, Long> {
 List<StockSnapshot> findTop288ByOrderByTakenAtDesc();
 @Query("select max(s.takenAt) from StockSnapshot s") LocalDateTime latestTime();
}
