export const products = [
  { id: 1, name: 'Помидоры', emoji: '🍅', amount: 12.5, unit: 'кг', expiry: '25.04.2025', days: 3, category: 'Овощи' },
  { id: 2, name: 'Куриное филе', emoji: '🍗', amount: 8.2, unit: 'кг', expiry: '24.04.2025', days: 2, category: 'Мясо' },
  { id: 3, name: 'Сметана', emoji: '🥛', amount: 1.2, unit: 'кг', expiry: '23.04.2025', days: 1, category: 'Молочные продукты' },
  { id: 4, name: 'Сыр моцарелла', emoji: '🧀', amount: 3.5, unit: 'кг', expiry: '28.04.2025', days: 6, category: 'Молочные продукты' },
  { id: 5, name: 'Листья салата', emoji: '🥬', amount: 0.8, unit: 'кг', expiry: '22.04.2025', days: 0, category: 'Овощи' },
  { id: 6, name: 'Яйца', emoji: '🥚', amount: 15, unit: 'шт', expiry: '30.04.2025', days: 8, category: 'Другое' },
  { id: 7, name: 'Молоко', emoji: '🥛', amount: 4.5, unit: 'л', expiry: '26.04.2025', days: 4, category: 'Молочные продукты' },
  { id: 8, name: 'Мука', emoji: '🥣', amount: 10, unit: 'кг', expiry: '12.06.2025', days: 50, category: 'Другое' },
];
export const initialOrders = [
  { id: 2087, date: '23.04.2025', dishes: 3, status: 'В обработке', amount: 3340 },
  { id: 2086, date: '23.04.2025', dishes: 5, status: 'В сборке', amount: 4560 },
  { id: 2085, date: '22.04.2025', dishes: 2, status: 'Доставлен', amount: 1870 },
  { id: 2084, date: '22.04.2025', dishes: 4, status: 'Доставлен', amount: 3950 },
  { id: 2083, date: '21.04.2025', dishes: 6, status: 'Отменён', amount: 0 },
];
export const initialSupplies = [
  { id: 1034, supplier: 'ООО «ФудПлюс»', date: '23.04.2025', amount: 46320, status: 'Доставлена' },
  { id: 1033, supplier: 'АгроСнаб', date: '20.04.2025', amount: 32500, status: 'Доставлена' },
  { id: 1032, supplier: 'КулинарТорг', date: '17.04.2025', amount: 28750, status: 'Доставлена' },
  { id: 1031, supplier: 'Молочные реки', date: '14.04.2025', amount: 59800, status: 'В пути' },
  { id: 1030, supplier: 'ООО «Овощи»', date: '10.04.2025', amount: 21400, status: 'Доставлена' },
];
export const dishes = [
  { name: 'Цезарь с курицей', emoji: '🥗', reason: 'Куриное филе и листья салата скоро истекают', priority: 'Высокий приоритет' },
  { name: 'Салат Цезарь', emoji: '🥗', reason: 'Остаток зелени небольшой', priority: 'Высокий приоритет' },
  { name: 'Суп грибной', emoji: '🍲', reason: 'Сметана годна ещё 1 день', priority: 'Средний приоритет' },
  { name: 'Пицца Маргарита', emoji: '🍕', reason: 'Можно использовать остатки моцареллы', priority: 'Средний приоритет' },
];
