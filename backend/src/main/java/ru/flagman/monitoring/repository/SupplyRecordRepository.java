package ru.flagman.monitoring.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import ru.flagman.monitoring.model.SupplyRecord;
import java.util.Optional;
public interface SupplyRecordRepository extends JpaRepository<SupplyRecord, Long> {
 Optional<SupplyRecord> findBySupplyId(String supplyId);
}
