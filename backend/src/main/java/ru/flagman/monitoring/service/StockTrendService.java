package ru.flagman.monitoring.service;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.model.StockSnapshot;
import ru.flagman.monitoring.repository.StockSnapshotRepository;
import ru.flagman.monitoring.repository.BatchRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
@Service @RequiredArgsConstructor
public class StockTrendService {
 private final WarehouseService warehouseService; private final BatchRepository batches; private final StockSnapshotRepository snapshots;
 @Scheduled(fixedDelayString="${app.stock-trend.interval-ms:300000}", initialDelayString="${app.stock-trend.initial-delay-ms:10000}")
 @Transactional
 public void capture() {
  LocalDateTime now=LocalDateTime.now(); LocalDateTime last=snapshots.latestTime();
  if(last!=null && last.isAfter(now.minusMinutes(4))) return;
  BigDecimal total=warehouseService.summary().stream().map(x->x.available()).reduce(BigDecimal.ZERO, BigDecimal::add);
  BigDecimal expiring=BigDecimal.ZERO, expired=BigDecimal.ZERO;
  for(var b:batches.findAllActive()) { if(b.getExpirationDate().isBefore(now)) expired=expired.add(b.getRemainingQuantity()); else if(!b.getExpirationDate().isAfter(now.plusHours(48))) expiring=expiring.add(b.getRemainingQuantity()); }
  snapshots.save(new StockSnapshot(now,total,expiring,expired));
  List<StockSnapshot> all=snapshots.findAll(); if(all.size()>288) snapshots.deleteAll(all.subList(0,all.size()-288));
 }
 @Transactional(readOnly=true) public List<Map<String,Object>> history() {
  List<StockSnapshot> rows=new ArrayList<>(snapshots.findTop288ByOrderByTakenAtDesc()); Collections.reverse(rows);
  return rows.stream().map(s->{Map<String,Object> m=new LinkedHashMap<>();m.put("timestamp",s.getTakenAt());m.put("totalQuantity",s.getTotalQuantity());m.put("expiringQuantity",s.getExpiringQuantity());m.put("expiredQuantity",s.getExpiredQuantity());return m;}).toList();
 }
}
