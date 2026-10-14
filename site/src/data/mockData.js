// Каталог блюд, перенесённый из исходного проекта. Это базовое меню ресторана,
// а не демонстрационные заказы или складские остатки.
export const products = [];
export const initialOrders = [];
export const initialSupplies = [];
export const dishes = [
  {
    id: 'dish-caesar', name: 'Цезарь с курицей', image: '/images/cezar.jpg',
    description: 'Популярный салат с курицей, листьями салата, сухариками и соусом «Цезарь».',
    ingredients: 'Куриное филе, листья салата, помидоры, сухарики, пармезан, соус «Цезарь».',
    kcal: 190, protein: 14, fat: 11, carbs: 8, price: null, category: 'Салаты'
  },
  {
    id: 'dish-greek', name: 'Греческий салат', image: '/images/greekSalad.jpg',
    description: 'Овощной салат с сыром фета, маслинами и оливковым маслом.',
    ingredients: 'Помидоры, огурцы, сладкий перец, красный лук, сыр фета, маслины, оливковое масло.',
    kcal: 130, protein: 4, fat: 10, carbs: 6, price: null, category: 'Салаты'
  },
  {
    id: 'dish-mushroom-soup', name: 'Суп грибной', image: '/images/sup.jpg',
    description: 'Ароматный грибной суп со сливочным вкусом.',
    ingredients: 'Шампиньоны, картофель, лук, морковь, сливки или сметана, зелень, соль и перец.',
    kcal: 65, protein: 2, fat: 4, carbs: 6, price: null, category: 'Супы'
  },
  {
    id: 'dish-margherita', name: 'Пицца Маргарита', image: '/images/pizza.jpg',
    description: 'Классическая пицца с томатным соусом, моцареллой и базиликом.',
    ingredients: 'Тесто, томатный соус, моцарелла, помидоры, базилик, оливковое масло.',
    kcal: 250, protein: 11, fat: 9, carbs: 31, price: null, category: 'Пицца'
  }
];
