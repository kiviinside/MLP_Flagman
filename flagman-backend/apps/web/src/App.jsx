import React, { useEffect, useMemo, useState } from 'react';
import { 
  LayoutDashboard, Truck, ClipboardList, Boxes, Clock3, Ban, Flame, 
  ChartNoAxesCombined, Settings, Bell, Search, Plus, ChevronRight, Menu, X, 
  ChefHat, ArrowUpRight, PackagePlus, ShoppingBasket, FileChartColumn, 
  CircleHelp, LogOut, Check, AlertTriangle, CalendarDays, Filter, Download, 
  CircleCheck, Trash2, RefreshCw 
} from 'lucide-react';
import { apiRequest, setApiCredentials, clearApiCredentials } from './api/http.js';

const nav = [
  ['Главная', LayoutDashboard], 
  ['Поставки', Truck], 
  ['Заказы', ClipboardList], 
  ['Склад', Boxes], 
  ['Сроки годности', Clock3], 
  ['Стоп-лист', Ban], 
  ['Горячие предложения', Flame], 
  ['Аналитика', ChartNoAxesCombined], 
  ['Настройки', Settings]
];

const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

function Status({ children, tone }) { 
  return (
    <span className={`status ${tone || (children === 'Доставлен' || children === 'Доставлена' || children === 'В норме' ? 'green' : children === 'Отменён' || children === 'Просрочен' ? 'red' : 'amber')}`}>
      {children}
    </span>
  ); 
}

function SectionTitle({ title, subtitle, action, onAction }) { 
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && (
        <button className="button secondary small" onClick={onAction}>
          {action}
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  ); 
}

function StatCard({ icon: Icon, label, value, hint, tone = 'purple' }) { 
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
      <ArrowUpRight className="stat-arrow" size={16} />
    </article>
  ); 
}

function EmptyState({ text }) { 
  return (
    <div className="empty-state">
      <Boxes size={28} />
      <p>{text}</p>
    </div>
  ); 
}

export default function App() {
  const [active, setActive] = useState('Главная');
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('vkus-balans-theme') || 'system'; } 
    catch { return 'system'; }
  });
  
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('vkus-balans-theme', theme); } catch {}
  }, [theme]);
  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [login, setLogin] = useState({ email: 'admin@vkusbalans.ru', password: '' });
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [batches, setBatches] = useState([]);
  const [stopItems, setStopItems] = useState([]);
  const [hotDishes, setHotDishes] = useState([]);
  const [writeOffs, setWriteOffs] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [supplyForm, setSupplyForm] = useState({ productId: '', quantity: '1', expirationDate: '' });
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [modal, setModal] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('Все');
  const [range, setRange] = useState('7 дней');
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vkus-balans-settings')) || { alerts: true, autoStop: true, priority: true }; }
    catch { return { alerts: true, autoStop: true, priority: true }; }
  });
  useEffect(() => { try { localStorage.setItem('vkus-balans-settings', JSON.stringify(settings)); } catch {} }, [settings]);
  const [form, setForm] = useState({ name: '', amount: '', unit: 'кг', expiry: '' });
  const [selectedDishes, setSelectedDishes] = useState({});
  
  const menuDishes = dishes.map(dish => ({ ...dish, emoji: '🍽️', reason: dish.reasons?.join(', ') || (dish.isAvailable ? 'Доступно для заказа' : 'Недостаточно ингредиентов'), priority: dish.recommendedDiscountPercent ? `Скидка ${dish.recommendedDiscountPercent}%` : 'Рекомендация' }));
  
  const selectedDishCount = Object.values(selectedDishes).reduce((sum, qty) => sum + qty, 0);
  const selectedDishTotal = menuDishes.reduce((sum, dish) => sum + dish.price * (selectedDishes[dish.id] || 0), 0);
  
  const filteredProducts = useMemo(() => 
    products.filter(p => 
      `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()) && 
      (filter === 'Все' || (filter === 'Скоро истекает' ? p.days <= 2 : filter === 'Просрочено' ? p.days <= 0 : p.category === filter))
    ), 
    [products, search, filter]
  );
  
  const notify = text => { 
    setNotice(text); 
    window.setTimeout(() => setNotice(''), 3200); 
  };
  
  const changePage = name => { 
    setActive(name); 
    setMobileNav(false); 
    setSearch(''); 
  };
  
  const formatDate = value => value ? new Intl.DateTimeFormat('ru-RU').format(new Date(value)) : '—';
  const loadData = async () => {
    // Параллельно загружаем данные с сервера; интерфейс не подменяет их фиктивными записями.
    const [dash, catalog, dishList, stock, batchList, orderList, supplyList, stopList, offers, writeOffList] = await Promise.all([
      apiRequest('/api/dashboard'),
      apiRequest('/api/admin/products'),
      apiRequest('/api/admin/dishes'),
      apiRequest('/api/warehouse/summary'),
      apiRequest('/api/warehouse/batches'),
      apiRequest('/api/orders'),
      apiRequest('/api/supplies'),
      apiRequest('/api/stop-list'),
      apiRequest('/api/hot-offers'),
      apiRequest('/api/analytics/write-offs')
    ]);
    const stockById = new Map(stock.map(row => [row.productId, row]));
    const batchesById = new Map();
    batchList.forEach(batch => {
      const current = batchesById.get(batch.productId) || [];
      current.push(batch);
      batchesById.set(batch.productId, current);
    });
    setProducts(catalog.map(product => {
      const productBatches = batchesById.get(product.id) || [];
      const summary = stockById.get(product.id);
      const quantity = summary?.available ?? 0;
      const firstExpiry = productBatches.filter(b => Number(b.remainingQuantity) > 0)
        .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate))[0];
      const days = firstExpiry ? Math.floor(firstExpiry.hoursLeft / 24) : 9999;
      return {
        id: product.id, name: product.name, emoji: '📦', amount: Number(quantity), unit: product.unit,
        expiry: firstExpiry ? formatDate(firstExpiry.expirationDate) : 'Нет партий', days,
        category: 'Другое', minThreshold: Number(product.minThreshold || 0), shelfLifeHours: product.shelfLifeHours
      };
    }));
    setBatches(batchList);
    setDishes(dishList);
    const dishById = new Map(dishList.map(d => [d.id, d]));
    setOrders(orderList.map(order => ({
      id: order.id, orderNumber: order.orderNumber, date: formatDate(order.createdAt),
      dishes: order.items.reduce((sum, item) => sum + item.quantity, 0),
      status: ({ CREATED: 'В обработке', COMPLETED: 'Завершён', CANCELLED_OUT_OF_STOCK: 'Отказ: нет остатков' })[order.status] || order.status,
      amount: order.items.reduce((sum, item) => sum + (Number(dishById.get(item.dishId)?.price || 0) * item.quantity), 0),
      rawStatus: order.status, items: order.items
    })));
    setSupplies(supplyList.map(supply => ({
      id: supply.supplyId, supplier: 'Не указан', date: formatDate(supply.createdAt),
      amount: Number(supply.totalQuantity), status: 'Принята', itemCount: supply.itemCount
    })));
    setStopItems(stopList.map(item => ({
      id: item.dishId, name: item.dishName,
      reason: item.missingIngredients?.length ? item.missingIngredients.join(', ') : 'Недостаточно ингредиентов'
    })));
    setHotDishes(offers.map(offer => ({
      id: offer.dishId, name: offer.dishName, price: Number(offer.price || 0),
      reasons: offer.reasons || [], reason: (offer.reasons || []).join(', '),
      recommendedDiscountPercent: offer.recommendedDiscountPercent,
      priority: offer.score >= 1 ? 'Высокий приоритет' : 'Средний приоритет', emoji: '🍽️'
    })));
    setWriteOffs(writeOffList);
    setDashboard(dash);
  };

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    const username = login.email.trim().toLowerCase() === 'admin@vkusbalans.ru'
      ? 'admin' : login.email.trim();
    setApiCredentials(username, login.password);
    try {
      // Первый защищённый запрос одновременно проверяет логин и пароль.
      await apiRequest('/api/dashboard');
      await loadData();
      setSignedIn(true);
      notify('Подключение к серверу установлено');
    } catch (error) {
      clearApiCredentials();
      notify(error.message || 'Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async e => {
    e.preventDefault();
    if (!form.name.trim() || Number(form.amount) <= 0) return;
    try {
      const product = await apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ name: form.name.trim(), unit: form.unit, minThreshold: 0, shelfLifeHours: 168 })
      });
      const expiry = form.expiry ? `${form.expiry}T23:59:00` : null;
      await apiRequest('/api/supplies', {
        method: 'POST',
        body: JSON.stringify({ items: [{ productId: product.id, quantity: Number(form.amount), expirationDate: expiry }] })
      });
      await loadData();
      setForm({ name: '', amount: '', unit: 'кг', expiry: '' });
      setModal('');
      notify('Продукт и складская партия сохранены');
    } catch (error) { notify(error.message || 'Не удалось добавить продукт'); }
  };

  const deleteProduct = async product => {
    try {
      await apiRequest(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      await loadData();
      notify('Продукт удалён');
    } catch (error) { notify(error.message || 'Не удалось удалить продукт'); }
  };

  const createOrder = async () => {
    const items = Object.entries(selectedDishes).filter(([, quantity]) => quantity > 0)
      .map(([dishId, quantity]) => ({ dishId: Number(dishId), quantity }));
    if (!items.length) { notify('Выберите хотя бы одно блюдо'); return; }
    try {
      const order = await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify({ items }) });
      await loadData();
      setSelectedDishes({}); setModal('');
      if (order.status === 'CREATED') notify(`Заказ ${order.orderNumber} создан, ингредиенты списаны`);
      else notify(order.rejectionReason || 'Заказ отклонён: проверьте остатки и стоп-лист');
    } catch (error) {
      // 409 — бизнес-отказ: сервер сохраняет отклонённый заказ, поэтому обновляем список.
      if (error.status === 409 && error.payload?.orderNumber) {
        await loadData().catch(() => {});
        setSelectedDishes({}); setModal('');
        notify(error.payload.rejectionReason || 'Заказ отклонён: проверьте остатки и стоп-лист');
      } else { notify(error.message || 'Не удалось создать заказ'); }
    }
  };

  const completeOrder = async id => {
    try {
      await apiRequest(`/api/orders/${id}/complete`, { method: 'PATCH' });
      await loadData();
      notify('Заказ отмечен как завершённый');
    } catch (error) { notify(error.message || 'Не удалось завершить заказ'); }
  };

  const addSupply = async () => {
    if (!supplyForm.productId || Number(supplyForm.quantity) <= 0) {
      notify('Выберите продукт и укажите количество'); return;
    }
    try {
      const expirationDate = supplyForm.expirationDate ? `${supplyForm.expirationDate}T23:59:00` : null;
      await apiRequest('/api/supplies', {
        method: 'POST',
        body: JSON.stringify({ items: [{ productId: Number(supplyForm.productId), quantity: Number(supplyForm.quantity), expirationDate }] })
      });
      await loadData(); setModal('');
      setSupplyForm({ productId: '', quantity: '1', expirationDate: '' });
      notify('Поставка зарегистрирована, остатки обновлены');
    } catch (error) { notify(error.message || 'Не удалось зарегистрировать поставку'); }
  };

  const openModal = type => { 
    setModal(type); 
    setForm({ name: '', amount: '', unit: 'кг', expiry: '' }); 
  };

  const tableProducts = (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Продукт</th>
            <th>Остаток</th>
            <th>Ед. изм.</th>
            <th>Срок годности</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(p => (
            <tr key={p.id}>
              <td>
                <span className="product-name">
                  <span className="food-emoji">{p.emoji}</span>
                  {p.name}
                </span>
              </td>
              <td className="strong-cell">{p.amount}</td>
              <td>{p.unit}</td>
              <td>{p.expiry}</td>
              <td>
                <Status tone={p.days <= 0 ? 'red' : p.days <= 2 ? 'amber' : 'green'}>
                  {p.days <= 0 ? 'Просрочен' : p.days <= 2 ? `${p.days} дн.` : 'В норме'}
                </Status>
              </td>
              <td>
                <button className="icon-button" aria-label={`Удалить ${p.name}`} onClick={() => deleteProduct(p)}>
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredProducts.length === 0 && <EmptyState text="По вашему запросу ничего не найдено" />}
    </div>
  );

  const ordersTable = (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>№ заказа</th>
            <th>Дата</th>
            <th>Блюд</th>
            <th>Статус</th>
            <th>Сумма</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {orders.filter(o => String(o.id).includes(search) || o.status.toLowerCase().includes(search.toLowerCase())).map(o => (
            <tr key={o.id}>
              <td className="purple-text">#{o.id}</td>
              <td>{o.date}</td>
              <td>{o.dishes}</td>
              <td><Status>{o.status}</Status></td>
              <td className="strong-cell">{money(o.amount)}</td>
              <td>{o.rawStatus === 'CREATED' ? <button className="button secondary small" onClick={() => completeOrder(o.id)}>Завершить</button> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <EmptyState text="Заказов пока нет" />}
    </div>
  );

  const suppliesTable = (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>№ поставки</th>
            <th>Поставщик</th>
            <th>Дата</th>
            <th>Объём</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {supplies.map(s => (
            <tr key={s.id}>
              <td className="purple-text">#{s.id}</td>
              <td>{s.supplier}</td>
              <td>{s.date}</td>
              <td className="strong-cell">{s.amount.toLocaleString('ru-RU')} ед.</td>
              <td><Status>{s.status}</Status></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const expiring = products.filter(p => p.days <= 2 && p.amount > 0);
  const today = new Date();
  const currentDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const currentWeekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(today);
  const currentTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(today);
  
  const notificationItems = [
    ...expiring.map(p => ({ 
      id: `expiry-${p.id}`, 
      title: p.days <= 0 ? `Истёк срок: ${p.name}` : `Скоро истекает: ${p.name}`, 
      text: `${p.amount} ${p.unit} · ${p.days <= 0 ? 'проверьте партию' : `осталось ${p.days} дн.`}`, 
      tone: p.days <= 0 ? 'red' : 'amber' 
    })), 
    ...(orders.length ? [{ id: 'orders', title: 'Заказы ресторана', text: `Всего заказов: ${orders.length}`, tone: 'purple' }] : [])
  ];
  


  function Dashboard() { 
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">{currentWeekday.toLocaleUpperCase('ru-RU')}, {currentDate.toLocaleUpperCase('ru-RU')}</div>
            <h1>Добро пожаловать, Алексей! <span className="wave">✦</span></h1>
            <p>Следите за остатками, сроками годности и эффективностью ресторана.</p>
          </div>
          <button className="button primary" onClick={() => openModal('product')}>
            <Plus size={17} /> Добавить продукт
          </button>
        </div>
        <div className="stats-grid">
          <StatCard icon={Boxes} label="Общий остаток продуктов" value={dashboard?.productCount ?? products.length} hint="наименований на складе" tone="purple" />
          <StatCard icon={AlertTriangle} label="Истекает срок годности" value={dashboard?.expiringBatchCount ?? expiring.length} hint="требуют внимания" tone="orange" />
          <StatCard icon={CalendarDays} label="Ближайший срок" value={expiring.length ? `${Math.max(0, Math.min(...expiring.map(p => p.days)))} дн.` : '—'} hint="по ближайшей партии" tone="blue" />
          <StatCard icon={ChefHat} label="Активных блюд в меню" value={dashboard ? `${dashboard.availableDishCount}/${dashboard.totalDishCount}` : dishes.length} hint="доступно / всего" tone="green" />
        </div>
        <div className="dashboard-grid">
          <section className="panel stock-panel">
            <SectionTitle title="Остатки на складе" subtitle="Текущая ситуация по продуктам" action="Весь склад" onAction={() => changePage('Склад')} />
            {tableProducts}
          </section>
          <section className="panel">
            <SectionTitle title="Сроки под контролем" subtitle="Партии, которым нужно внимание" action="Все сроки" onAction={() => changePage('Сроки годности')} />
            <div className="expiry-list">
              {expiring.slice(0, 4).map(p => (
                <div className="expiry-item" key={p.id}>
                  <span className="food-emoji">{p.emoji}</span>
                  <div className="expiry-info">
                    <strong>{p.name}</strong>
                    <small>{p.amount} {p.unit} · до {p.expiry}</small>
                  </div>
                  <Status tone={p.days <= 0 ? 'red' : 'amber'}>
                    {p.days <= 0 ? 'Просрочено' : `${p.days} дн.`}
                  </Status>
                </div>
              ))}
              {!expiring.length && <EmptyState text="Скоро истекающих продуктов нет" />}
            </div>
            <div className="callout purple-callout">
              <div className="callout-icon">
                <Flame size={20} />
              </div>
              <div>
                <strong>Горячие предложения</strong>
                <p>Используйте продукты с коротким сроком хранения в приоритетных блюдах.</p>
                <button className="text-button" onClick={() => changePage('Горячие предложения')}>
                  Посмотреть рекомендации <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>
          <section className="panel chart-panel">
            <div className="chart-heading">
              <SectionTitle title="Динамика остатков" subtitle="Изменение запасов за последние 7 дней" />
              <span className="chart-period">7 дней <ChevronRight size={14} /></span>
            </div>
            <div className="chart-kpis">
              <div>
                <span>Всего на складе</span>
                <strong>1 284 <small>ед.</small></strong>
              </div>
              <div className="chart-trend">
                <span className="trend-up"><ArrowUpRight size={14} /> 8,4%</span>
                <small>к прошлой неделе</small>
              </div>
            </div>
            <div className="chart-legend">
              <span><i className="dot veg-dot" /> Овощи <b>420</b></span>
              <span><i className="dot meat-dot" /> Мясо <b>356</b></span>
              <span><i className="dot dairy-dot" /> Молочные <b>508</b></span>
            </div>
            <div className="line-chart modern-line-chart">
              <div className="y-labels">
                <span>600</span>
                <span>450</span>
                <span>300</span>
                <span>150</span>
                <span>0</span>
              </div>
              <svg viewBox="0 0 560 190" role="img" aria-label="График динамики остатков овощей, мяса и молочных продуктов за неделю" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="vegArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#20b779" stopOpacity=".22" />
                    <stop offset="100%" stopColor="#20b779" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="meatArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b95af0" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#b95af0" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="dairyArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5b83d" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#f5b83d" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g className="grid-lines">
                  <path d="M0 18H560 M0 54H560 M0 90H560 M0 126H560 M0 162H560" />
                </g>
                <path className="chart-area veg-area" d="M0 74 C35 67 55 45 93 53 S150 65 186 74 S245 99 280 91 S340 110 373 119 S430 130 466 141 S525 150 560 156 L560 162 L0 162Z" />
                <path className="chart-area meat-area" d="M0 111 C38 107 57 103 93 109 S150 113 186 122 S245 125 280 132 S340 139 373 141 S430 143 466 148 S525 152 560 158 L560 162 L0 162Z" />
                <path className="chart-area dairy-area" d="M0 140 C35 148 57 138 93 142 S150 124 186 128 S245 109 280 104 S340 88 373 91 S430 77 466 83 S525 67 560 62 L560 162 L0 162Z" />
                <path className="line purple-line" d="M0 74 C35 67 55 45 93 53 S150 65 186 74 S245 99 280 91 S340 110 373 119 S430 130 466 141 S525 150 560 156" />
                <path className="line pink-line" d="M0 111 C38 107 57 103 93 109 S150 113 186 122 S245 125 280 132 S340 139 373 141 S430 143 466 148 S525 152 560 158" />
                <path className="line blue-line" d="M0 140 C35 148 57 138 93 142 S150 124 186 128 S245 109 280 104 S340 88 373 91 S430 77 466 83 S525 67 560 62" />
                <g className="chart-points purple-points">
                  <circle cx="93" cy="53" r="3.5" />
                  <circle cx="280" cy="91" r="3.5" />
                  <circle cx="466" cy="141" r="3.5" />
                  <circle cx="560" cy="156" r="4.5" />
                </g>
                <g className="chart-points pink-points">
                  <circle cx="186" cy="122" r="3.5" />
                  <circle cx="373" cy="141" r="3.5" />
                  <circle cx="560" cy="158" r="4.5" />
                </g>
                <g className="chart-points blue-points">
                  <circle cx="93" cy="142" r="3.5" />
                  <circle cx="280" cy="104" r="3.5" />
                  <circle cx="466" cy="83" r="3.5" />
                  <circle cx="560" cy="62" r="4.5" />
                </g>
                <g className="axis-labels">
                  <text x="0" y="184">Пн</text>
                  <text x="93" y="184">Вт</text>
                  <text x="186" y="184">Ср</text>
                  <text x="280" y="184">Чт</text>
                  <text x="373" y="184">Пт</text>
                  <text x="466" y="184">Сб</text>
                  <text x="548" y="184">Вс</text>
                </g>
              </svg>
            </div>
          </section>
          <section className="panel">
            <SectionTitle title="Последние заказы" subtitle="Обновление списка вручную" action="Все заказы" onAction={() => changePage('Заказы')} />
            <div className="recent-orders">
              {orders.slice(0, 4).map(o => (
                <div className="recent-order" key={o.id}>
                  <div>
                    <strong>#{o.id}</strong>
                    <small>{o.dishes} блюда · {o.date}</small>
                  </div>
                  <Status>{o.status}</Status>
                </div>
              ))}
            </div>
            <button className="button secondary full" onClick={() => openModal('order')}>
              <Plus size={16} /> Создать заказ
            </button>
          </section>
        </div>
      </>
    ); 
  }

  function Warehouse() { 
    return (
      <>
        <SectionTitle title="Склад" subtitle="Контролируйте количество продуктов и остатки по партиям." />
        <div className="toolbar">
          <div className="filter-tabs">
            {['Все', 'Скоро истекает', 'Просрочено', 'Овощи', 'Мясо', 'Молочные продукты', 'Другое'].map(f => (
              <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <button className="button primary" onClick={() => openModal('product')}>
            <Plus size={16} /> Добавить продукт
          </button>
        </div>
        <section className="panel">
          <div className="panel-top">
            <div>
              <strong>Товары на складе</strong>
              <span className="muted"> {filteredProducts.length} позиций</span>
            </div>
            <button className="button secondary small" onClick={() => notify('Экспорт CSV ещё не реализован')}>
              <Download size={15} /> Экспорт
            </button>
          </div>
          {tableProducts}
        </section>
      </>
    ); 
  }

  function Expiry() { 
    return (
      <>
        <SectionTitle title="Сроки годности" subtitle="Контроль каждой партии и приоритет использования продуктов по принципу FEFO." />
        <div className="stats-grid three">
          <StatCard icon={Clock3} label="Истекают в ближайшие 48 часов" value={expiring.length} hint="позиций" tone="orange" />
          <StatCard icon={AlertTriangle} label="Просрочено" value={dashboard?.expiredBatchCount ?? products.filter(p => p.days <= 0).length} hint="партий требуют проверки" tone="red" />
          <StatCard icon={CircleCheck} label="В пределах срока" value={batches.filter(b => b.status === 'FRESH' && Number(b.remainingQuantity) > 0).length} hint="партий" tone="green" />
        </div>
        <section className="panel">
          <SectionTitle title="Остатки по партиям" subtitle="Сначала используйте продукты с ближайшим сроком годности." />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Продукт</th>
                  <th>Партия</th>
                  <th>Количество</th>
                  <th>Годен до</th>
                  <th>Осталось</th>
                  <th>Рекомендация</th>
                </tr>
              </thead>
              <tbody>
                {[...batches].sort((a, b) => a.hoursLeft - b.hoursLeft).map(batch => (
                  <tr key={batch.id}>
                    <td><span className="product-name"><span className="food-emoji">📦</span>{batch.productName}</span></td>
                    <td>{batch.supplyId}</td>
                    <td>{batch.remainingQuantity} {batch.unit}</td>
                    <td>{formatDate(batch.expirationDate)}</td>
                    <td><Status tone={batch.status === 'EXPIRED' ? 'red' : batch.status === 'EXPIRING' ? 'amber' : 'green'}>{batch.status === 'EXPIRED' ? 'Истёк' : batch.status === 'EXPIRING' ? `${Math.max(0, Math.floor(batch.hoursLeft / 24))} дн.` : 'В норме'}</Status></td>
                    <td>{batch.status === 'EXPIRED' || batch.status === 'EXPIRING' ? 'Использовать в первую очередь' : 'В обычном порядке'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    ); 
  }

  function StopList() { 
    return (
      <>
        <SectionTitle title="Стоп-лист" subtitle="Блюда, которые временно нельзя заказать из-за нехватки ингредиентов." />
        <div className="warning-banner">
          <AlertTriangle size={22} />
          <div>
            <strong>Автоматический контроль доступности</strong>
            <p>Перед оформлением заказа проверяется наличие всех необходимых ингредиентов.</p>
          </div>
          <Status tone="red">{stopItems.length} блюд</Status>
        </div>
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Блюдо</th>
                  <th>Причина</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {stopItems.map((s, i) => (
                  <tr key={s.name}>
                    <td>
                      <span className="product-name">
                        <span className="food-emoji">{['🍝', '🥗', '🍰'][i]}</span>
                        {s.name}
                      </span>
                    </td>
                    <td>{s.reason}</td>
                    <td><Status tone="red">Недоступно</Status></td>
                    <td>
                      <button className="button secondary small" onClick={() => notify(`Открыта причина блокировки: ${s.reason}`)}>
                        Подробнее
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="callout orange-callout">
          <AlertTriangle size={21} />
          <div>
            <strong>Как блюдо вернётся в меню?</strong>
            <p>После регистрации поставки сервер пересчитывает доступность блюд и публикует обновление склада.</p>
          </div>
        </div>
      </>
    ); 
  }

  function HotOffers() { 
    return (
      <>
        <SectionTitle title="Горячие предложения" subtitle="Рекомендации блюд, которые помогут использовать продукты до окончания срока годности." />
        <div className="recommendation-note">
          <Flame size={20} />
          <span>Рекомендации рассчитаны сервером по текущим складским остаткам и срокам годности.</span>
        </div>
        <div className="dish-grid">
          {hotDishes.map((d, i) => (
            <article className="dish-card" key={d.name}>
              <div className="dish-art">
                {d.emoji}
                <span className={`priority priority-${i < 2 ? 'high' : 'medium'}`}>{d.priority}</span>
              </div>
              <div className="dish-body">
                <h3>{d.name}</h3>
                <p>{d.reason}</p>
                <div className="dish-footer">
                  <span className="muted">Рекомендуемая акция</span>
                  <button className="button primary small" onClick={() => notify(`Рекомендация «${d.name}» отмечена`)}>
                    В продвижение <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </>
    ); 
  }

  function Analytics() { 
    return (
      <>
        <SectionTitle title="Аналитика" subtitle="Показатели склада и списаний за выбранный период." />
        <div className="toolbar">
          <div className="range-select">
            <CalendarDays size={16} />
            <select value={range} onChange={e => setRange(e.target.value)}>
              <option>7 дней</option>
              <option>30 дней</option>
              <option>90 дней</option>
            </select>
          </div>
          <button className="button secondary" onClick={() => notify('Экспорт отчёта пока не реализован')}>
            <Download size={16} /> Скачать отчёт
          </button>
        </div>
        <div className="stats-grid">
          <StatCard icon={Trash2} label="Списано продуктов" value={`${writeOffs.reduce((sum, row) => sum + Number(row.totalQuantity || 0), 0).toLocaleString('ru-RU')} ед.`} hint="за выбранный период" tone="orange" />
          <StatCard icon={ChartNoAxesCombined} label="Доля списаний" value="—" hint="нет данных об общем объёме" tone="green" />
          <StatCard icon={AlertTriangle} label="Дефицитных ингредиентов" value={products.filter(p => p.amount < p.minThreshold).length} hint="ниже минимального остатка" tone="red" />
          <StatCard icon={Ban} label="Прогноз стоп-листа" value={stopItems.length} hint="блюд в стоп-листе" tone="purple" />
        </div>
        <div className="analytics-grid">
          <section className="panel">
            <SectionTitle title="Списания по категориям" subtitle={`Период: ${range.toLowerCase()}`} />
            {writeOffs.map((row, i) => [row.product || `Продукт ${i + 1}`, Number(row.totalQuantity || 0), ['purple', 'pink', 'blue', 'orange', 'green'][i % 5]]).map(([name, v, c]) => (
              <div className="bar-row" key={name}>
                <span>{name}</span>
                <div className="bar-track">
                  <div className={`bar-fill ${c}`} style={{ width: `${v}%` }} />
                </div>
                <strong>{v}%</strong>
              </div>
            ))}
          </section>
          <section className="panel">
            <SectionTitle title="Потребность в поставках" subtitle="По текущим остаткам" />
            {products.filter(p => p.amount < 2).map(p => (
              <div className="need-row" key={p.id}>
                <span className="food-emoji">{p.emoji}</span>
                <div>
                  <strong>{p.name}</strong>
                  <small>Остаток: {p.amount} {p.unit}</small>
                </div>
                <Status tone="amber">Пополнить</Status>
              </div>
            ))}
            <button className="button primary full" onClick={() => openModal('supply')}>
              <Plus size={16} /> Создать поставку
            </button>
          </section>
        </div>
      </>
    ); 
  }

  function SettingsPage() { 
    return (
      <>
        <SectionTitle title="Настройки" subtitle="Настройте локальные предпочтения интерфейса и уведомлений." />
        <section className="panel settings-panel">
          {[
            ["alerts", "Уведомления о сроках годности", "Предупреждать о продуктах, срок которых скоро истекает."],
            ["autoStop", "Автоматическое обновление стоп-листа", "Блокировать блюда при недостатке необходимых ингредиентов."],
            ["priority", "Горячие предложения", "Рекомендовать блюда с ингредиентами, которые нужно использовать в первую очередь."]
          ].map(([key, title, desc]) => (
            <div className="setting-row" key={key}>
              <div>
                <strong>{title}</strong>
                <p>{desc}</p>
              </div>
              <button role="switch" aria-checked={settings[key]} className={`toggle ${settings[key] ? 'on' : ''}`} onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}>
                <span />
              </button>
            </div>
          ))}
          <div className="theme-setting">
            <div className="theme-setting-copy">
              <strong>Оформление интерфейса</strong>
              <p>Выберите комфортную тему. Системная автоматически подстраивается под настройки устройства.</p>
            </div>
            <div className="theme-options" role="group" aria-label="Тема интерфейса">
              {[
                { id: 'light', label: 'Светлая', icon: '☀' },
                { id: 'dark', label: 'Тёмная', icon: '☾' },
                { id: 'system', label: 'Системная', icon: '◐' }
              ].map(option => (
                <button 
                  key={option.id} 
                  type="button" 
                  className={`theme-option ${theme === option.id ? 'selected' : ''}`} 
                  aria-pressed={theme === option.id} 
                  onClick={() => setTheme(option.id)}
                >
                  <span className="theme-preview">
                    <i className={`preview-${option.id}`} />
                  </span>
                  <span>{option.icon} {option.label}</span>
                  {theme === option.id && <Check size={15} />}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-info">
            <CircleHelp size={19} />
            <div>
              <strong>Интеграция с сервером</strong>
              <p>Фронтенд подготовлен к подключению Java API. Авторизация, хранение данных и обновления в реальном времени будут добавлены на стороне сервера.</p>
            </div>
          </div>
        </section>
      </>
    ); 
  }

  const pageContent = () => { 
    switch(active) { 
      case 'Главная': return <Dashboard />; 
      case 'Поставки': return (
        <>
          <SectionTitle title="Поставки" subtitle="История поступления товаров и учёт партий продуктов." />
          <div className="toolbar">
            <div className="toolbar-note">
              <Truck size={18} /> Все поступления ресторана
            </div>
            <button className="button primary" onClick={() => openModal('supply')}>
              <Plus size={16} /> Новая поставка
            </button>
          </div>
          <section className="panel">
            {suppliesTable}
          </section>
        </>
      ); 
      case 'Заказы': return (
        <>
          <SectionTitle title="Заказы" subtitle="Проверка ингредиентов и контроль выполнения заказов." />
          <div className="toolbar">
            <span className="toolbar-note">
              <ClipboardList size={18} /> {orders.length} заказов
            </span>
            <button className="button primary" onClick={() => openModal('order')}>
              <Plus size={16} /> Новый заказ
            </button>
          </div>
          <section className="panel">
            {ordersTable}
          </section>
        </>
      ); 
      case 'Склад': return <Warehouse />; 
      case 'Сроки годности': return <Expiry />; 
      case 'Стоп-лист': return <StopList />; 
      case 'Горячие предложения': return <HotOffers />; 
      case 'Аналитика': return <Analytics />; 
      case 'Настройки': return <SettingsPage />; 
      default: return <Dashboard />; 
    } 
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <ChefHat size={26} />
          </div>
          <div>
            <strong>Вкус&Баланс</strong>
            <span>Управление рестораном</span>
          </div>
          <button className="close-nav icon-button" onClick={() => setMobileNav(false)} aria-label="Закрыть меню">
            <X size={20} />
          </button>
        </div>
        <nav className="nav-list" aria-label="Основная навигация">
          {nav.map(([label, Icon]) => (
            <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => changePage(label)}>
              <Icon size={19} />
              <span>{label}</span>
              {label === 'Стоп-лист' && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="online-dot" />
          <div>
            <strong>Система работает</strong>
            <span>Обновлено в 14:32</span>
          </div>
        </div>
        <div className="profile">
          <div className="avatar">А</div>
          <div>
            <strong>Алексей Иванов</strong>
            <span>Администратор</span>
          </div>
          <button className="icon-button" aria-label="Выйти" onClick={() => { clearApiCredentials(); setSignedIn(false); setProducts([]); setOrders([]); setSupplies([]); }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      
      {mobileNav && <button className="mobile-backdrop" aria-label="Закрыть меню" onClick={() => setMobileNav(false)} />}
      
      <main className="main-area">
        <header className="topbar">
          <button className="menu-toggle icon-button" onClick={() => setMobileNav(true)} aria-label="Открыть меню">
            <Menu size={22} />
          </button>
          <div className="search-box">
            <Search size={17} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Поиск по продуктам, блюдам, поставкам…" 
              aria-label="Поиск" 
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="topbar-right">
            <span className="date-label">
              <CalendarDays size={16} /> {currentDate} <small>{currentTime}</small>
            </span>
            <button 
              className={`icon-button notification ${notificationsOpen ? 'notification-active' : ''}`} 
              aria-label="Открыть уведомления" 
              aria-expanded={notificationsOpen} 
              onClick={() => setNotificationsOpen(v => !v)}
            >
              <Bell size={19} />
              {notificationItems.length > 0 && <i />}
            </button>
            <div className="top-avatar">АИ</div>
            <div className="user-label">
              <strong>Алексей</strong>
              <span>Администратор</span>
            </div>
          </div>
        </header>
        
        <div className="page-content" key={active}>
          {pageContent()}
          <footer className="footer">
            <span>© {today.getFullYear()} Вкус&Баланс</span>
            <span>Контроль запасов с заботой о качестве <span className="footer-heart">♥</span></span>
          </footer>
        </div>
      </main>
      
      {notificationsOpen && (
        <>
          <button className="drawer-backdrop" aria-label="Закрыть уведомления" onClick={() => setNotificationsOpen(false)} />
          <aside className="notification-drawer" aria-label="Уведомления">
            <div className="drawer-head">
              <div>
                <span className="eyebrow">ЦЕНТР СОБЫТИЙ</span>
                <h2>Уведомления</h2>
                <p>{notificationItems.length} событий требуют внимания</p>
              </div>
              <button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Закрыть уведомления">
                <X size={20} />
              </button>
            </div>
            {notificationItems.length ? notificationItems.map(item => (
              <article className="notification-item" key={item.id}>
                <span className={`notification-mark ${item.tone}`}>
                  <Bell size={16} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                  <small>{currentDate} · {currentTime}</small>
                </div>
              </article>
            )) : (
              <div className="drawer-empty">
                <CircleCheck size={30} />
                <strong>Новых уведомлений нет</strong>
                <p>Здесь появятся важные события по складу и заказам.</p>
              </div>
            )}
            <button className="button secondary full" onClick={() => { setNotificationsOpen(false); changePage('Сроки годности'); }}>
              Проверить сроки годности
            </button>
          </aside>
        </>
      )}
      
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
          <button onClick={() => setNotice('')} aria-label="Закрыть">
            <X size={15} />
          </button>
        </div>
      )}
      
      {!signedIn && (
        <div className="auth-backdrop">
          <form className="auth-card" onSubmit={handleLogin}>
            <div className="auth-logo">
              <ChefHat size={30} />
            </div>
            <span className="eyebrow">ВКУС&БАЛАНС</span>
            <h1>С возвращением!</h1>
            <p>Войдите, чтобы управлять рестораном.</p>
            <label>
              Логин (для администратора: admin)
              <input 
                type="text" 
                required 
                value={login.email} 
                onChange={e => setLogin(v => ({ ...v, email: e.target.value }))} 
                placeholder="admin" 
              />
            </label>
            <label>
              Пароль
              <input 
                type="password" 
                required 
                minLength={4} 
                value={login.password} 
                onChange={e => setLogin(v => ({ ...v, password: e.target.value }))} 
                placeholder="Введите пароль" 
              />
            </label>
            <button className="button primary full" type="submit" disabled={loading}>
              {loading ? 'Подключение…' : 'Войти в систему'}
            </button>
            <small>Вход проверяется сервером Spring Security. Данные авторизации хранятся только в памяти текущей вкладки.</small>
          </form>
        </div>
      )}
      
      {modal && (
        <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setModal(''); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-head">
              <div>
                <span className="eyebrow">ВКУС&БАЛАНС</span>
                <h2 id="modal-title">
                  {modal === 'product' ? 'Добавить продукт' : modal === 'order' ? 'Новый заказ' : 'Новая поставка'}
                </h2>
              </div>
              <button className="icon-button" onClick={() => setModal('')} aria-label="Закрыть">
                <X size={20} />
              </button>
            </div>
            
            {modal === 'product' ? (
              <form onSubmit={addProduct} className="modal-form">
                <label>
                  Название продукта
                  <input 
                    autoFocus 
                    required 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                    placeholder="Например, Огурцы" 
                  />
                </label>
                <div className="form-row">
                  <label>
                    Количество
                    <input 
                      required 
                      min="0.01" 
                      step="0.01" 
                      type="number" 
                      value={form.amount} 
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
                      placeholder="0,0" 
                    />
                  </label>
                  <label>
                    Единица измерения
                    <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                      <option>кг</option>
                      <option>г</option>
                      <option>л</option>
                      <option>шт</option>
                    </select>
                  </label>
                </div>
                <label>
                  Годен до
                  <input 
                    type="date" 
                    value={form.expiry} 
                    onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} 
                  />
                </label>
                <p className="form-hint">Продукт и его первая складская партия будут сохранены на сервере.</p>
                <button className="button primary full" type="submit">
                  <Plus size={16} /> Добавить на склад
                </button>
              </form>
            ) : modal === 'order' ? (
              <div className="modal-form order-builder">
                <p>Выберите блюда и укажите количество для нового заказа.</p>
                <div className="order-dish-list">
                  {menuDishes.map(dish => (
                    <article className={`order-dish ${selectedDishes[dish.id] ? 'is-selected' : ''}`} key={dish.id}>
                      <div className="order-dish-emoji">{dish.emoji}</div>
                      <div className="order-dish-info">
                        <strong>{dish.name}</strong>
                        <small>{money(dish.price)} · {dish.priority}</small>
                      </div>
                      <div className="quantity-control">
                        <button 
                          type="button" 
                          aria-label={`Уменьшить ${dish.name}`} 
                          disabled={!selectedDishes[dish.id]} 
                          onClick={() => setSelectedDishes(prev => ({ ...prev, [dish.id]: Math.max(0, (prev[dish.id] || 0) - 1) }))}
                        >
                          −
                        </button>
                        <span>{selectedDishes[dish.id] || 0}</span>
                        <button 
                          type="button" 
                          aria-label={`Добавить ${dish.name}`} 
                          disabled={!dish.isAvailable}
                          onClick={() => setSelectedDishes(prev => ({ ...prev, [dish.id]: (prev[dish.id] || 0) + 1 }))}
                        >
                          +
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="order-summary">
                  <span>Выбрано блюд: <strong>{selectedDishCount}</strong></span>
                  <span>Итого: <strong>{money(selectedDishTotal)}</strong></span>
                </div>
                <p className="form-hint">Сервер проверит стоп-лист и остатки, затем атомарно спишет ингредиенты по FIFO.</p>
                <button className="button primary full" onClick={createOrder}>
                  <Check size={16} /> Создать заказ
                </button>
                <button className="button secondary full" onClick={() => { setSelectedDishes({}); setModal(''); }}>
                  Отмена
                </button>
              </div>
            ) : (
              <form className="modal-form" onSubmit={e => { e.preventDefault(); addSupply(); }}>
                <div className="modal-illustration"><PackagePlus size={28} /></div>
                <label>Продукт
                  <select required value={supplyForm.productId} onChange={e => setSupplyForm(v => ({ ...v, productId: e.target.value }))}>
                    <option value="">Выберите продукт</option>
                    {products.map(product => <option key={product.id} value={product.id}>{product.name} ({product.unit})</option>)}
                  </select>
                </label>
                <label>Количество
                  <input required type="number" min="0.001" step="0.001" value={supplyForm.quantity} onChange={e => setSupplyForm(v => ({ ...v, quantity: e.target.value }))} />
                </label>
                <label>Годен до (необязательно)
                  <input type="date" value={supplyForm.expirationDate} onChange={e => setSupplyForm(v => ({ ...v, expirationDate: e.target.value }))} />
                </label>
                <p className="form-hint">Поставка сохраняется в БД и обновляет доступность блюд.</p>
                <button className="button primary full" type="submit"><Check size={16} /> Зарегистрировать поставку</button>
                <button type="button" className="button secondary full" onClick={() => setModal('')}>Отмена</button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}