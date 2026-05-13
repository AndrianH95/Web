/**
 * TechStore — Головний JavaScript-модуль
 * 
 * Структура:
 * 1. Стан додатку
 * 2. Утиліти
 * 3. Завантаження товарів (fetch)
 * 4. Рендер карток
 * 5. Фільтрація та сортування
 * 6. Кошик (localStorage)
 * 7. Модальне вікно
 * 8. Повідомлення
 * 9. Мобільне меню
 * 10. Ініціалізація
 */

'use strict';

/* ── 1. Стан додатку ─────────────────────────────────────── */
const state = {
  products: [],        // всі товари з JSON
  filtered: [],        // відфільтровані товари
  cart: [],            // кошик
  activeCategory: 'all',
  priceMax: Infinity,
  priceMin: 0,
  onlyInStock: false,
  sortBy: 'default',
};

/* ── 2. Утиліти ──────────────────────────────────────────── */

/**
 * Форматує число як ціну в гривнях
 * @param {number} num
 * @returns {string}
 */
const formatPrice = (num) =>
  `₴${num.toLocaleString('uk-UA')}`;

/**
 * Генерує HTML-рядок зірочок за рейтингом
 * @param {number} rating — від 0 до 5
 * @returns {string}
 */
const renderStars = (rating) => {
  const full    = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty   = 5 - full - (hasHalf ? 1 : 0);
  return '★'.repeat(full) + (hasHalf ? '½' : '') + '☆'.repeat(empty);
};

/**
 * Повертає CSS-клас бейджу за його текстом
 * @param {string} badge
 * @returns {string}
 */
const badgeClass = (badge) => {
  const map = {
    'Хіт':        'badge-hot',
    'Новинка':    'badge-new',
    'Знижка':     'badge-sale',
    'Топ продаж': 'badge-top',
    'Преміум':    'badge-premium',
  };
  return map[badge] || 'badge-top';
};

/* ── 3. Завантаження товарів ─────────────────────────────── */

/**
 * Завантажує products.json та ініціалізує додаток
 */
const loadProducts = async () => {
  try {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.products = await response.json();
    state.filtered = [...state.products];
    buildCategoryFilters();
    applyFilters();
  } catch (err) {
    console.error('Помилка завантаження товарів:', err);
    document.getElementById('productsGrid').innerHTML =
      `<p style="color:var(--clr-danger);grid-column:1/-1">
        Помилка завантаження товарів. Переконайтесь, що сервер запущено.
       </p>`;
  }
};

/* ── 4. Рендер карток ────────────────────────────────────── */

/**
 * Створює HTML-розмітку однієї картки товару
 * @param {Object} product
 * @param {number} index — для затримки анімації
 * @returns {string} HTML-рядок
 */
const createCardHTML = (product, index) => {
  const inStock = product.inStock;
  const animationDelay = `${index * 60}ms`;

  return `
    <article
      class="product-card"
      role="listitem"
      data-id="${product.id}"
      style="animation-delay:${animationDelay}"
      aria-label="${product.name}, ${formatPrice(product.price)}"
    >
      ${product.badge
        ? `<span class="product-badge ${badgeClass(product.badge)}">${product.badge}</span>`
        : ''}

      <div class="card-img-wrap">
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'"
        />
        ${!inStock ? '<div class="out-of-stock-overlay">Немає в наявності</div>' : ''}
      </div>

      <div class="card-body">
        <span class="card-category">${product.category}</span>
        <h3 class="card-name">${product.name}</h3>
        <div class="card-rating" aria-label="Рейтинг ${product.rating} з 5">
          <span class="stars" aria-hidden="true">${renderStars(product.rating)}</span>
          <span>${product.rating} (${product.reviews})</span>
        </div>
        <div class="card-price">${formatPrice(product.price)}</div>
      </div>

      <div class="card-actions">
        <button
          class="btn-buy"
          data-id="${product.id}"
          ${!inStock ? 'disabled aria-disabled="true"' : ''}
          aria-label="Додати ${product.name} в кошик"
        >
          ${inStock ? 'Додати в кошик' : 'Немає'}
        </button>
        <button
          class="btn-details"
          data-id="${product.id}"
          aria-label="Детальніше про ${product.name}"
          title="Детальніше"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
      </div>
    </article>
  `;
};

/**
 * Рендерить сітку карток на основі state.filtered
 */
const renderCards = () => {
  const grid      = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');

  if (state.filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.hidden = false;
    document.getElementById('resultsCount').textContent = 0;
    return;
  }

  emptyState.hidden = true;
  document.getElementById('resultsCount').textContent = state.filtered.length;

  grid.innerHTML = state.filtered.map((p, i) => createCardHTML(p, i)).join('');

  // Запускаємо анімацію появи через IntersectionObserver
  const cards = grid.querySelectorAll('.product-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const delay = card.style.animationDelay;
        setTimeout(() => card.classList.add('visible'), parseInt(delay) || 0);
        observer.unobserve(card);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => observer.observe(card));

  // Прив'язуємо події до нових карток
  bindCardEvents();
};

/* ── 5. Фільтрація та сортування ────────────────────────── */

/**
 * Збирає унікальні категорії та будує радіо-кнопки фільтра
 */
const buildCategoryFilters = () => {
  const categories = [...new Set(state.products.map(p => p.category))];
  const list = document.getElementById('categoryList');

  // Додаємо кнопки категорій (перша — "Всі" вже є в HTML)
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.innerHTML = `
      <label class="category-item">
        <input type="radio" name="category" value="${cat}" />
        <span>${cat}</span>
      </label>
    `;
    list.appendChild(li);
  });

  // Обробник зміни категорії
  list.addEventListener('change', (e) => {
    if (e.target.name === 'category') {
      state.activeCategory = e.target.value;
      applyFilters();
    }
  });
};

/**
 * Застосовує всі активні фільтри та сортування
 */
const applyFilters = () => {
  let result = [...state.products];

  // Фільтр 1: Категорія
  if (state.activeCategory !== 'all') {
    result = result.filter(p => p.category === state.activeCategory);
  }

  // Фільтр 2: Ціновий діапазон
  result = result.filter(p =>
    p.price >= state.priceMin && p.price <= state.priceMax
  );

  // Фільтр 3: Тільки в наявності
  if (state.onlyInStock) {
    result = result.filter(p => p.inStock);
  }

  // Сортування
  switch (state.sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break; // залишаємо оригінальний порядок
  }

  state.filtered = result;
  renderCards();
};

/**
 * Скидає всі фільтри до початкових значень
 */
const resetFilters = () => {
  // Скидаємо стан
  state.activeCategory = 'all';
  state.priceMin = 0;
  state.priceMax = Infinity;
  state.onlyInStock = false;
  state.sortBy = 'default';

  // Скидаємо UI
  document.querySelector('input[name="category"][value="all"]').checked = true;
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';
  document.getElementById('priceRange').value = 70000;
  document.getElementById('rangeValue').textContent = '₴70 000';
  document.getElementById('inStockOnly').checked = false;
  document.getElementById('sortSelect').value = 'default';

  applyFilters();
};

/* ── 6. Кошик ────────────────────────────────────────────── */

/**
 * Зберігає кошик у localStorage
 */
const saveCart = () => {
  localStorage.setItem('techstore-cart', JSON.stringify(state.cart));
};

/**
 * Завантажує кошик з localStorage
 */
const loadCart = () => {
  const saved = localStorage.getItem('techstore-cart');
  state.cart = saved ? JSON.parse(saved) : [];
  updateCartUI();
};

/**
 * Оновлює значок лічильника у кошику
 */
const updateCartUI = () => {
  const count = document.getElementById('cartCount');
  const total = state.cart.reduce((sum, item) => sum + item.qty, 0);
  count.textContent = total;
  count.classList.toggle('visible', total > 0);
};

/**
 * Додає товар у кошик
 * @param {number} productId
 */
const addToCart = (productId) => {
  const product = state.products.find(p => p.id === productId);
  if (!product || !product.inStock) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id: productId, name: product.name, price: product.price, qty: 1 });
  }

  saveCart();
  updateCartUI();
  showNotification(`✓ «${product.name}» додано до кошика`);

  // Анімація кнопки
  const btn = document.querySelector(`.btn-buy[data-id="${productId}"]`);
  if (btn) {
    btn.textContent = '✓ Додано!';
    btn.style.background = 'var(--clr-success)';
    setTimeout(() => {
      btn.textContent = 'Додати в кошик';
      btn.style.background = '';
    }, 1500);
  }
};

/* ── 7. Модальне вікно ───────────────────────────────────── */

/**
 * Відкриває модальне вікно з деталями товару
 * @param {number} productId
 */
const openModal = (productId) => {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const overlay  = document.getElementById('modalOverlay');
  const content  = document.getElementById('modalContent');

  content.innerHTML = `
    <img
      class="modal-img"
      src="${product.image}"
      alt="${product.name}"
      onerror="this.src='https://via.placeholder.com/400x320?text=No+Image'"
    />
    <div class="modal-info">
      <span class="modal-category">${product.category}</span>
      <h2 class="modal-title" id="modalTitle">${product.name}</h2>
      <div class="modal-rating">
        <span class="stars">${renderStars(product.rating)}</span>
        <span>${product.rating} з 5 (${product.reviews} відгуків)</span>
      </div>
      <p class="modal-desc">${product.description}</p>
      <div class="modal-specs">${product.specs}</div>
      <div class="modal-price">${formatPrice(product.price)}</div>
      <div class="modal-actions">
        <button
          class="modal-btn-buy"
          data-id="${product.id}"
          ${!product.inStock ? 'disabled' : ''}
        >
          ${product.inStock ? '🛒 Додати в кошик' : 'Немає в наявності'}
        </button>
      </div>
    </div>
  `;

  overlay.hidden = false;
  // Невелика затримка для запуску CSS-анімації
  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('open'));
  });

  // Блокуємо скрол сторінки
  document.body.style.overflow = 'hidden';

  // Кнопка "Додати в кошик" всередині модалки
  content.querySelector('.modal-btn-buy')?.addEventListener('click', () => {
    addToCart(product.id);
  });
};

/**
 * Закриває модальне вікно
 */
const closeModal = () => {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  setTimeout(() => {
    overlay.hidden = true;
    document.getElementById('modalContent').innerHTML = '';
  }, 320);
  document.body.style.overflow = '';
};

/* ── 8. Повідомлення ─────────────────────────────────────── */

let notificationTimer = null;

/**
 * Показує спливаюче повідомлення
 * @param {string} text
 */
const showNotification = (text) => {
  const el = document.getElementById('notification');
  document.getElementById('notificationText').textContent = text;

  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));

  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 400);
  }, 2800);
};

/* ── 9. Прив'язка подій до карток ───────────────────────── */

/**
 * Прив'язує події кліку до кнопок карток після рендеру
 */
const bindCardEvents = () => {
  const grid = document.getElementById('productsGrid');

  // Делегування подій — один обробник на всю сітку
  grid.addEventListener('click', (e) => {
    const btnBuy     = e.target.closest('.btn-buy');
    const btnDetails = e.target.closest('.btn-details');
    const card       = e.target.closest('.product-card');

    if (btnBuy && !btnBuy.disabled) {
      e.stopPropagation();
      addToCart(Number(btnBuy.dataset.id));
      return;
    }

    if (btnDetails) {
      e.stopPropagation();
      openModal(Number(btnDetails.dataset.id));
      return;
    }

    // Клік на картку (не на кнопки) — відкриває модалку
    if (card) {
      openModal(Number(card.dataset.id));
    }
  }, { capture: false });
};

/* ── 10. Ініціалізація ───────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Завантаження кошика --- */
  loadCart();

  /* --- Завантаження товарів --- */
  loadProducts();

  /* --- Фільтр: ціновий слайдер --- */
  const rangeInput = document.getElementById('priceRange');
  const rangeLabel = document.getElementById('rangeValue');

  rangeInput.addEventListener('input', () => {
    const val = Number(rangeInput.value);
    rangeLabel.textContent = formatPrice(val).replace('₴', '₴');
    state.priceMax = val;
    applyFilters();
  });

  /* --- Фільтр: поля вводу ціни --- */
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');

  const onPriceInput = () => {
    state.priceMin = Number(priceMinInput.value) || 0;
    state.priceMax = Number(priceMaxInput.value) || Infinity;
    applyFilters();
  };

  priceMinInput.addEventListener('input', onPriceInput);
  priceMaxInput.addEventListener('input', onPriceInput);

  /* --- Фільтр: в наявності --- */
  document.getElementById('inStockOnly').addEventListener('change', (e) => {
    state.onlyInStock = e.target.checked;
    applyFilters();
  });

  /* --- Сортування --- */
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    applyFilters();
  });

  /* --- Скидання фільтрів --- */
  document.getElementById('clearFilters').addEventListener('click', resetFilters);
  document.getElementById('emptyReset')?.addEventListener('click', resetFilters);

  /* --- Закриття модалки --- */
  document.getElementById('modalClose').addEventListener('click', closeModal);

  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalOverlay')) {
      closeModal();
    }
  });

  // Закриття модалки на Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* --- Мобільне меню (бургер) --- */
  const burgerBtn = document.getElementById('burgerBtn');
  const mainNav   = document.querySelector('.main-nav');

  burgerBtn.addEventListener('click', () => {
    const isOpen = burgerBtn.classList.toggle('open');
    mainNav.classList.toggle('open', isOpen);
    burgerBtn.setAttribute('aria-expanded', String(isOpen));
  });

  // Закриваємо мобільне меню при кліку на посилання
  mainNav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burgerBtn.classList.remove('open');
      mainNav.classList.remove('open');
      burgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* --- Кнопка кошика в шапці --- */
  document.getElementById('cartBtn').addEventListener('click', () => {
    const total = state.cart.reduce((sum, item) => sum + item.qty, 0);
    if (total === 0) {
      showNotification('🛒 Кошик порожній');
    } else {
      const totalPrice = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      showNotification(`🛒 ${total} товар(ів) на суму ${formatPrice(totalPrice)}`);
    }
  });

});