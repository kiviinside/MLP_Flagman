import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Truck, ClipboardList, Boxes, Clock3, Ban, Flame, 
  ChartNoAxesCombined, Settings, Bell, Search, Plus, ChevronRight, Menu, X, 
  ChefHat, ArrowUpRight, PackagePlus, ShoppingBasket, FileChartColumn, 
  CircleHelp, LogOut, Check, AlertTriangle, CalendarDays, Filter, Download, 
  CircleCheck, Trash2, RefreshCw 
} from 'lucide-react';
import { products as seedProducts, initialOrders, initialSupplies, dishes } from './data/mockData.js';

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
const readStorage = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const DEMO_ADMIN = { name: 'Администратор', email: 'admin@vkusbalans.ru', password: '', role: 'admin' };
const getInitialUsers = () => { const users = readStorage('vkus-balans-users', null); if (!users || !users.length) { try { localStorage.setItem('vkus-balans-users', JSON.stringify([DEMO_ADMIN])); } catch {} return [DEMO_ADMIN]; } if (!users.some(u => u.role === 'admin')) users[0].role = 'admin'; const admin = users.find(u => u.role === 'admin'); if (admin && admin.email.toLowerCase() === DEMO_ADMIN.email) admin.password = ''; try { localStorage.setItem('vkus-balans-users', JSON.stringify(users)); } catch {} return users; };

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
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [supplyForm, setSupplyForm] = useState({ supplier: '', items: [{ productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] });
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState(() => readStorage('vkus-balans-products', seedProducts));
  const [orders, setOrders] = useState(() => readStorage('vkus-balans-orders', initialOrders));
  const [supplies, setSupplies] = useState(() => readStorage('vkus-balans-supplies', initialSupplies));
  useEffect(() => { try { localStorage.setItem('vkus-balans-products', JSON.stringify(products)); } catch {} }, [products]);
  useEffect(() => { try { localStorage.setItem('vkus-balans-orders', JSON.stringify(orders)); } catch {} }, [orders]);
  useEffect(() => { try { localStorage.setItem('vkus-balans-supplies', JSON.stringify(supplies)); } catch {} }, [supplies]);
  const [modal, setModal] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedHotDish, setSelectedHotDish] = useState(null);
  const [filter, setFilter] = useState('Все');
  const [range, setRange] = useState('7 дней');
  const [settings, setSettings] = useState({ alerts: true, autoStop: true, priority: true });
  const [form, setForm] = useState({ name: '', amount: '', unit: 'кг', expiry: '' });
  const [selectedDishes, setSelectedDishes] = useState({});
  
  const menuDishes = dishes.map((dish, index) => ({ 
    ...dish, 
    id: index + 1, 
    price: [450, 380, 320, 520][index] || 350 
  }));
  
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
      days: 5, 
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
      const newBatch = { id: Date.now() + index, name, image: existing?.image || '/images/placeholder.jpg', amount: quantity, unit, expiry: new Date(`${item.expiry}T00:00:00`).toLocaleDateString('ru-RU'), days, category: existing?.category || 'Другое', batchSupplyId: id };
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

  const openModal = type => { 
    setModal(type); 
    setForm({ name: '', amount: '', unit: 'кг', expiry: '' });
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
                <Status tone={p.days <= 0 ? 'red' : p.days <= 2 ? 'amber' : 'green'}>
                  {p.days <= 0 ? 'Просрочен' : p.days <= 2 ? `${p.days} дн.` : 'В норме'}
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
              <tr className="supply-items-row"><td colSpan="5"><strong>Состав поставки:</strong>{s.items?.length ? <div className="supply-item-chips">{s.items.map((item, i) => <span key={`${s.id}-${i}`}>{item.name} — {item.quantity} {item.unit}, годен до {item.expiry}</span>)}</div> : <span className="muted-inline">Состав для старых демонстрационных записей не указан</span>}</td></tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  const expiring = products.filter(p => p.days <= 2);
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
  
  const stopItems = [
    { name: 'Паста карбонара', reason: 'Недостаточно сливок' }, 
    { name: 'Салат с курицей', reason: 'Недостаточно куриного филе' }, 
    { name: 'Чизкейк', reason: 'Нет сливочного сыра' }
  ];
  const hotDishes = dishes.map(d => ({ ...d, blocked: false }));

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
          <StatCard icon={Boxes} label="Общий остаток продуктов" value={products.length ? '186' : '0'} hint="наименований на складе" tone="purple" />
          <StatCard icon={AlertTriangle} label="Истекает срок годности" value={expiring.length + 4} hint="требуют внимания" tone="orange" />
          <StatCard icon={CalendarDays} label="Ближайший срок" value="1 день" hint="сметана и салат" tone="blue" />
          <StatCard icon={ChefHat} label="Активных блюд в меню" value="48" hint="из 52 блюд" tone="green" />
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
          <StatCard icon={AlertTriangle} label="Просрочено" value={products.filter(p => p.days <= 0).length} hint="позиций требуют проверки" tone="red" />
          <StatCard icon={CircleCheck} label="В пределах срока" value={products.filter(p => p.days > 2).length} hint="позиций" tone="green" />
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
                      </span>
                    </td>
                    <td>ПР-{String(201 + i).padStart(3, '0')}</td>
                    <td>{p.amount} {p.unit}</td>
                    <td>{p.expiry}</td>
                    <td>
                      <Status tone={p.days <= 0 ? 'red' : p.days <= 2 ? 'amber' : 'green'}>
                        {p.days <= 0 ? 'Истёк' : `${p.days} дн.`}
                      </Status>
                    </td>
                    <td>{p.days <= 2 ? 'Использовать в первую очередь' : 'В обычном порядке'}</td>
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
          <Status tone="red">{stopItems.length} блюда</Status>
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
            <p>После регистрации новой поставки и обновления складских остатков доступность должна быть пересчитана. В этой демонстрации серверная синхронизация пока не подключена.</p>
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
          <span>Приоритет рассчитан по демонстрационным данным: чем ближе срок годности ингредиента, тем выше рекомендация.</span>
        </div>
        <div className="dish-grid">
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
        </div>
        {selectedHotDish && (() => {
          const details = {
            'Цезарь с курицей': { description: 'Популярный салат с сочной курицей, хрустящими листьями салата и пикантной заправкой.', ingredients: 'Куриное филе, листья салата, помидоры, сухарики, пармезан, соус «Цезарь».', kcal: 190, protein: 14, fat: 11, carbs: 8 },
            'Греческий салат': { description: 'Свежий овощной салат с сыром фета и лёгкой заправкой на основе оливкового масла.', ingredients: 'Помидоры, огурцы, сладкий перец, красный лук, сыр фета, маслины, оливковое масло.', kcal: 130, protein: 4, fat: 10, carbs: 6 },
            'Суп грибной': { description: 'Нежный ароматный грибной суп со сливочным вкусом.', ingredients: 'Шампиньоны, картофель, лук, морковь, сливки или сметана, зелень, соль и перец.', kcal: 65, protein: 2, fat: 4, carbs: 6 },
            'Пицца Маргарита': { description: 'Классическая пицца с томатным соусом, расплавленной моцареллой и базиликом.', ingredients: 'Тесто, томатный соус, моцарелла, помидоры, базилик, оливковое масло.', kcal: 250, protein: 11, fat: 9, carbs: 31 }
          }[selectedHotDish.name] || {};
          return createPortal(<div className="dish-modal-backdrop" onClick={() => setSelectedHotDish(null)}>
            <section className="dish-modal" role="dialog" aria-modal="true" aria-label={selectedHotDish.name} onClick={e => e.stopPropagation()}>
              <button className="dish-modal-close" aria-label="Закрыть" onClick={() => setSelectedHotDish(null)}><X size={22} /></button>
              <img className="dish-modal-image" src={selectedHotDish.image} alt={selectedHotDish.name} />
              <div className="dish-modal-content">
                <span className="dish-modal-kicker">ГОРЯЧЕЕ ПРЕДЛОЖЕНИЕ</span>
                <h2>{selectedHotDish.name}</h2>
                <p>{details.description}</p>
                <h3>Ингредиенты</h3>
                <p>{details.ingredients}</p>
                <h3>КБЖУ на 100 г</h3><div className="dish-nutrition"><div><span>Калории</span><strong>{details.kcal} ккал</strong></div><div><span>Белки</span><strong>{details.protein} г</strong></div><div><span>Жиры</span><strong>{details.fat} г</strong></div><div><span>Углеводы</span><strong>{details.carbs} г</strong></div></div>
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
          <StatCard icon={Trash2} label="Списано продуктов" value="12,4 кг" hint="за выбранный период" tone="orange" />
          <StatCard icon={ChartNoAxesCombined} label="Доля списаний" value="3,2%" hint="от общего объёма" tone="green" />
          <StatCard icon={AlertTriangle} label="Дефицитных ингредиентов" value="5" hint="требуют пополнения" tone="red" />
          <StatCard icon={Ban} label="Прогноз стоп-листа" value="3 дня" hint="оценка по остаткам" tone="purple" />
        </div>
        <div className="analytics-grid">
          <section className="panel">
            <SectionTitle title="Списания по категориям" subtitle={`Период: ${range.toLowerCase()}`} />
            {[['Овощи', 42, 'purple'], ['Мясо', 28, 'pink'], ['Молочные продукты', 18, 'blue'], ['Фрукты', 7, 'orange'], ['Прочее', 5, 'green']].map(([name, v, c]) => (
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
            <div className="admin-users-list">{users.map(user => <div className="admin-user-row" key={user.email}><span><strong>{user.name}</strong><small>{user.email}</small></span><Status tone={user.role === 'admin' ? 'purple' : 'green'}>{user.role === 'admin' ? 'Администратор' : 'Сотрудник'}</Status></div>)}</div>
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
            <ChefHat size={26} />
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
            <div className="top-avatar">АИ</div>
            <div className="user-label">
              <strong>Алексей</strong>
              <span>Администратор</span>
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
            const foundUser = storedUsers.find(u => u.email.toLowerCase() === email && (u.role === 'admin' ? !login.password.trim() : u.password === login.password));
            if (!foundUser) { setAuthError('Неверная почта или пароль.'); return; }
            setCurrentUser(foundUser);
            try { localStorage.setItem('vkus-balans-signed-in', 'true'); localStorage.setItem('vkus-balans-current-user', email); } catch {}
            setSignedIn(true); notify('Вы вошли в систему');
          }}>
            <div className="auth-logo"><ChefHat size={30} /></div>
            <span className="eyebrow">MLP</span>
            <h1>{authMode === 'register' ? 'Создать аккаунт' : 'С возвращением!'}</h1>
            <p>Войдите в систему. Регистрацию сотрудников выполняет администратор.</p>
            <p className="auth-admin-note">Демо-доступ администратора: <strong>admin@vkusbalans.ru</strong>, пароль не требуется.</p>
                        <label>Электронная почта<input type="email" required value={login.email} onChange={e => setLogin(v => ({ ...v, email: e.target.value }))} placeholder="name@example.com" /></label>
            <label>Пароль<input type="password" value={login.password} onChange={e => setLogin(v => ({ ...v, password: e.target.value }))} placeholder="Минимум 4 символа" /></label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button className="button primary full" type="submit">Войти в систему</button>
            <small>Демо-режим: учётные записи хранятся в этом браузере. Для защиты в рабочей системе требуется серверная авторизация.</small>
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
                <p className="form-hint">В демоверсии данные сохраняются только в состоянии страницы.</p>
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
                     <img className="order-dish-emoji" src={dish.image} alt={dish.name} />
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
                <p className="form-hint">Демонстрационный режим: наличие ингредиентов и списание со склада подключаются через API.</p>
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