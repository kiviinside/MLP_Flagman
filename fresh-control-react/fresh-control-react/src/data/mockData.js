// Временные данные для разработки UI. Позже заменяются ответами backend.
export const products=[
{id:'p1',name:'Сливки 20%',category:'Молочные продукты',emoji:'🥛',batch:'№18-26',qty:'2 л',date:'12.10.2026',days:1,status:'critical'},
{id:'p2',name:'Листья салата',category:'Овощи',emoji:'🥬',batch:'№12-26',qty:'0,5 кг',date:'13.10.2026',days:2,status:'warning'},
{id:'p3',name:'Помидоры черри',category:'Овощи',emoji:'🍅',batch:'№07-26',qty:'1,2 кг',date:'14.10.2026',days:3,status:'warning'},
{id:'p4',name:'Куриное филе',category:'Мясо',emoji:'🍗',batch:'№14-26',qty:'3 кг',date:'16.10.2026',days:5,status:'normal'},
{id:'p5',name:'Моцарелла',category:'Молочные продукты',emoji:'🧀',batch:'№11-26',qty:'0,8 кг',date:'17.10.2026',days:6,status:'normal'},
{id:'p6',name:'Яйца',category:'Яйца',emoji:'🥚',batch:'№09-26',qty:'10 шт.',date:'18.10.2026',days:7,status:'normal'},
{id:'p7',name:'Огурцы',category:'Овощи',emoji:'🥒',batch:'№16-26',qty:'4 кг',date:'20.10.2026',days:9,status:'normal'}];
export const deliveries=[
{id:'D-0187',date:'10.10.2026',supplier:'ФудТрейд',status:'Принята',sum:'12 450 ₽',count:24},
{id:'D-0186',date:'09.10.2026',supplier:'Овощи+',status:'Принята',sum:'8 320 ₽',count:18},
{id:'D-0185',date:'08.10.2026',supplier:'МясоПоставка',status:'В пути',sum:'16 500 ₽',count:12}];
export const dishes=[
{id:'d1',name:'Сливочная паста',emoji:'🍝',ingredients:'Сливки, сыр, макароны',price:420,status:'Доступно'},
{id:'d2',name:'Салат с курицей',emoji:'🥗',ingredients:'Курица, салат, томаты',price:390,status:'Доступно'},
{id:'d3',name:'Томатный суп',emoji:'🍅',ingredients:'Томаты, лук, овощи',price:320,status:'Доступно'},
{id:'d4',name:'Пицца Маргарита',emoji:'🍕',ingredients:'Тесто, томаты, сыр',price:450,status:'Доступно'},
{id:'d5',name:'Бургер с говядиной',emoji:'🍔',ingredients:'Говядина, булка, овощи',price:510,status:'Недоступно'},
{id:'d6',name:'Тирамису',emoji:'🍰',ingredients:'Яйца, маскарпоне, печенье',price:350,status:'Доступно'}];
export const stopItems=[
{id:'s1',dish:'Куриный бургер',ingredient:'Куриное филе',reason:'Недостаточно',deficit:'1,5 кг',date:'10.10.2026'},
{id:'s2',dish:'Пицца с грибами',ingredient:'Шампиньоны',reason:'Недостаточно',deficit:'0,8 кг',date:'10.10.2026'},
{id:'s3',dish:'Салат с тунцом',ingredient:'Тунец',reason:'Недостаточно',deficit:'0,6 кг',date:'09.10.2026'}];
export const offers=[
{id:'o1',name:'Сливочная паста',emoji:'🍝',priority:'Высокий',reason:'Использует сливки из партии №18-26',days:1,ingredients:'Сливки, сыр, макароны'},
{id:'o2',name:'Салат с томатами',emoji:'🥗',priority:'Средний',reason:'Поможет использовать томаты до истечения срока',days:3,ingredients:'Томаты, зелень, масло'},
{id:'o3',name:'Куриный суп',emoji:'🍲',priority:'Средний',reason:'Использует куриное филе из партии №14-26',days:5,ingredients:'Курица, овощи, зелень'},
{id:'o4',name:'Тирамису',emoji:'🍰',priority:'Низкий',reason:'Можно использовать яйца из партии №09-26',days:7,ingredients:'Яйца, маскарпоне, печенье'}];
export const waste=[{day:'05.10',amount:16},{day:'06.10',amount:23},{day:'07.10',amount:30},{day:'08.10',amount:21},{day:'09.10',amount:16},{day:'10.10',amount:18},{day:'11.10',amount:12}];