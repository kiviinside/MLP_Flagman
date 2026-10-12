package ru.flagman.monitoring.dto;

import java.util.List;

/** Payload SSE-события "stock-update". */
public record StockUpdateDto(List<StopListItemDto> stopList, List<HotOfferDto> hotOffers, List<StockSummaryDto> summary) { }
