package ru.flagman.monitoring.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.flagman.monitoring.model.Dish;

import java.util.Collection;
import java.util.List;

public interface DishRepository extends JpaRepository<Dish, Long> {

    @Query("""
            select distinct d from Dish d
            left join fetch d.recipeItems ri
            left join fetch ri.product""")
    List<Dish> findAllWithRecipe();

    @Query("""
            select distinct d from Dish d
            left join fetch d.recipeItems ri
            left join fetch ri.product
            where d.id in :ids""")
    List<Dish> findAllWithRecipeByIds(@Param("ids") Collection<Long> ids);
}
