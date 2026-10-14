import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Truck, ClipboardList, Boxes, Clock3, Ban, Flame, 
  ChartNoAxesCombined, Settings, Bell, Search, Plus, ChevronRight, Menu, X, 
  ChefHat, UtensilsCrossed, ArrowUpRight, PackagePlus, ShoppingBasket, FileChartColumn, 
  CircleHelp, LogOut, Check, AlertTriangle, CalendarDays, Filter, Download, 
  CircleCheck, Trash2, RefreshCw 
} from 'lucide-react';
import { dishes } from './data/mockData.js';

const nav = [
  ['Главная', LayoutDashboard], 
  ['Поставки', Truck], 
  ['Заказы', ClipboardList], 
  ['Блюда', UtensilsCrossed],
  ['Склад', Boxes], 
  ['Сроки годности', Clock3], 
  ['Стоп-лист', Ban], 
  ['Горячие предложения', Flame], 
  ['Аналитика', ChartNoAxesCombined], 
  ['Настройки', Settings]
];

const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
const readStorage = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const DEFAULT_ADMIN = { name: 'Администратор', email: 'admin@vkusbalans.ru', password: '', role: 'admin' };
const getInitialUsers = () => { const users = readStorage('vkus-balans-users', null); if (!users || !users.length) { try { localStorage.setItem('vkus-balans-users', JSON.stringify([DEFAULT_ADMIN])); } catch {} return [DEFAULT_ADMIN]; } return users; };

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
  const [signedIn, setSignedIn] = useState(() => { try { return localStorage.getItem('vkus-balans-signed-in') === 'true'; } catch { return false; } });
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [login, setLogin] = useState({ email: '', password: '', name: '' });
  const [users, setUsers] = useState(getInitialUsers);
  const [currentUser, setCurrentUser] = useState(() => { const email = (() => { try { return localStorage.getItem('vkus-balans-current-user'); } catch { return ''; } })(); return getInitialUsers().find(u => u.email === email) || null; });
  const userName = currentUser?.name?.trim() || currentUser?.email?.split('@')[0] || 'Пользователь';
const userFirstName = userName.split(' ')[0];
const userRole = currentUser?.role === 'admin' ? 'Администратор' : 'Сотрудник';
const userInitials = userName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [supplyForm, setSupplyForm] = useState({ supplier: '', items: [{ productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] });
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState(() => readStorage('mlp-products', []));
  const [menuDishes, setMenuDishes] = useState(() => readStorage('mlp-dishes', dishes));
  const [dishForm, setDishForm] = useState({ name: '', description: '', ingredients: '', category: 'Основное', price: '', kcal: '', protein: '', fat: '', carbs: '' });
  const [orders, setOrders] = useState(() => readStorage('mlp-orders', []));
  const [supplies, setSupplies] = useState(() => readStorage('mlp-supplies', []));
  useEffect(() => { try { localStorage.setItem('mlp-products', JSON.stringify(products)); } catch {} }, [products]);
  useEffect(() => { try { localStorage.setItem('mlp-dishes', JSON.stringify(menuDishes)); } catch {} }, [menuDishes]);
  useEffect(() => { try { localStorage.setItem('mlp-orders', JSON.stringify(orders)); } catch {} }, [orders]);
  useEffect(() => { try { localStorage.setItem('mlp-supplies', JSON.stringify(supplies)); } catch {} }, [supplies]);
  const [modal, setModal] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedHotDish, setSelectedHotDish] = useState(null);
  const [filter, setFilter] = useState('Все');
  const [range, setRange] = useState('7 дней');
  const [settings, setSettings] = useState({ alerts: true, autoStop: true, priority: true });
  const [form, setForm] = useState({ name: '', amount: '', unit: 'кг', expiry: '' });
  const [selectedDishes, setSelectedDishes] = useState({});
  
  const normalizedDishes = menuDishes.map((dish, index) => ({ ...dish, id: dish.id ?? `dish-${index + 1}`, price: dish.price === '' || dish.price == null ? null : Number(dish.price) }));
  
  const selectedDishCount = Object.values(selectedDishes).reduce((sum, qty) => sum + qty, 0);
  const selectedDishTotal = normalizedDishes.reduce((sum, dish) => sum + (Number(dish.price) || 0) * (selectedDishes[dish.id] || 0), 0);
  
  const filteredProducts = useMemo(() => 
    products.filter(p => 
      `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()) && 
      (filter === 'Все' || (filter === 'Скоро истекает' ? p.days != null && p.days <= 2 : filter === 'Просрочено' ? p.days != null && p.days <= 0 : p.category === filter))
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
  
  const addProduct = e => { 
    e.preventDefault(); 
    if (!form.name.trim() || Number(form.amount) <= 0) return; 
    setProducts(p => [...p, { 
      id: Date.now(), 
      name: form.name.trim(), 
      image: '/images/placeholder.svg', 
      amount: Number(form.amount), 
      unit: form.unit, 
      expiry: form.expiry || 'Не указано', 
      days: form.expiry ? Math.ceil((new Date(`${form.expiry}T00:00:00`).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000) : null, 
      category: 'Другое' 
    }]); 
    setForm({ name: '', amount: '', unit: 'кг', expiry: '' }); 
    setModal(''); 
    notify('Продукт добавлен на склад'); 
  };
  
  const createOrder = () => { 
    if (!selectedDishCount) { 
      notify('Выберите хотя бы одно блюдо'); 
      return; 
    } 
    const id = Math.max(...orders.map(o => o.id), 2000) + 1; 
    setOrders([{ 
      id, 
      date: new Date().toLocaleDateString('ru-RU'), 
      dishes: selectedDishCount, 
      status: 'В обработке', 
      amount: selectedDishTotal 
    }, ...orders]); 
    setSelectedDishes({}); 
    setModal(''); 
    notify(`Заказ №${id} создан`); 
  };
  
  const addSupply = e => {
    e?.preventDefault?.();
    const validItems = supplyForm.items.filter(item => item.productId || item.name.trim());
    if (!supplyForm.supplier.trim()) { notify('Укажите поставщика'); return; }
    if (!validItems.length || validItems.some(item => Number(item.quantity) <= 0 || !item.expiry || (!item.productId && !item.name.trim()))) {
      notify('Добавьте продукты, количество и срок годности для каждой позиции'); return;
    }
    const id = Math.max(...supplies.map(s => s.id), 1000) + 1;
    const receivedItems = validItems.map((item, index) => {
      const existing = products.find(p => String(p.id) === String(item.productId));
      const name = existing?.name || item.name.trim();
      const unit = existing?.unit || item.unit;
      const quantity = Number(item.quantity);
      const expiryDate = new Date(`${item.expiry}T00:00:00`);
      const days = Math.ceil((expiryDate.getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
      const newBatch = { id: Date.now() + index, name, image: existing?.image || '/images/placeholder.svg', amount: quantity, unit, expiry: new Date(`${item.expiry}T00:00:00`).toLocaleDateString('ru-RU'), days, category: existing?.category || 'Другое', batchSupplyId: id };
      return { name, quantity, unit, expiry: newBatch.expiry, productId: newBatch.id, batch: newBatch };
    });
    setProducts(prev => [...receivedItems.map(item => item.batch), ...prev]);
    setSupplies(prev => [{ id, supplier: supplyForm.supplier.trim(), date: new Date().toLocaleDateString('ru-RU'), amount: 0, status: 'Доставлена', items: receivedItems.map(({ batch, ...item }) => item) }, ...prev]);
    setSupplyForm({ supplier: '', items: [{ productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] });
    setModal('');
    notify(`Поставка №${id} зарегистрирована: ${receivedItems.length} позиций добавлено на склад`);
  };

  const addSupplyLine = () => setSupplyForm(f => ({ ...f, items: [...f.items, { productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] }));
  const updateSupplyLine = (index, key, value) => setSupplyForm(f => ({ ...f, items: f.items.map((item, i) => i === index ? { ...item, [key]: value, ...(key === 'productId' && value ? { name: '' } : {}) } : item) }));
  const registerUser = e => {
    e.preventDefault();
    const email = newUser.email.trim().toLowerCase();
    if (!newUser.name.trim() || !email) { notify('Укажите имя и корректную электронную почту'); return; }
    if (users.some(user => user.email.toLowerCase() === email)) { notify('Пользователь с такой почтой уже существует'); return; }
    const updated = [...users, { ...newUser, name: newUser.name.trim(), email }];
    setUsers(updated); try { localStorage.setItem('vkus-balans-users', JSON.stringify(updated)); } catch {}
    setNewUser({ name: '', email: '', password: '', role: 'employee' });
    notify('Пользователь зарегистрирован администратором');
  };

  const addDish = e => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') { notify('Добавлять блюда может только администратор'); return; }
    const dish = {
      id: `dish-${Date.now()}`,
      name: dishForm.name.trim(),
      description: dishForm.description.trim(),
      ingredients: dishForm.ingredients.trim(),
      category: dishForm.category,
      image: '',
      price: dishForm.price === '' ? null : Number(dishForm.price),
      kcal: Number(dishForm.kcal), protein: Number(dishForm.protein),
      fat: Number(dishForm.fat), carbs: Number(dishForm.carbs)
    };
    setMenuDishes(prev => [...prev, dish]);
    setModal('');
    notify(`Блюдо «${dish.name}» добавлено в меню`);
  };

  const openModal = type => { 
    setModal(type); 
    setForm({ name: '', amount: '', unit: 'кг', expiry: '' });
    if (type === 'dish') setDishForm({ name: '', description: '', ingredients: '', category: 'Основное', price: '', kcal: '', protein: '', fat: '', carbs: '' });
    if (type === 'supply') setSupplyForm({ supplier: '', items: [{ productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] });
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
                  <img className="food-emoji" src={p.image} alt={p.name} />
                  {p.name}
                </span>
              </td>
              <td className="strong-cell">{p.amount}</td>
              <td>{p.unit}</td>
              <td>{p.expiry}</td>
              <td>
                <Status tone={p.days == null ? 'amber' : p.days <= 0 ? 'red' : p.days <= 2 ? 'amber' : 'green'}>
                  {p.days == null ? 'Нет данных' : p.days <= 0 ? 'Просрочен' : p.days <= 2 ? `${p.days} дн.` : 'В норме'}
                </Status>
              </td>
              <td>
                <button className="icon-button" aria-label={`Удалить ${p.name}`} onClick={() => { 
                  setProducts(prev => prev.filter(x => x.id !== p.id)); 
                  notify('Продукт удалён'); 
                }}>
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
            <th>Сумма</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {supplies.map(s => (
            <React.Fragment key={s.id}>
              <tr>
                <td className="purple-text">#{s.id}</td>
                <td>{s.supplier}</td>
                <td>{s.date}</td>
                <td className="strong-cell">{s.amount ? money(s.amount) : "—"}</td>
                <td><Status>{s.status}</Status></td>
              </tr>
              <tr className="supply-items-row"><td colSpan="5"><strong>Состав поставки:</strong>{s.items?.length ? <div className="supply-item-chips">{s.items.map((item, i) => <span key={`${s.id}-${i}`}>{item.name} — {item.quantity} {item.unit}, годен до {item.expiry}</span>)}</div> : <span className="muted-inline">Состав не указан</span>}</td></tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {supplies.length === 0 && <EmptyState text="Поставок пока нет. Добавьте первую поставку, чтобы начать учёт партий." />}
    </div>
  );

  const expiring = products.filter(p => p.days != null && p.days <= 2);
  const today = new Date();
  const currentDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const currentWeekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(today);
  const currentTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(today);
  
  const notificationItems = [
    ...expiring.map(p => ({ 
      id: `expiry-${p.id}`, 
      title: p.days != null && p.days <= 0 ? `Истёк срок: ${p.name}` : `Скоро истекает: ${p.name}`, 
      text: `${p.amount} ${p.unit} · ${p.days != null && p.days <= 0 ? 'проверьте партию' : `осталось ${p.days} дн.`}`, 
      tone: p.days != null && p.days <= 0 ? 'red' : 'amber' 
    })), 
    ...(orders.length ? [{ id: 'orders', title: 'Заказы ресторана', text: `Всего заказов: ${orders.length}`, tone: 'purple' }] : [])
  ];
  
  // Стоп-лист и рекомендации не заполняются фиктивными записями: появятся из фактических данных склада и рецептур.
  const stopItems = [];
  const hotDishes = [];

  function Dashboard() { 
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">{currentWeekday.toLocaleUpperCase('ru-RU')}, {currentDate.toLocaleUpperCase('ru-RU')}</div>
            <h1>Добро пожаловать, {userFirstName}! <span className="wave">✦</span></h1>
            <p>Следите за остатками, сроками годности и эффективностью ресторана.</p>
          </div>
          <button className="button primary" onClick={() => openModal('product')}>
            <Plus size={17} /> Добавить продукт
          </button>
        </div>
        <div className="stats-grid">
          <StatCard icon={Boxes} label="Общий остаток продуктов" value={products.length} hint="наименований на складе" tone="purple" />
          <StatCard icon={AlertTriangle} label="Истекает срок годности" value={expiring.length} hint="требуют внимания" tone="orange" />
          <StatCard icon={CalendarDays} label="Ближайший срок" value={expiring.length ? `${Math.max(0, Math.min(...expiring.map(p => p.days)))} дн.` : '—'} hint="по данным склада" tone="blue" />
          <StatCard icon={ChefHat} label="Активных блюд в меню" value={menuDishes.length} hint="в каталоге блюд" tone="green" />
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
                  <img className="food-emoji" src={p.image} alt={p.name} />
                  <div className="expiry-info">
                    <strong>{p.name}</strong>
                    <small>{p.amount} {p.unit} · до {p.expiry}</small>
                  </div>
                  <Status tone={p.days == null ? 'amber' : p.days <= 0 ? 'red' : 'amber'}>
                    {p.days == null ? 'Нет данных' : p.days <= 0 ? 'Просрочено' : `${p.days} дн.`}
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
            <SectionTitle title="Динамика остатков" subtitle="График появится после накопления фактической истории движения продуктов." />
            <EmptyState text="Пока нет данных для построения графика. Зарегистрируйте поставки и движения продуктов." />
          </section>
          <section className="panel">
            <SectionTitle title="Последние заказы" subtitle="Обновление списка вручную" action="Все заказы" onAction={() => changePage('Заказы')} />
            <div className="recent-orders">
              {orders.length === 0 && <EmptyState text="Заказов пока нет" />}
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
            <button className="button secondary small" onClick={() => notify('Экспорт будет доступен после подключения сервера')}>
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
          <StatCard icon={AlertTriangle} label="Просрочено" value={products.filter(p => p.days != null && p.days <= 0).length} hint="позиций требуют проверки" tone="red" />
          <StatCard icon={CircleCheck} label="В пределах срока" value={products.filter(p => p.days != null && p.days > 2).length} hint="позиций" tone="green" />
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
                {[...products].sort((a, b) => a.days - b.days).map((p, i) => (
                  <tr key={p.id}>
                    <td>
                      <span className="product-name">
                        <img className="food-emoji" src={p.image} alt={p.name} />
                        {p.name}
                      </span>
                    </td>
                    <td>{p.batchSupplyId ? `ПР-${p.batchSupplyId}` : '—'}</td>
                    <td>{p.amount} {p.unit}</td>
                    <td>{p.expiry}</td>
                    <td>
                      <Status tone={p.days == null ? 'amber' : p.days <= 0 ? 'red' : p.days <= 2 ? 'amber' : 'green'}>
                        {p.days == null ? 'Нет данных' : p.days <= 0 ? 'Истёк' : `${p.days} дн.`}
                      </Status>
                    </td>
                    <td>{p.days != null && p.days <= 2 ? 'Использовать в первую очередь' : 'В обычном порядке'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <EmptyState text="Партий пока нет. Зарегистрируйте поставку, чтобы отслеживать сроки годности." />}
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
            <p>Стоп-лист будет рассчитан по рецептурам блюд и фактическим остаткам продуктов.</p>
          </div>
          <Status tone={stopItems.length ? 'red' : 'green'}>{stopItems.length} блюд</Status>
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
                {stopItems.length === 0 && <tr><td colSpan="4"><EmptyState text="Нет блюд в стоп-листе. После подключения рецептур доступность будет рассчитываться по остаткам." /></td></tr>}
                {stopItems.map((s, i) => (
                  <tr key={s.name}>
                    <td>
                      <span className="product-name">
                        <img className="food-emoji" src={s.image} alt={s.name} />
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
            <p>Список будет обновляться после подключения расчёта доступности на основе рецептур и остатков.</p>
          </div>
        </div>
      </>
    ); 
  }

  function Dishes() {
    return (
      <>
        <SectionTitle title="Блюда" subtitle="Основное меню ресторана, пищевая ценность и состав блюд." />
        <div className="toolbar">
          <span className="toolbar-note"><UtensilsCrossed size={18} /> {menuDishes.length} блюд в меню</span>
          {currentUser?.role === 'admin' && <button className="button primary" onClick={() => openModal('dish')}><Plus size={16} /> Добавить блюдо</button>}
        </div>
        {menuDishes.length === 0 ? <EmptyState text="В меню пока нет блюд." /> : <div className="dish-grid catalog-dish-grid">
          {normalizedDishes.map(dish => (
            <article className="dish-card" key={dish.id}>
              <div className="dish-art catalog-dish-art">
                {dish.image ? <img className="dish-art-img" src={dish.image} alt={dish.name} loading="lazy" /> : <ChefHat size={42} aria-label="Без изображения" />}
                <span className="dish-category-label">{dish.category || 'Блюдо'}</span>
              </div>
              <div className="dish-body">
                <h3>{dish.name}</h3>
                <p>{dish.description || 'Описание не добавлено.'}</p>
                <div className="catalog-nutrition">
                  <span><strong>{dish.kcal ?? '—'}</strong> ккал</span>
                  <span>Б <strong>{dish.protein ?? '—'}</strong> г</span>
                  <span>Ж <strong>{dish.fat ?? '—'}</strong> г</span>
                  <span>У <strong>{dish.carbs ?? '—'}</strong> г</span>
                </div>
                {dish.ingredients && <details className="dish-ingredients"><summary>Состав блюда</summary><p>{dish.ingredients}</p></details>}
              </div>
            </article>
          ))}
        </div>}
        <p className="dish-disclaimer catalog-disclaimer">КБЖУ указано на 100 г. Для блюд из исходного меню значения ориентировочные; для новых блюд их вводит администратор.</p>
      </>
    );
  }

  function HotOffers() { 
    return (
      <>
        <SectionTitle title="Горячие предложения" subtitle="Рекомендации блюд, которые помогут использовать продукты до окончания срока годности." />
        <div className="recommendation-note">
          <Flame size={20} />
          <span>Приоритет будет рассчитываться по фактическим партиям продуктов и составу блюд.</span>
        </div>
        {hotDishes.length === 0 ? <EmptyState text="Пока нет рекомендаций. Добавьте блюда и фактические партии продуктов, чтобы рассчитывать приоритет автоматически." /> : <div className="dish-grid">
          {hotDishes.map((d, i) => (
            <article className="dish-card dish-card-clickable" key={d.name} onClick={() => setSelectedHotDish(d)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedHotDish(d); }}>
              <div className="dish-art">
                {d.image
                  ? <img className="dish-art-img" src={d.image} alt={d.name} loading="lazy" />
                  : d.emoji}
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
        </div>}
        {selectedHotDish && (() => {
          const details = selectedHotDish;
          return createPortal(<div className="dish-modal-backdrop" onClick={() => setSelectedHotDish(null)}>
            <section className="dish-modal" role="dialog" aria-modal="true" aria-label={selectedHotDish.name} onClick={e => e.stopPropagation()}>
              <button className="dish-modal-close" aria-label="Закрыть" onClick={() => setSelectedHotDish(null)}><X size={22} /></button>
              {selectedHotDish.image ? <img className="dish-modal-image" src={selectedHotDish.image} alt={selectedHotDish.name} /> : <div className="dish-modal-image dish-modal-placeholder"><ChefHat size={48} /></div>}
              <div className="dish-modal-content">
                <span className="dish-modal-kicker">ИНФОРМАЦИЯ О БЛЮДЕ</span>
                <h2>{selectedHotDish.name}</h2>
                <p>{details.description}</p>
                <h3>Ингредиенты</h3>
                <p>{details.ingredients}</p>
                <h3>КБЖУ на 100 г</h3><div className="dish-nutrition"><div><span>Калории</span><strong>{details.kcal ?? '—'} ккал</strong></div><div><span>Белки</span><strong>{details.protein ?? '—'} г</strong></div><div><span>Жиры</span><strong>{details.fat ?? '—'} г</strong></div><div><span>Углеводы</span><strong>{details.carbs ?? '—'} г</strong></div></div>
                <small className="dish-disclaimer">Значения КБЖУ приблизительные на 100 г и зависят от точной рецептуры и количества ингредиентов.</small>
              </div>
            </section>
          </div>, document.body);
        })()}
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
          <button className="button secondary" onClick={() => notify('Отчёт будет доступен после подключения сервера')}>
            <Download size={16} /> Скачать отчёт
          </button>
        </div>
        <div className="stats-grid">
          <StatCard icon={Trash2} label="Списано продуктов" value="—" hint="нет записей о списании" tone="orange" />
          <StatCard icon={ChartNoAxesCombined} label="Доля списаний" value="—" hint="недостаточно данных" tone="green" />
          <StatCard icon={AlertTriangle} label="Дефицитных ингредиентов" value={products.filter(p => p.amount <= 0).length} hint="по текущим остаткам" tone="red" />
          <StatCard icon={Ban} label="Прогноз стоп-листа" value="—" hint="нужны рецептуры и история" tone="purple" />
        </div>
        <div className="analytics-grid">
          <section className="panel">
            <SectionTitle title="Списания по категориям" subtitle={`Период: ${range.toLowerCase()}`} />
            <EmptyState text="Нет данных о списаниях за выбранный период." />
          </section>
          <section className="panel">
            <SectionTitle title="Потребность в поставках" subtitle="По текущим остаткам" />
            {products.filter(p => p.amount < 2).map(p => (
              <div className="need-row" key={p.id}>
                <img className="food-emoji" src={p.image} alt={p.name} />
                <div>
                  <strong>{p.name}</strong>
                  <small>Остаток: {p.amount} {p.unit}</small>
                </div>
                <Status tone="amber">Пополнить</Status>
              </div>
            ))}
            {currentUser?.role === 'admin' && <button className="button primary full" onClick={() => openModal('supply')}>
              <Plus size={16} /> Создать поставку
            </button>}
          </section>
        </div>
      </>
    ); 
  }

  function SettingsPage() { 
    return (
      <>
        <SectionTitle title="Настройки" subtitle="Настройте правила мониторинга и уведомления для ресторана." />
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
          {currentUser?.role === 'admin' && <section className="admin-users-panel">
            <div className="admin-users-heading"><div><strong>Управление пользователями</strong><p>Создавать аккаунты сотрудников может только администратор.</p></div><Status tone="purple">Администратор</Status></div>
            <form className="admin-user-form" onSubmit={registerUser}>
              <label>Имя<input required value={newUser.name} onChange={e => setNewUser(v => ({ ...v, name: e.target.value }))} placeholder="Имя сотрудника" /></label>
              <label>Электронная почта<input required type="email" value={newUser.email} onChange={e => setNewUser(v => ({ ...v, email: e.target.value }))} placeholder="employee@example.com" /></label>
              <label>Пароль <span className="optional-field">не задаётся на этапе прототипа</span><input type="password" value={newUser.password} onChange={e => setNewUser(v => ({ ...v, password: e.target.value }))} placeholder="Настроит backend" autoComplete="new-password" /></label>
              <label>Роль<select value={newUser.role} onChange={e => setNewUser(v => ({ ...v, role: e.target.value }))}><option value="employee">Сотрудник</option><option value="admin">Администратор</option></select></label>
              <button className="button primary" type="submit"><Plus size={16} /> Зарегистрировать</button>
            </form>
            <div className="admin-users-list">{users.map(user => <div className="admin-user-row" key={user.email}><span><strong>{user.name || user.email.split('@')[0]}</strong><small>{user.email}</small></span><Status tone={user.role === 'admin' ? 'purple' : 'green'}>{user.role === 'admin' ? 'Администратор' : 'Сотрудник'}</Status></div>)}</div>
          </section>}
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
      case 'Главная': return Dashboard(); 
      case 'Поставки': return (
        <>
          <SectionTitle title="Поставки" subtitle="История поступления товаров и учёт партий продуктов." />
          <div className="toolbar">
            <div className="toolbar-note">
              <Truck size={18} /> Все поступления ресторана
            </div>
            {currentUser?.role === 'admin' && <button className="button primary" onClick={() => openModal('supply')}>
              <Plus size={16} /> Новая поставка
            </button>}
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
      case 'Блюда': return Dishes();
      case 'Склад': return Warehouse(); 
      case 'Сроки годности': return Expiry(); 
      case 'Стоп-лист': return StopList(); 
      case 'Горячие предложения': return HotOffers(); 
      case 'Аналитика': return Analytics(); 
      case 'Настройки': return SettingsPage(); 
      default: return Dashboard(); 
    } 
  };

  return (
    <div className="app-shell">
        <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <img src="/images/MLP.jpg" alt="MLP" />
          </div>
          <div>
            <strong>MLP</strong>
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
              {label === 'Стоп-лист' && <span className="nav-count">{stopItems.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="online-dot" />
          <div>
            <strong>Система работает</strong>
            <span>Обновлено в {currentTime}</span>
          </div>
        </div>
        <div className="profile">
          <div className="avatar">{userInitials}</div>
          <div>
            <strong>{userName}</strong>
            <span>{userRole}</span>
          </div>
          <button className="icon-button" aria-label="Выйти" onClick={() => { setSignedIn(false); setCurrentUser(null); try { localStorage.removeItem('vkus-balans-signed-in'); localStorage.removeItem('vkus-balans-current-user'); } catch {} }}>
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
            <div className="top-avatar">{userInitials}</div>
            <div className="user-label">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
          </div>
        </header>
        
        <div className="page-content">
          {pageContent()}
          <footer className="footer">
            <span>© {today.getFullYear()} MLP</span>
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
          <form className="auth-card" onSubmit={e => {
            e.preventDefault(); setAuthError('');
            const email = login.email.trim().toLowerCase();
            const storedUsers = getInitialUsers();
            if (authMode === 'register') { setAuthError('Регистрация доступна только администратору после входа в систему.'); return; }
            const foundUser = storedUsers.find(u => u.email.toLowerCase() === email && (u.role === 'admin' && !u.password ? !login.password.trim() : u.password === login.password));
            if (!foundUser) { setAuthError('Неверная почта или пароль.'); return; }
            setCurrentUser(foundUser);
            try { localStorage.setItem('vkus-balans-signed-in', 'true'); localStorage.setItem('vkus-balans-current-user', email); } catch {}
            setSignedIn(true); notify('Вы вошли в систему');
          }}>
            <div className="auth-logo"><img src="/images/MLP.jpg" alt="MLP" /></div>
            <span className="eyebrow">MLP</span>
            <h1>{authMode === 'register' ? 'Создать аккаунт' : 'С возвращением!'}</h1>
            <p>Войдите в систему под своей учётной записью.</p>
            
                        <label>Электронная почта<input type="email" required value={login.email} onChange={e => setLogin(v => ({ ...v, email: e.target.value }))} placeholder="name@example.com" /></label>
            <label>Пароль<input type="password" value={login.password} onChange={e => setLogin(v => ({ ...v, password: e.target.value }))} placeholder="Минимум 4 символа" /></label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button className="button primary full" type="submit">Войти в систему</button>
            <small>Учётные записи этого прототипа хранятся в текущем браузере. Для рабочей системы подключите серверную авторизацию.</small>
          </form>
        </div>
      )}
      
      {modal && (
        <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setModal(''); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-head">
              <div>
                <span className="eyebrow">MLP</span>
                <h2 id="modal-title">
                  {modal === 'product' ? 'Добавить продукт' : modal === 'dish' ? 'Добавить блюдо' : modal === 'order' ? 'Новый заказ' : 'Новая поставка'}
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
                <p className="form-hint">В демоверсии данные сохраняются только в состоянии страницы.</p>
                <button className="button primary full" type="submit">
                  <Plus size={16} /> Добавить на склад
                </button>
              </form>
            ) : modal === 'dish' ? (
              currentUser?.role === 'admin' ? <form onSubmit={addDish} className="modal-form">
                <label>Название блюда<input autoFocus required value={dishForm.name} onChange={e => setDishForm(v => ({ ...v, name: e.target.value }))} placeholder="Например, Паста с курицей" /></label>
                <label>Описание<textarea value={dishForm.description} onChange={e => setDishForm(v => ({ ...v, description: e.target.value }))} placeholder="Краткое описание блюда" rows="2" /></label>
                <label>Состав / ингредиенты<textarea value={dishForm.ingredients} onChange={e => setDishForm(v => ({ ...v, ingredients: e.target.value }))} placeholder="Перечислите ингредиенты" rows="2" /></label>
                <div className="form-row">
                  <label>Категория<select value={dishForm.category} onChange={e => setDishForm(v => ({ ...v, category: e.target.value }))}><option>Основное</option><option>Салаты</option><option>Супы</option><option>Пицца</option><option>Десерты</option><option>Напитки</option><option>Гарниры</option></select></label>
                  <label>Цена, ₽ <input type="number" min="0" step="0.01" value={dishForm.price} onChange={e => setDishForm(v => ({ ...v, price: e.target.value }))} placeholder="Необязательно" /></label>
                </div>
                <p className="form-section-label">КБЖУ на 100 г</p>
                <div className="form-row">
                  <label>Калории, ккал<input required type="number" min="0" step="0.1" value={dishForm.kcal} onChange={e => setDishForm(v => ({ ...v, kcal: e.target.value }))} /></label>
                  <label>Белки, г<input required type="number" min="0" step="0.1" value={dishForm.protein} onChange={e => setDishForm(v => ({ ...v, protein: e.target.value }))} /></label>
                </div>
                <div className="form-row">
                  <label>Жиры, г<input required type="number" min="0" step="0.1" value={dishForm.fat} onChange={e => setDishForm(v => ({ ...v, fat: e.target.value }))} /></label>
                  <label>Углеводы, г<input required type="number" min="0" step="0.1" value={dishForm.carbs} onChange={e => setDishForm(v => ({ ...v, carbs: e.target.value }))} /></label>
                </div>
                <p className="form-hint">Фото необязательно: блюдо появится с нейтральной иконкой. Новая запись сохраняется в этом браузере.</p>
                <button className="button primary full" type="submit"><Plus size={16} /> Добавить в меню</button>
              </form> : <EmptyState text="Добавлять блюда может только администратор." />
            ) : modal === 'order' ? (
              <div className="modal-form order-builder">
                <p>Выберите блюда и укажите количество для нового заказа.</p>
                <div className="order-dish-list">
                  {normalizedDishes.map(dish => (
                    <article className={`order-dish ${selectedDishes[dish.id] ? 'is-selected' : ''}`} key={dish.id}>
                     {dish.image ? <img className="order-dish-emoji" src={dish.image} alt={dish.name} /> : <span className="order-dish-placeholder"><ChefHat size={22} /></span>}
                      <div className="order-dish-info">
                        <strong>{dish.name}</strong>
                        <small>{dish.price == null ? 'Цена не указана' : money(dish.price)} · {dish.category || 'Блюдо'}</small>
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
                <p className="form-hint">Проверка ингредиентов и списание со склада выполняются после подключения серверной логики.</p>
                <button className="button primary full" onClick={createOrder}>
                  <Check size={16} /> Создать заказ
                </button>
                <button className="button secondary full" onClick={() => { setSelectedDishes({}); setModal(''); }}>
                  Отмена
                </button>
              </div>
            ) : (
              <form className="modal-form supply-form" onSubmit={addSupply}>
                <label>Поставщик<input required value={supplyForm.supplier} onChange={e => setSupplyForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Например, ООО «ФудПлюс»" /></label>
                <div className="supply-lines-heading"><div><strong>Продукты в поставке</strong><p>Выберите продукт со склада или добавьте новый. Для каждой партии укажите количество и срок годности.</p></div><button type="button" className="button secondary small" onClick={addSupplyLine}><Plus size={15} /> Добавить строку</button></div>
                {supplyForm.items.map((item, index) => {
                  const chosenProduct = products.find(p => String(p.id) === String(item.productId));
                  return <div className="supply-line supply-line-card" key={index}>
                    <div className="supply-card-top">
                      <div className="supply-product-thumb">{chosenProduct?.image ? <img src={chosenProduct.image} alt="" /> : <PackagePlus size={24} />}</div>
                      <div className="supply-line-title"><strong>Продукт {index + 1}</strong><span>{item.productId ? 'Из каталога' : 'Новая позиция'}</span></div>
                      {supplyForm.items.length > 1 && <button type="button" className="icon-button supply-delete" aria-label="Удалить позицию" onClick={() => setSupplyForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }))}><Trash2 size={16} /></button>}
                    </div>
                    <label>Продукт из каталога<select value={item.productId} onChange={e => updateSupplyLine(index, 'productId', e.target.value)}><option value="">＋ Добавить новый продукт</option>{products.filter((p, i, arr) => arr.findIndex(x => x.name.toLowerCase() === p.name.toLowerCase()) === i).map(p => <option key={p.id} value={String(p.id)}>{p.name} ({p.unit})</option>)}</select></label>
                    {!item.productId && <div className="form-row"><label>Название нового продукта<input required value={item.name} onChange={e => updateSupplyLine(index, 'name', e.target.value)} placeholder="Например, Клубника" /></label><label>Единица измерения<select value={item.unit} onChange={e => updateSupplyLine(index, 'unit', e.target.value)}><option>кг</option><option>г</option><option>л</option><option>шт</option></select></label></div>}
                    <div className="form-row"><label>Количество<input type="number" required min="0.01" step="0.01" value={item.quantity} onChange={e => updateSupplyLine(index, 'quantity', e.target.value)} placeholder="Например, 5" /></label><label>Срок годности<input type="date" required value={item.expiry} onChange={e => updateSupplyLine(index, 'expiry', e.target.value)} /></label></div>
                  </div>;
                })}
                <p className="form-hint">Каждая позиция попадёт в состав поставки и будет зарегистрирована отдельной партией на складе.</p>
                <button className="button primary full" type="submit"><Check size={16} /> Принять поставку</button>
                <button type="button" className="button secondary full" onClick={() => setModal('')}>Отмена</button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}