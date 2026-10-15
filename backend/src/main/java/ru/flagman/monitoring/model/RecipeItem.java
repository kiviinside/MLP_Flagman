package ru.flagman.monitoring.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "recipe_items")
@Getter @Setter @NoArgsConstructor
public class RecipeItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Dish dish;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;

    /** расход продукта на 1 порцию (в единицах Product.unit) */
    @Column(nullable = false, precision = 19, scale = 3)
    private BigDecimal requiredQuantity;
}
