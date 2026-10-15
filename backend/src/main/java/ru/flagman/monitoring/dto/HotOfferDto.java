package ru.flagman.monitoring.dto;

import java.math.BigDecimal;
import java.util.List;

public record HotOfferDto(Long dishId, String dishName, BigDecimal price, double score,
                          int recommendedDiscountPercent, List<String> reasons) { }
