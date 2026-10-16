package ru.flagman.monitoring.controller;
import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import ru.flagman.monitoring.service.StockTrendService; import java.util.List; import java.util.Map;
@RestController @RequestMapping("/api/warehouse") @RequiredArgsConstructor
public class StockTrendController { private final StockTrendService trends;
 @GetMapping("/stock-trend") public List<Map<String,Object>> history(){ trends.capture(); return trends.history(); }
}
