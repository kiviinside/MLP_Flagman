import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Truck, ClipboardList, Boxes, Clock3, Ban, Flame, 
  ChartNoAxesCombined, Settings, Bell, Search, Plus, ChevronRight, Menu, X, 
  ChefHat, UtensilsCrossed, ArrowUpRight, PackagePlus, ShoppingBasket, FileChartColumn, 
  CircleHelp, LogOut, Check, AlertTriangle, CalendarDays, Filter, Download, 
  CircleCheck, Trash2, RefreshCw 
} from 'lucide-react';
import { apiRequest, setApiCredentials, clearApiCredentials } from './api/http.js';

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
  ['Списания', Trash2],
  ['Настройки', Settings]
];

const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
const readStorage = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const productImageFor = (name = '') => {
  const n = String(name).toLowerCase();
  if (/молок/.test(n)) return '/images/milk.jpg';
  if (/огур/.test(n)) return '/images/cucumber.jpg';
  if (/яйц/.test(n)) return '/images/eggs.jpg';
  if (/мук/.test(n)) return '/images/muka.jpg';
  if (/куриц|филе/.test(n)) return '/images/chiken.jpg';
  if (/сметан/.test(n)) return '/images/sourCream.jpg';
  if (/моцарел|сыр/.test(n)) return '/images/mocarella.jpg';
  if (/салат|листь/.test(n)) return '/images/listSalata.jpg';
  if (/помидор|томат/.test(n)) return '/images/tomato.jpg';
  return '/images/placeholder.svg';
};
const normalizeName = value => String(value || '').trim().toLocaleLowerCase('ru-RU');
const productCategoryFor = (name = '') => {
  const n = String(name).toLowerCase();
  if (/молок|сыр|сметан|сливк|йогурт|творог|моцарел/.test(n)) return 'Молочные продукты';
  if (/куриц|говядин|свинин|мясо|филе|рыб|фарш/.test(n)) return 'Мясо';
  if (/огур|помидор|томат|салат|морков|картоф|лук|клубник|перец|овощ/.test(n)) return 'Овощи';
  return 'Другое';
};

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
  const [readNotificationIds, setReadNotificationIds] = useState(() => readStorage('mlp-read-notifications', []));
  const [profileOpen, setProfileOpen] = useState(false);
  const [writeOffRequests, setWriteOffRequests] = useState(() => readStorage('mlp-writeoff-requests', []));
  const [writeOffForm, setWriteOffForm] = useState({ productId: '', quantity: '', reason: 'Порча и брак', comment: '' });
  useEffect(() => { try { localStorage.setItem('mlp-writeoff-requests', JSON.stringify(writeOffRequests)); } catch {} }, [writeOffRequests]);
  useEffect(() => { try { localStorage.setItem('mlp-read-notifications', JSON.stringify(readNotificationIds)); } catch {} }, [readNotificationIds]);
  const [signedIn, setSignedIn] = useState(false);
    const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const userName = currentUser?.name?.trim() || currentUser?.login || currentUser?.email?.split('@')[0] || 'Пользователь';
  const userFirstName = userName.split(' ')[0];
  const userRole = currentUser?.role === 'admin' ? 'Администратор' : 'Сотрудник';
  const userInitials = userName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [supplyForm, setSupplyForm] = useState({ supplier: '', items: [{ productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] });
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [stockBatches, setStockBatches] = useState([]);
  const [menuDishes, setMenuDishes] = useState([]);
  const [dishForm, setDishForm] = useState({ name: '', description: '', ingredients: '', category: 'Основное', price: '', kcal: '', protein: '', fat: '', carbs: '' });
  const [dishRecipeItems, setDishRecipeItems] = useState([{ productId: '', requiredQuantity: '0.1' }]);
  const [dishMetadata, setDishMetadata] = useState(() => readStorage('mlp-dish-display-metadata', {}));
  const [supplyMetadata, setSupplyMetadata] = useState(() => readStorage('mlp-supply-display-metadata', {}));
  useEffect(() => { try { localStorage.setItem('mlp-dish-display-metadata', JSON.stringify(dishMetadata)); } catch {} }, [dishMetadata]);
  useEffect(() => { try { localStorage.setItem('mlp-supply-display-metadata', JSON.stringify(supplyMetadata)); } catch {} }, [supplyMetadata]);
  const [orders, setOrders] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [stopItems, setStopItems] = useState([]);
  const [hotDishes, setHotDishes] = useState([]);
  const [writeOffs, setWriteOffs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [modal, setModal] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedHotDish, setSelectedHotDish] = useState(null);
  const [dishPhoto, setDishPhoto] = useState('');
  const [filter, setFilter] = useState('Все');
  const [range, setRange] = useState('7 дней');
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vkus-balans-settings')) || { alerts: true, autoStop: true, priority: true }; }
    catch { return { alerts: true, autoStop: true, priority: true }; }
  });
  useEffect(() => { try { localStorage.setItem('vkus-balans-settings', JSON.stringify(settings)); } catch {} }, [settings]);
  useEffect(() => {
    if (!signedIn) return;
    const days = range === '7 дней' ? 7 : range === '90 дней' ? 90 : 30;
    const asLocalDateTime = value => {
      const pad = part => String(part).padStart(2, '0');
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
    };
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    apiRequest(`/api/analytics/write-offs?from=${encodeURIComponent(asLocalDateTime(from))}&to=${encodeURIComponent(asLocalDateTime(to))}`)
      .then(setWriteOffs)
      .catch(() => {});
  }, [range, signedIn]);
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
  
  const formatDate = value => value ? new Intl.DateTimeFormat('ru-RU').format(new Date(value)) : '—';
  const formatDateTimeForApi = date => date ? `${date}T23:59:00` : null;
  const mapServerDish = (serverDish, baseDish = {}) => {
    const extra = readStorage('mlp-dish-display-metadata', {})[String(serverDish.id)] || dishMetadata[String(serverDish.id)] || {};
    const recipeText = (serverDish.recipe || []).map(line => `${line.productName} (${line.requiredQuantity})`).join(', ');
    return {
      ...baseDish,
      ...serverDish,
      ...extra,
      id: serverDish.id,
      backendId: serverDish.id,
      name: serverDish.name,
      price: serverDish.price == null ? (extra.price ?? baseDish.price ?? null) : Number(serverDish.price),
      image: extra.image ?? baseDish.image ?? '',
      category: extra.category ?? baseDish.category ?? 'Блюда',
      description: extra.description ?? baseDish.description ?? '',
      ingredients: recipeText || extra.ingredients || baseDish.ingredients || '',
      kcal: extra.kcal ?? baseDish.kcal ?? null,
      protein: extra.protein ?? baseDish.protein ?? null,
      fat: extra.fat ?? baseDish.fat ?? null,
      carbs: extra.carbs ?? baseDish.carbs ?? null,
      isAvailable: serverDish.isAvailable,
      recipe: serverDish.recipe || []
    };
  };

  const loadData = async () => {
    const results = await Promise.allSettled([
      apiRequest('/api/dashboard'),
      apiRequest('/api/admin/products'),
      apiRequest('/api/admin/dishes'),
      apiRequest('/api/warehouse/summary'),
      apiRequest('/api/warehouse/batches'),
      apiRequest('/api/orders'),
      apiRequest('/api/supplies'),
      apiRequest('/api/stop-list'),
      apiRequest('/api/hot-offers'),
      apiRequest('/api/analytics/write-offs'),
      apiRequest('/api/admin/users')
    ]);
    const value = index => results[index].status === 'fulfilled' ? results[index].value : null;
    const dashboard = value(0);
    const catalogResponse = value(1);
    const serverDishResponse = value(2);
    const stockSummary = value(3) || [];
    const batchResponse = value(4) || [];
    const orderResponse = value(5) || [];
    const supplyResponse = value(6) || [];
    const stopResponse = value(7) || [];
    const offerResponse = value(8) || [];
    const writeOffResponse = value(9) || [];
    const userResponse = value(10);
    const catalog = catalogResponse || stockSummary.map(row => ({ id: row.productId, name: row.name, unit: row.unit, minThreshold: row.minThreshold, shelfLifeHours: null }));
    const summaryById = new Map(stockSummary.map(row => [Number(row.productId), row]));
    const batchesByProduct = new Map();
    batchResponse.forEach(batch => {
      const key = Number(batch.productId);
      const group = batchesByProduct.get(key) || [];
      group.push(batch);
      batchesByProduct.set(key, group);
    });
    const mappedBatches = batchResponse.map(batch => ({
      id: batch.id,
      productId: batch.productId,
      name: batch.productName,
      image: productImageFor(batch.productName),
      amount: Number(batch.remainingQuantity ?? 0),
      originalAmount: Number(batch.quantity ?? 0),
      unit: batch.unit,
      expiry: formatDate(batch.expirationDate),
      expiryRaw: batch.expirationDate,
      days: Number.isFinite(Number(batch.hoursLeft)) ? Math.floor(Number(batch.hoursLeft) / 24) : null,
      hoursLeft: Number(batch.hoursLeft ?? 0),
      category: productCategoryFor(batch.productName),
      batchSupplyId: batch.supplyId,
      status: batch.status
    }));
    setStockBatches(mappedBatches);
    setProducts(catalog.map(product => {
      const id = Number(product.id);
      const productBatches = (batchesByProduct.get(id) || []).filter(batch => Number(batch.remainingQuantity) > 0)
        .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
      const summary = summaryById.get(id);
      const amount = Number(summary?.available ?? productBatches.reduce((sum, batch) => sum + Number(batch.remainingQuantity || 0), 0));
      const firstExpiry = productBatches[0];
      return {
        id: product.id, name: product.name, image: productImageFor(product.name), amount,
        unit: product.unit || 'шт', expiry: firstExpiry ? formatDate(firstExpiry.expirationDate) : 'Нет партий',
        days: firstExpiry ? Math.floor(Number(firstExpiry.hoursLeft) / 24) : null,
        category: productCategoryFor(product.name), minThreshold: Number(product.minThreshold || 0), shelfLifeHours: product.shelfLifeHours
      };
    }));

    // В каталоге показываем только блюда, реально полученные из серверного API.
    // Демонстрационные блюда больше не подмешиваются в меню и оформление заказов.
    const serverDishes = Array.isArray(serverDishResponse) ? serverDishResponse : [];
    setMenuDishes(serverDishes.map(item => mapServerDish(item)));

    const dishById = new Map(serverDishes.map(dish => [Number(dish.id), dish]));
    setOrders(orderResponse.map(order => ({
      id: order.id, orderNumber: order.orderNumber, date: formatDate(order.createdAt),
      dishes: (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      status: ({ CREATED: 'В обработке', COMPLETED: 'Завершён', CANCELLED_OUT_OF_STOCK: 'Отказ: нет остатков' })[order.status] || order.status,
      amount: (order.items || []).reduce((sum, item) => sum + Number(dishById.get(Number(item.dishId))?.price || 0) * Number(item.quantity || 0), 0),
      rawStatus: order.status, items: order.items || []
    })));

    const batchesBySupply = new Map();
    batchResponse.forEach(batch => {
      const key = String(batch.supplyId);
      const group = batchesBySupply.get(key) || [];
      group.push(batch);
      batchesBySupply.set(key, group);
    });
    setSupplies(supplyResponse.map(supply => {
      const id = String(supply.supplyId);
      const items = (batchesBySupply.get(id) || []).map(batch => ({
        name: batch.productName, quantity: Number(batch.quantity), unit: batch.unit, expiry: formatDate(batch.expirationDate)
      }));
      return {
        id, supplier: readStorage('mlp-supply-display-metadata', {})[id] || supplyMetadata[id] || '—', date: formatDate(supply.createdAt),
        amount: Number(supply.totalQuantity || 0), status: supply.status === 'RECEIVED' ? 'Доставлена' : (supply.status || 'Принята'),
        items, itemCount: supply.itemCount
      };
    }));
    setStopItems(stopResponse.map(item => ({
      id: item.dishId, name: item.dishName,
      image: (serverDishes.find(d => Number(d.id) === Number(item.dishId)) && mapServerDish(serverDishes.find(d => Number(d.id) === Number(item.dishId))).image) || '',
      reason: item.missingIngredients?.length ? item.missingIngredients.join(', ') : 'Недостаточно ингредиентов'
    })));
    setHotDishes(offerResponse.map(offer => {
      const serverDish = serverDishes.find(d => Number(d.id) === Number(offer.dishId));
      const base = serverDish ? mapServerDish(serverDish) : null;
      return {
        ...(base || {}), id: offer.dishId, backendId: offer.dishId, name: offer.dishName,
        price: Number(offer.price || base?.price || 0), reasons: offer.reasons || [],
        reason: (offer.reasons || []).join(', ') || 'Рекомендация на основе складских остатков',
        recommendedDiscountPercent: offer.recommendedDiscountPercent,
        priority: Number(offer.score || 0) >= 1 ? 'Высокий приоритет' : 'Средний приоритет',
        emoji: '🍽️', image: base?.image || ''
      };
    }));
    setWriteOffs(writeOffResponse);
    setDashboardData(dashboard);
    if (Array.isArray(userResponse)) setUsers(userResponse.map(user => ({
      id: user.id, name: user.login, email: user.login,
      role: String(user.role).toUpperCase() === 'ADMIN' ? 'admin' : 'employee', active: user.active
    })));
    setApiConnected(true);
    return { isAdmin: Boolean(catalogResponse) };
  };

  const handleLogin = async e => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const username = login.email.trim();
    if (!username || !login.password) {
      setAuthError('Введите логин и пароль от серверной учётной записи.');
      setLoading(false);
      return;
    }
    setApiCredentials(username, login.password);
    try {
      await apiRequest('/api/dashboard');
      let role = 'employee';
      try { await apiRequest('/api/admin/products'); role = 'admin'; }
      catch (error) { if (error.status !== 403) throw error; }
      setCurrentUser({ login: username, name: username === 'admin' ? 'Администратор' : username, email: username, role });
      await loadData();
      setSignedIn(true);
      notify('Подключение к серверу установлено');
    } catch (error) {
      clearApiCredentials();
      setAuthError(error.message || 'Не удалось подключиться к серверу. Проверьте адрес API, логин и пароль.');
      setApiConnected(false);
    } finally { setLoading(false); }
  };

  // Восстанавливаем проверенную сессию после обновления страницы. Пароль не хранится в localStorage.
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const stored = (() => { try { return JSON.parse(sessionStorage.getItem('mlp-api-credentials') || 'null'); } catch { return null; } })();
      if (!stored?.username || !stored?.password) return;
      try {
        await apiRequest('/api/dashboard');
        let role = 'employee';
        try { await apiRequest('/api/admin/products'); role = 'admin'; }
        catch (error) { if (error.status !== 403) throw error; }
        if (cancelled) return;
        const username = stored.username;
        setCurrentUser({ login: username, name: username, email: username, role });
        await loadData();
        if (!cancelled) setSignedIn(true);
      } catch {
        clearApiCredentials();
      }
    };
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const addProduct = async e => {
    e.preventDefault();
    if (!form.name.trim() || Number(form.amount) <= 0) { notify('Укажите название и положительное количество'); return; }
    try {
      const product = await apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ name: form.name.trim(), unit: form.unit, minThreshold: 0, shelfLifeHours: 168 })
      });
      const supplyNumber = `SUP-${Date.now()}`;
      await apiRequest('/api/supplies', {
        method: 'POST',
        body: JSON.stringify({ supplyNumber, items: [{ productId: product.id, quantity: Number(form.amount), expirationDate: formatDateTimeForApi(form.expiry) }] })
      });
      await loadData();
      setForm({ name: '', amount: '', unit: 'кг', expiry: '' }); setModal('');
      notify('Продукт и складская партия сохранены на сервере');
    } catch (error) { notify(error.message || 'Не удалось сохранить продукт'); }
  };

  const deleteProduct = async product => {
    try {
      await apiRequest(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      await loadData(); notify('Продукт удалён');
    } catch (error) { notify(error.message || 'Не удалось удалить продукт'); }
  };

  const createOrder = async () => {
    const items = normalizedDishes.filter(dish => dish.backendId && Number(selectedDishes[dish.id]) > 0)
      .map(dish => ({ dishId: Number(dish.backendId), quantity: Number(selectedDishes[dish.id]) }));
    if (!items.length) { notify('Выберите блюдо, у которого есть серверная рецептура'); return; }
    try {
      const order = await apiRequest('/api/orders', { method: 'POST', body: JSON.stringify({ items }) });
      await loadData(); setSelectedDishes({}); setModal('');
      if (order.status === 'CREATED') notify(`Заказ ${order.orderNumber} создан, ингредиенты списаны`);
      else notify(order.rejectionReason || 'Заказ отклонён: проверьте остатки и стоп-лист');
    } catch (error) {
      if (error.status === 409 && error.payload?.orderNumber) {
        await loadData().catch(() => {}); setSelectedDishes({}); setModal('');
        notify(error.payload.rejectionReason || 'Заказ отклонён: проверьте остатки и стоп-лист');
      } else notify(error.message || 'Не удалось создать заказ');
    }
  };

  const addSupply = async e => {
    e?.preventDefault?.();
    const validItems = supplyForm.items.filter(item => item.productId || item.name.trim());
    if (!supplyForm.supplier.trim()) { notify('Укажите поставщика'); return; }
    if (!validItems.length || validItems.some(item => Number(item.quantity) <= 0 || !item.expiry || (!item.productId && !item.name.trim()))) {
      notify('Добавьте продукты, количество и срок годности для каждой позиции'); return;
    }
    try {
      const apiItems = [];
      for (const item of validItems) {
        let productId = Number(item.productId);
        if (!item.productId) {
          const expiryHours = Math.max(1, Math.ceil((new Date(`${item.expiry}T23:59:00`).getTime() - Date.now()) / 3600000));
          const created = await apiRequest('/api/admin/products', {
            method: 'POST',
            body: JSON.stringify({ name: item.name.trim(), unit: item.unit, minThreshold: 0, shelfLifeHours: expiryHours })
          });
          productId = Number(created.id);
        }
        apiItems.push({ productId, quantity: Number(item.quantity), expirationDate: formatDateTimeForApi(item.expiry) });
      }
      const supplyNumber = `SUP-${Date.now()}`;
      await apiRequest('/api/supplies', { method: 'POST', body: JSON.stringify({ supplyNumber, items: apiItems }) });
      const nextSupplyMetadata = { ...readStorage('mlp-supply-display-metadata', {}), [supplyNumber]: supplyForm.supplier.trim() };
      try { localStorage.setItem('mlp-supply-display-metadata', JSON.stringify(nextSupplyMetadata)); } catch {}
      setSupplyMetadata(nextSupplyMetadata);
      await loadData();
      setSupplyForm({ supplier: '', items: [{ productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] });
      setModal(''); notify(`Поставка ${supplyNumber} зарегистрирована, остатки обновлены`);
    } catch (error) { notify(error.message || 'Не удалось зарегистрировать поставку'); }
  };

  const addSupplyLine = () => setSupplyForm(f => ({ ...f, items: [...f.items, { productId: '', name: '', quantity: '', unit: 'кг', expiry: '' }] }));
  const updateSupplyLine = (index, key, value) => setSupplyForm(f => ({ ...f, items: f.items.map((item, i) => i === index ? { ...item, [key]: value, ...(key === 'productId' && value ? { name: '' } : {}) } : item) }));

  const registerUser = async e => {
    e.preventDefault();
    const username = newUser.email.trim();
    if (!/^[a-zA-Z0-9._-]{3,100}$/.test(username)) { notify('Логин: от 3 символов, латинские буквы, цифры, точка, дефис или подчёркивание'); return; }
    if (newUser.password.length < 12) { notify('Пароль сотрудника должен содержать минимум 12 символов'); return; }
    try {
      await apiRequest('/api/admin/users', { method: 'POST', body: JSON.stringify({ login: username, password: newUser.password }) });
      const refreshed = await apiRequest('/api/admin/users');
      setUsers(refreshed.map(user => ({ id: user.id, name: user.login, email: user.login, role: String(user.role).toUpperCase() === 'ADMIN' ? 'admin' : 'employee', active: user.active })));
      setNewUser({ name: '', email: '', password: '', role: 'employee' });
      notify('Учётная запись сотрудника создана на сервере');
    } catch (error) { notify(error.message || 'Не удалось создать пользователя'); }
  };

  const addDish = async e => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') { notify('Добавлять блюда может только администратор'); return; }
    const recipe = dishRecipeItems.filter(item => item.productId && Number(item.requiredQuantity) > 0)
      .map(item => ({ productId: Number(item.productId), requiredQuantity: Number(item.requiredQuantity) }));
    if (!recipe.length) { notify('Добавьте хотя бы один ингредиент из каталога продуктов и укажите количество'); return; }
    try {
      const created = await apiRequest('/api/admin/dishes', {
        method: 'POST',
        body: JSON.stringify({ name: dishForm.name.trim(), price: Number(dishForm.price || 0), recipe })
      });
      const metadata = {
        description: dishForm.description.trim(), ingredients: dishForm.ingredients.trim(), category: dishForm.category,
        price: Number(dishForm.price || 0), kcal: Number(dishForm.kcal), protein: Number(dishForm.protein),
        fat: Number(dishForm.fat), carbs: Number(dishForm.carbs), image: dishPhoto
      };
      const nextMetadata = { ...readStorage('mlp-dish-display-metadata', {}), [String(created.id)]: { ...metadata, image: dishPhoto || metadata.image || '' } };
      try { localStorage.setItem('mlp-dish-display-metadata', JSON.stringify(nextMetadata)); } catch {}
      setDishMetadata(nextMetadata);
      await loadData();
      setDishForm({ name: '', description: '', ingredients: '', category: 'Основное', price: '', kcal: '', protein: '', fat: '', carbs: '' });
      setDishRecipeItems([{ productId: '', requiredQuantity: '0.1' }]);
      setDishPhoto('');
      setModal(''); notify(`Блюдо «${created.name}» и его техкарта сохранены на сервере`);
    } catch (error) { notify(error.message || 'Не удалось добавить блюдо'); }
  };

  const openModal = type => {
    setModal(type);
    setForm({ name: '', amount: '', unit: 'кг', expiry: '' });
    if (type === 'dish') {
      setDishForm({ name: '', description: '', ingredients: '', category: 'Основное', price: '', kcal: '', protein: '', fat: '', carbs: '' });
      setDishRecipeItems([{ productId: '', requiredQuantity: '0.1' }]);
    }
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
                {currentUser?.role === 'admin' && <button className="icon-button" aria-label={`Удалить ${p.name}`} onClick={() => deleteProduct(p)}>
                  <Trash2 size={15} />
                </button>}
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

  const expiring = stockBatches.filter(p => p.days != null && p.days <= 2 && p.amount > 0);
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

  const unreadNotificationCount = notificationItems.filter(item => !readNotificationIds.includes(item.id)).length;
  const openNotifications = () => { setNotificationsOpen(v => { if (!v) setReadNotificationIds(ids => [...new Set([...ids, ...notificationItems.map(item => item.id)])]); return !v; }); };
  const submitWriteOff = e => { e.preventDefault(); const product = products.find(p => String(p.id) === String(writeOffForm.productId)); if (!product || Number(writeOffForm.quantity) <= 0) { notify('Выберите продукт и укажите количество'); return; } if (Number(writeOffForm.quantity) > Number(product.amount)) { notify('Количество превышает доступный остаток'); return; } const request = { id: `wo-${Date.now()}`, productId: product.id, product: product.name, unit: product.unit, quantity: Number(writeOffForm.quantity), reason: writeOffForm.reason, comment: writeOffForm.comment.trim(), requestedBy: userName, createdAt: new Date().toISOString(), status: 'Ожидает подтверждения' }; setWriteOffRequests(rows => [request, ...rows]); setWriteOffForm({ productId: '', quantity: '', reason: 'Порча и брак', comment: '' }); setModal(''); notify('Заявка на списание отправлена администратору'); };
  const decideWriteOff = (id, approved) => { const request = writeOffRequests.find(row => row.id === id); if (!request || request.status !== 'Ожидает подтверждения') return; if (approved) { const product = products.find(p => String(p.id) === String(request.productId)); if (!product || Number(product.amount) < request.quantity) { notify('Недостаточно остатка для подтверждения'); return; } setProducts(rows => rows.map(p => String(p.id) === String(request.productId) ? { ...p, amount: Math.max(0, Number(p.amount) - request.quantity) } : p)); setStockBatches(rows => rows.map(p => String(p.id) === String(request.productId) ? { ...p, amount: Math.max(0, Number(p.amount) - request.quantity) } : p)); notify('Заявка подтверждена, локальный остаток уменьшен. Для постоянного учёта подключите API списания.'); } setWriteOffRequests(rows => rows.map(row => row.id === id ? { ...row, status: approved ? 'Подтверждена' : 'Отклонена', reviewedBy: userName, reviewedAt: new Date().toISOString() } : row)); };

  function Dashboard() { 
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">{currentWeekday.toLocaleUpperCase('ru-RU')}, {currentDate.toLocaleUpperCase('ru-RU')}</div>
            <h1>Добро пожаловать, {userFirstName}! <span className="wave">✦</span></h1>
            <p>Следите за остатками, сроками годности и эффективностью ресторана.</p>
          </div>
          {currentUser?.role === 'admin' && <button className="button primary" onClick={() => openModal('product')}>
            <Plus size={17} /> Добавить продукт
          </button>}
        </div>
        <div className="stats-grid">
          <StatCard icon={Boxes} label="Общий остаток продуктов" value={dashboardData?.productCount ?? products.length} hint="наименований на складе" tone="purple" />
          <StatCard icon={AlertTriangle} label="Истекает срок годности" value={expiring.length} hint="требуют внимания" tone="orange" />
          <StatCard icon={CalendarDays} label="Ближайший срок" value={expiring.length ? `${Math.max(0, Math.min(...expiring.map(p => p.days)))} дн.` : '—'} hint="по данным склада" tone="blue" />
          <StatCard icon={ChefHat} label="Активных блюд в меню" value={dashboardData?.availableDishCount ?? normalizedDishes.filter(d => d.backendId && d.isAvailable).length} hint="доступно к заказу" tone="green" />
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
          {currentUser?.role === 'admin' && <button className="button primary" onClick={() => openModal('product')}>
            <Plus size={16} /> Добавить продукт
          </button>}
        </div>
        <section className="panel">
          <div className="panel-top">
            <div>
              <strong>Товары на складе</strong>
              <span className="muted"> {filteredProducts.length} позиций</span>
            </div>
            <button className="button secondary small" onClick={async () => {
              try {
                const to = new Date();
                const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
                const asLocalDateTime = value => {
                  const pad = part => String(part).padStart(2, '0');
                  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
                };
                const query = `from=${encodeURIComponent(asLocalDateTime(from))}&to=${encodeURIComponent(asLocalDateTime(to))}`;
                const report = await apiRequest(`/api/analytics/export?${query}`);
                const blob = new Blob([report], { type: 'text/csv;charset=UTF-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `warehouse-report-${to.toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                notify('Отчёт склада успешно скачан');
              } catch (error) {
                notify(error?.status === 403 ? 'Нет доступа к экспорту отчёта. Проверьте роль пользователя.' : error?.message || 'Не удалось скачать отчёт склада');
              }
            }}>
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
          <StatCard icon={AlertTriangle} label="Просрочено" value={stockBatches.filter(p => p.days != null && p.days <= 0 && p.amount > 0).length} hint="позиций требуют проверки" tone="red" />
          <StatCard icon={CircleCheck} label="В пределах срока" value={stockBatches.filter(p => p.days != null && p.days > 2 && p.amount > 0).length} hint="позиций" tone="green" />
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
                {[...stockBatches].sort((a, b) => (a.days ?? 99999) - (b.days ?? 99999)).map((p, i) => (
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
            {stockBatches.length === 0 && <EmptyState text="Партий пока нет. Зарегистрируйте поставку, чтобы отслеживать сроки годности." />}
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
            <p>Стоп-лист приходит с сервера и обновляется после изменения остатков и техкарт.</p>
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
            <p>Список формируется сервером по техкартам и фактическим остаткам.</p>
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
          <span className="toolbar-note"><UtensilsCrossed size={18} /> {normalizedDishes.filter(dish => dish.backendId).length} блюд в серверном каталоге</span>
          {currentUser?.role === 'admin' && <button className="button primary" onClick={() => openModal('dish')}><Plus size={16} /> Добавить блюдо</button>}
        </div>
        {menuDishes.length === 0 ? <EmptyState text="В меню пока нет блюд." /> : <div className="dish-grid catalog-dish-grid">
          {normalizedDishes.map(dish => (
            <article className="dish-card dish-card-clickable" key={dish.id} onClick={() => setSelectedHotDish(dish)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedHotDish(dish); } }}>
              <div className="dish-art catalog-dish-art">
                {dish.image ? <img className="dish-art-img" src={dish.image} alt={dish.name} loading="lazy" /> : <ChefHat size={42} aria-label="Без изображения" />}
                <span className="dish-category-label">{dish.category || 'Блюдо'}</span>
              </div>
              <div className="dish-body">
                <h3>{dish.name}</h3>
                {!dish.backendId && <p className="form-hint">Нет серверной техкарты — заказ пока недоступен.</p>}
                <p>{dish.description || 'Описание не добавлено.'}</p>
                <div className="catalog-nutrition">
                  <span><strong>{dish.kcal ?? '—'}</strong> ккал</span>
                  <span>Б <strong>{dish.protein ?? '—'}</strong> г</span>
                  <span>Ж <strong>{dish.fat ?? '—'}</strong> г</span>
                  <span>У <strong>{dish.carbs ?? '—'}</strong> г</span>
                </div>
                <span className="dish-open-hint">Нажмите, чтобы открыть фото и подробности</span>
              </div>
            </article>
          ))}
        </div>}
        {selectedHotDish && createPortal(<div className="dish-modal-backdrop" onClick={() => setSelectedHotDish(null)}><section className="dish-modal" role="dialog" aria-modal="true" aria-label={selectedHotDish.name} onClick={e => e.stopPropagation()}><button className="dish-modal-close" aria-label="Закрыть" onClick={() => setSelectedHotDish(null)}><X size={22} /></button>{selectedHotDish.image ? <img className="dish-modal-image" src={selectedHotDish.image} alt={selectedHotDish.name} /> : <div className="dish-modal-image dish-modal-placeholder"><ChefHat size={48} /></div>}<div className="dish-modal-content"><span className="dish-modal-kicker">ИНФОРМАЦИЯ О БЛЮДЕ</span><h2>{selectedHotDish.name}</h2><p>{selectedHotDish.description || 'Описание не добавлено.'}</p><h3>Ингредиенты</h3><p>{selectedHotDish.ingredients || 'Состав не указан.'}</p><h3>КБЖУ на 100 г</h3><div className="dish-nutrition"><div><span>Калории</span><strong>{selectedHotDish.kcal ?? '—'} ккал</strong></div><div><span>Белки</span><strong>{selectedHotDish.protein ?? '—'} г</strong></div><div><span>Жиры</span><strong>{selectedHotDish.fat ?? '—'} г</strong></div><div><span>Углеводы</span><strong>{selectedHotDish.carbs ?? '—'} г</strong></div></div></div></section></div>, document.body)}
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
          <span>Рекомендации загружаются с сервера на основе партий продуктов и техкарт.</span>
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
          <button className="button secondary" onClick={async () => {
            try {
              const days = range === '7 дней' ? 7 : range === '90 дней' ? 90 : 30;
              const to = new Date();
              const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
              const asLocalDateTime = value => {
                const pad = part => String(part).padStart(2, '0');
                return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
              };
              const query = `from=${encodeURIComponent(asLocalDateTime(from))}&to=${encodeURIComponent(asLocalDateTime(to))}`;
              const report = await apiRequest(`/api/analytics/export?${query}`);
              const blob = new Blob([report], { type: 'text/csv;charset=UTF-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `warehouse-analytics-${to.toISOString().slice(0, 10)}.csv`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              URL.revokeObjectURL(url);
              notify('Отчёт успешно скачан');
            } catch (error) {
              notify(error?.message || 'Не удалось скачать отчёт');
            }
          }}>
            <Download size={16} /> Скачать отчёт
          </button>
        </div>
        <div className="stats-grid">
          <StatCard icon={Trash2} label="Списано продуктов" value={writeOffs.reduce((sum, item) => sum + Number(item.totalQuantity || 0), 0).toLocaleString('ru-RU')} hint={`${writeOffs.length} позиций в отчёте`} tone="orange" />
          <StatCard icon={ChartNoAxesCombined} label="Доля списаний" value="—" hint="доля списаний не входит в текущий API" tone="green" />
          <StatCard icon={AlertTriangle} label="Дефицитных ингредиентов" value={products.filter(p => p.amount <= 0).length} hint="по текущим остаткам" tone="red" />
          <StatCard icon={Ban} label="Прогноз стоп-листа" value="—" hint="нужны рецептуры и история" tone="purple" />
        </div>
        <div className="analytics-grid">
          <section className="panel">
            <SectionTitle title="Списания по категориям" subtitle={`Период: ${range.toLowerCase()}`} />
            {writeOffs.length ? <div className="table-wrap"><table><thead><tr><th>Продукт</th><th>Причина</th><th>Списано</th><th>Ед.</th></tr></thead><tbody>{writeOffs.map((item, i) => <tr key={`${item.product}-${item.reason}-${i}`}><td>{item.product}</td><td>{item.reason}</td><td className="strong-cell">{item.totalQuantity}</td><td>{item.unit}</td></tr>)}</tbody></table></div> : <EmptyState text="Сервер пока не вернул записи о списаниях." />}
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

  function WriteOffsPage() { return (<>
    <SectionTitle title="Списания" subtitle="Сотрудники отправляют заявки, администратор проверяет и принимает решение." />
    <div className="toolbar"><span className="toolbar-note"><ClipboardList size={18} /> {writeOffRequests.length} заявок</span><button className="button primary" onClick={() => openModal('writeoff')}><Plus size={16} /> Заявка на списание</button></div>
    <section className="panel"><div className="writeoff-list">{writeOffRequests.length ? writeOffRequests.map(item => <article className="writeoff-card" key={item.id}><div className="writeoff-card-main"><strong>{item.product} · {item.quantity} {item.unit}</strong><p>{item.reason}{item.comment ? ` — ${item.comment}` : ''}</p><small>Создал: {item.requestedBy} · {new Date(item.createdAt).toLocaleString('ru-RU')}</small>{item.reviewedBy && <small>Решение: {item.reviewedBy}</small>}</div><div className="writeoff-actions"><Status tone={item.status === 'Подтверждена' ? 'green' : item.status === 'Отклонена' ? 'red' : 'amber'}>{item.status}</Status>{currentUser?.role === 'admin' && item.status === 'Ожидает подтверждения' && <><button className="button primary small" onClick={() => decideWriteOff(item.id, true)}><Check size={14}/> Подтвердить</button><button className="button secondary small" onClick={() => decideWriteOff(item.id, false)}>Отклонить</button></>}</div></article>) : <EmptyState text="Заявок на списание пока нет." />}</div><p className="form-hint">Подтверждения сохраняются в этом браузере. Для фактического списания из складского остатка необходимо подключить серверный API.</p></section>
  </>); }

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
              <label>Логин сотрудника<input required minLength="3" value={newUser.email} onChange={e => setNewUser(v => ({ ...v, email: e.target.value }))} placeholder="employee01" autoComplete="off" /></label>
              <label>Пароль <span className="optional-field">минимум 12 символов</span><input type="password" required minLength="12" value={newUser.password} onChange={e => setNewUser(v => ({ ...v, password: e.target.value }))} placeholder="Надёжный пароль" autoComplete="new-password" /></label>
              <button className="button primary" type="submit"><Plus size={16} /> Создать учётную запись</button>
            </form>
            <div className="admin-users-list">{users.map(user => <div className="admin-user-row" key={user.id || user.email}><span><strong>{user.name || user.email}</strong><small>{user.email}</small></span><Status tone={user.role === 'admin' ? 'purple' : 'green'}>{user.role === 'admin' ? 'Администратор' : 'Сотрудник'}</Status></div>)}</div>
          </section>}
          <div className="settings-info">
            <CircleHelp size={19} />
            <div>
              <strong>Интеграция с сервером</strong>
              <p>{apiConnected ? 'Серверное API подключено. Склад, партии, поставки, блюда, заказы, стоп-лист и горячие предложения загружаются с сервера.' : 'Для работы нужны адрес Java API и серверная учётная запись. Данные склада не подменяются локальными демозаписями.'}</p>
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
      case 'Списания': return WriteOffsPage();
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
          <button className="icon-button" aria-label="Выйти" onClick={() => { clearApiCredentials(); setSignedIn(false); setCurrentUser(null); setApiConnected(false); setProducts([]); setStockBatches([]); setOrders([]); setSupplies([]); setStopItems([]); setHotDishes([]); setWriteOffs([]); setUsers([]); }}>
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
          </div>
          <div className="topbar-right">
            <span className="date-label">
              <CalendarDays size={16} /> {currentDate} <small>{currentTime}</small>
            </span>
            <button 
              className={`icon-button notification ${notificationsOpen ? 'notification-active' : ''}`} 
              aria-label="Открыть уведомления" 
              aria-expanded={notificationsOpen} 
              onClick={openNotifications}
            >
              <Bell size={19} />
              {unreadNotificationCount > 0 && <i />}
            </button>
            <button className="top-profile-button" onClick={() => setProfileOpen(true)} aria-label="Открыть профиль"><span className="top-avatar">{userInitials}</span><span className="user-label"><strong>{userName}</strong><span>{userRole}</span></span></button>
          </div>
        </header>
        
        <div className="page-content">
          {pageContent()}
          <footer className="footer">
            <span>© {today.getFullYear()} MLP</span>
            <span>Контроль запасов с заботой о качестве</span>
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
                <p>{unreadNotificationCount} непрочитанных · {notificationItems.length} всего</p>
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
            <div className="auth-logo"><img src="/images/MLP.jpg" alt="MLP" /></div>
            <span className="eyebrow">MLP</span>
            <h1>С возвращением!</h1>
            <p>Войдите с учётной записью, зарегистрированной в серверной базе пользователей.</p>
            
                        <label>Логин<input type="text" autoComplete="username" required value={login.email} onChange={e => setLogin(v => ({ ...v, email: e.target.value }))} placeholder="admin" /></label>
            <label>Пароль<input type="password" autoComplete="current-password" required value={login.password} onChange={e => setLogin(v => ({ ...v, password: e.target.value }))} placeholder="Пароль серверной учётной записи" /></label>
            {authError && <p className="auth-error" role="alert">{authError}</p>}
            <button className="button primary full" type="submit" disabled={loading}>{loading ? 'Подключение…' : 'Войти в систему'}</button>
            <small>Вход проверяется сервером MLP. Нужен логин и пароль, созданные в базе пользователей.</small>
          </form>
        </div>
      )}
      
      {profileOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setProfileOpen(false); }}><section className="modal profile-modal" role="dialog" aria-modal="true" aria-label="Профиль пользователя"><div className="modal-head"><div><span className="eyebrow">АККАУНТ MLP</span><h2>Профиль</h2></div><button className="icon-button" onClick={() => setProfileOpen(false)} aria-label="Закрыть профиль"><X size={20}/></button></div><div className="profile-detail"><span className="top-avatar">{userInitials}</span><div><strong>{userName}</strong><p>{currentUser?.email || currentUser?.login || 'Учётная запись'}</p><Status tone={currentUser?.role === 'admin' ? 'purple' : 'green'}>{userRole}</Status></div></div><button className="button secondary full" onClick={() => { setProfileOpen(false); clearApiCredentials(); setSignedIn(false); setCurrentUser(null); setApiConnected(false); setProducts([]); setStockBatches([]); setOrders([]); setSupplies([]); setStopItems([]); setHotDishes([]); setWriteOffs([]); setUsers([]); }}> <LogOut size={16}/> Выйти из аккаунта</button></section></div>}

      {modal && (
        <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setModal(''); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-head">
              <div>
                <span className="eyebrow">MLP</span>
                <h2 id="modal-title">
                  {modal === 'product' ? 'Добавить продукт' : modal === 'dish' ? 'Добавить блюдо' : modal === 'order' ? 'Новый заказ' : modal === 'writeoff' ? 'Заявка на списание' : 'Новая поставка'}
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
                <p className="form-hint">Продукт и его партия сохраняются через API на сервере.</p>
                <button className="button primary full" type="submit">
                  <Plus size={16} /> Добавить на склад
                </button>
              </form>
            ) : modal === 'dish' ? (
              currentUser?.role === 'admin' ? <form onSubmit={addDish} className="modal-form">
                <label>Название блюда<input autoFocus required value={dishForm.name} onChange={e => setDishForm(v => ({ ...v, name: e.target.value }))} placeholder="Например, Паста с курицей" /></label>
                <label>Фотография блюда<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { notify('Выберите изображение до 2 МБ'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = () => setDishPhoto(String(reader.result || '')); reader.readAsDataURL(file); }} /></label>{dishPhoto && <img className="dish-photo-preview" src={dishPhoto} alt="Предпросмотр блюда" />}
                <label>Описание<textarea value={dishForm.description} onChange={e => setDishForm(v => ({ ...v, description: e.target.value }))} placeholder="Краткое описание блюда" rows="2" /></label>
                <label>Состав / ингредиенты<textarea value={dishForm.ingredients} onChange={e => setDishForm(v => ({ ...v, ingredients: e.target.value }))} placeholder="Перечислите ингредиенты" rows="2" /></label>
                <div className="form-row">
                  <label>Категория<select value={dishForm.category} onChange={e => setDishForm(v => ({ ...v, category: e.target.value }))}><option>Основное</option><option>Салаты</option><option>Супы</option><option>Пицца</option><option>Десерты</option><option>Напитки</option><option>Гарниры</option></select></label>
                  <label>Цена, ₽ <input required type="number" min="0" step="0.01" value={dishForm.price} onChange={e => setDishForm(v => ({ ...v, price: e.target.value }))} placeholder="Укажите цену" /></label>
                </div>
                <div className="dish-recipe-editor">
                  <p className="form-section-label">Техкарта для складского учёта</p>
                  <p className="form-hint">Выберите продукты, которые уже есть в каталоге, и количество на одно блюдо. Техкарта сохранится на сервере.</p>
                  {dishRecipeItems.map((item, index) => <div className="form-row" key={index}>
                    <label>Ингредиент<select required value={item.productId} onChange={e => setDishRecipeItems(rows => rows.map((row, i) => i === index ? { ...row, productId: e.target.value } : row))}><option value="">Выберите продукт</option>{products.map(product => <option key={product.id} value={String(product.id)}>{product.name} ({product.unit})</option>)}</select></label>
                    <label>Количество на блюдо<input required type="number" min="0.001" step="0.001" value={item.requiredQuantity} onChange={e => setDishRecipeItems(rows => rows.map((row, i) => i === index ? { ...row, requiredQuantity: e.target.value } : row))} /></label>
                    {dishRecipeItems.length > 1 && <button type="button" className="icon-button" aria-label="Удалить ингредиент" onClick={() => setDishRecipeItems(rows => rows.filter((_, i) => i !== index))}><Trash2 size={15} /></button>}
                  </div>)}
                  <button type="button" className="button secondary small" onClick={() => setDishRecipeItems(rows => [...rows, { productId: '', requiredQuantity: '0.1' }])}><Plus size={15} /> Добавить ингредиент</button>
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
                <p className="form-hint">Техкарта, название и цена сохраняются в базе. Текущий API не хранит описание, категорию и КБЖУ — эти поля сохраняются только в браузере.</p>
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
                        <small>{dish.price == null ? 'Цена не указана' : money(dish.price)} · {dish.category || 'Блюдо'}{!dish.backendId ? ' · недоступно для заказа' : ''}</small>
                      </div>
                      <div className="quantity-control">
                        <button 
                          type="button" 
                          aria-label={`Уменьшить ${dish.name}`} 
                          disabled={!selectedDishes[dish.id] || !dish.backendId} 
                          onClick={() => setSelectedDishes(prev => ({ ...prev, [dish.id]: Math.max(0, (prev[dish.id] || 0) - 1) }))}
                        >
                          −
                        </button>
                        <span>{selectedDishes[dish.id] || 0}</span>
                        <button
                          type="button"
                          aria-label={`Добавить ${dish.name}`}
                          disabled={false}
                          disabled={!dish.backendId}
                          title={!dish.backendId ? 'Это демонстрационная заглушка: сначала добавьте блюдо с серверной техкартой' : undefined}
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
                <p className="form-hint">В списке отображаются только блюда, добавленные в серверный каталог.</p>
                <button className="button primary full" onClick={createOrder}>
                  <Check size={16} /> Создать заказ
                </button>
                <button className="button secondary full" onClick={() => { setSelectedDishes({}); setModal(''); }}>
                  Отмена
                </button>
              </div>
            ) : modal === 'writeoff' ? (
              <form className="modal-form" onSubmit={submitWriteOff}>
                <label>Продукт<select required value={writeOffForm.productId} onChange={e => setWriteOffForm(v => ({ ...v, productId: e.target.value }))}><option value="">Выберите продукт</option>{products.filter(p => Number(p.amount) > 0).map(p => <option key={p.id} value={String(p.id)}>{p.name} — {p.amount} {p.unit}</option>)}</select></label>
                <label>Количество<input required type="number" min="0.01" step="0.01" value={writeOffForm.quantity} onChange={e => setWriteOffForm(v => ({ ...v, quantity: e.target.value }))} /></label>
                <label>Причина<select value={writeOffForm.reason} onChange={e => setWriteOffForm(v => ({ ...v, reason: e.target.value }))}><option>Порча и брак</option><option>Ошибки на кухне или в зале</option><option>Питание персонала</option></select></label>
                <label>Комментарий<textarea rows="3" value={writeOffForm.comment} onChange={e => setWriteOffForm(v => ({ ...v, comment: e.target.value }))} placeholder="Например: блюдо пересолили или продукт повреждён" /></label>
                <p className="form-hint">Заявка не меняет остатки до проверки администратором.</p><button className="button primary full" type="submit">Отправить на подтверждение</button>
              </form>
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