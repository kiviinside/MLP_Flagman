package ru.flagman.monitoring.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.flagman.monitoring.dto.WriteOffStatDto;
import ru.flagman.monitoring.model.WriteOffLog;

import java.time.LocalDateTime;
import java.util.List;

public interface WriteOffLogRepository extends JpaRepository<WriteOffLog, Long> {

    List<WriteOffLog> findAllByOrderByWriteOffDateAsc();

    @Query("""
            select new ru.flagman.monitoring.dto.WriteOffStatDto(p.name, p.unit, l.reason, sum(l.quantity))
            from WriteOffLog l join l.batch b join b.product p
            where l.writeOffDate between :from and :to
            group by p.name, p.unit, l.reason
            order by sum(l.quantity) desc""")
    List<WriteOffStatDto> stats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
