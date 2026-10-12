package ru.flagman.monitoring.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.flagman.monitoring.dto.CatalogDtos.*;
import ru.flagman.monitoring.service.CatalogService;

import java.util.List;

/** Номенклатура и техкарты — только ROLE_ADMIN. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminCatalogController {
    private final CatalogService catalogService;

    @GetMapping("/products")
    public List<ProductDto> products() { return catalogService.products(); }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDto createProduct(@Valid @RequestBody ProductRequest r) { return catalogService.createProduct(r); }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) { catalogService.deleteProduct(id); }

    @GetMapping("/dishes")
    public List<DishDto> dishes() { return catalogService.dishes(); }

    @PostMapping("/dishes")
    @ResponseStatus(HttpStatus.CREATED)
    public DishDto createDish(@Valid @RequestBody DishRequest r) { return catalogService.createDish(r); }
}
