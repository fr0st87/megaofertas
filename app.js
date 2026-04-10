(function () {
  'use strict';

  let catalog = { categories: [], products: [] };
  let activeCategoryId = 'all';
  let searchQuery = '';
  let sortMode = 'default';

  // Inicializar la aplicación cuando el DOM esté listo
  async function initApp() {
    catalog = await loadCatalog();
    renderFeatured();
    renderFilters();
    renderProducts();
    updateCartUI();
  }

  const container = document.getElementById('products');
  const cartContainer = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const totalEl = document.getElementById('total');
  const countEl = document.getElementById('cart-count');
  const filtersEl = document.getElementById('filters');
  const filtersToggle = document.getElementById('filters-toggle');
  const filtersContainer = document.getElementById('filters-container');
  const featuredEl = document.getElementById('featured-card');
  const searchInput = document.getElementById('store-search');
  const sortSelect = document.getElementById('sort-select');
  const toastRegion = document.getElementById('toast-region');
  const footerYear = document.getElementById('footer-year');

  const productModal = document.getElementById('product-modal');
  const productModalBody = document.getElementById('product-modal-body');
  const cartModal = document.getElementById('cart-modal');
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutForm = document.getElementById('checkout-form');
  const checkoutSummary = document.getElementById('checkout-summary');
  const checkoutSuccess = document.getElementById('checkout-success');
  const checkoutDone = document.getElementById('checkout-done');
  const btnCheckout = document.getElementById('btn-checkout');

  let lastFocusEl = null;

  // Iniciar la aplicación
  initApp();

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function getCategoryName(categoryId) {
    if (!categoryId) return 'Sin categoría';
    const c = catalog.categories.find((x) => x.id === categoryId);
    return c ? c.name : 'Sin categoría';
  }

  function getProductById(id) {
    return catalog.products.find((x) => x.id === id);
  }

  function normalizeCartLines() {
    let lines = loadCartLines();
    const next = [];
    for (const line of lines) {
      const p = getProductById(line.productId);
      if (!p) continue;
      let qty = line.qty;
      if (p.stock != null && qty > p.stock) qty = p.stock;
      if (qty > 0) next.push({ productId: line.productId, qty });
    }
    if (JSON.stringify(next) !== JSON.stringify(lines)) saveCartLines(next);
    return next;
  }

  function productsFiltered() {
    let list =
      activeCategoryId === 'all'
        ? [...catalog.products]
        : catalog.products.filter((p) => p.categoryId === activeCategoryId);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    if (sortMode === 'price-asc') {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortMode === 'price-desc') {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortMode === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
    } else {
      list.sort((a, b) => {
        const fa = a.featured ? 1 : 0;
        const fb = b.featured ? 1 : 0;
        if (fb !== fa) return fb - fa;
        return (a.name || '').localeCompare(b.name || '', 'es');
      });
    }
    return list;
  }

  function getFeaturedShowcaseProducts() {
    const all = catalog.products.slice();
    return all.filter((p) => p.featured);
  }

  let currentFeaturedIndex = 0;
  let featuredInterval = null;

  function showToast(message) {
    if (!toastRegion) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    toastRegion.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast--show'));
    setTimeout(() => {
      t.classList.remove('toast--show');
      setTimeout(() => t.remove(), 300);
    }, 2800);
  }

  function openModal(modalEl) {
    if (!modalEl) return;
    lastFocusEl = document.activeElement;
    modalEl.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    const closeBtn = modalEl.querySelector('.modal-close, [data-close-modal]');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute('hidden', '');
    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('modal-open');
    }
    if (lastFocusEl && typeof lastFocusEl.focus === 'function') lastFocusEl.focus();
  }

  function closeAllModals() {
    const categoriesModal = document.getElementById('categories-modal');
    [productModal, cartModal, checkoutModal, categoriesModal].forEach((m) => {
      if (m) m.setAttribute('hidden', '');
    });
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('.modal').forEach((modalEl) => {
    modalEl.addEventListener('click', (e) => {
      if (e.target.matches('[data-close-modal]')) closeModal(modalEl);
    });
    modalEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal(modalEl);
    });
  });

  // Modal de categorías en móvil
  const categoriesModal = document.getElementById('categories-modal');
  const categoriesModalGrid = document.getElementById('categories-modal-grid');

  if (filtersToggle && categoriesModal) {
    filtersToggle.addEventListener('click', () => {
      if (window.innerWidth <= 720) {
        openModal(categoriesModal);
        renderCategoriesModal();
      }
    });
  }

  function renderCategoriesModal() {
    if (!categoriesModalGrid) return;
    categoriesModalGrid.innerHTML = 
      '<button type="button" data-cat="all" class="category-modal-pill' +
      (activeCategoryId === 'all' ? ' active' : '') +
      '">Todos</button>';
    catalog.categories.forEach((c) => {
      const active = activeCategoryId === c.id ? ' active' : '';
      categoriesModalGrid.innerHTML += `<button type="button" data-cat="${escapeAttr(
        c.id
      )}" class="category-modal-pill${active}">${escapeHtml(c.name)}</button>`;
    });
    categoriesModalGrid.querySelectorAll('button[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategoryId = btn.getAttribute('data-cat');
        renderFilters();
        renderProducts();
        closeModal(categoriesModal);
      });
    });
  }

  function renderFilters() {
    if (!filtersEl) return;
    filtersEl.innerHTML =
      '<button type="button" data-cat="all" class="filter-pill' +
      (activeCategoryId === 'all' ? ' active' : '') +
      '">Todos</button>';
    catalog.categories.forEach((c) => {
      const active = activeCategoryId === c.id ? ' active' : '';
      filtersEl.innerHTML += `<button type="button" data-cat="${escapeAttr(
        c.id
      )}" class="filter-pill${active}">${escapeHtml(c.name)}</button>`;
    });
    filtersEl.querySelectorAll('button[data-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategoryId = btn.getAttribute('data-cat');
        renderFilters();
        renderProducts();
      });
    });
  }

  function renderFeatured() {
    if (!featuredEl) return;
    const items = getFeaturedShowcaseProducts();
    const featuredSection = featuredEl.closest('.featured');

    if (!items.length) {
      featuredEl.classList.add('is-empty');
      featuredEl.innerHTML =
        '<p class="featured-empty-msg">No hay productos destacados. Marca algunos desde el panel de administración.</p>';
      if (featuredSection) featuredSection.style.display = 'none';
      if (featuredInterval) clearInterval(featuredInterval);
      return;
    }

    if (featuredSection) featuredSection.style.display = 'block';
    featuredEl.classList.remove('is-empty');
    currentFeaturedIndex = 0;

    function renderCurrentSlide() {
      const p = items[currentFeaturedIndex];
      const imgFeatured = resolveAssetUrl(p.img);
      const currencyLabel = p.currency === 'CUP' ? 'CUP' : 'USD';
      const currencyClass = 'currency-' + (p.currency || 'USD').toLowerCase();
      featuredEl.innerHTML = `
      <article class="featured-card featured-card--hero">
        <button type="button" class="featured-card-btn" data-featured-open="${escapeAttr(p.id)}">
          <div class="featured-img-wrap featured-img-wrap--hero">
            <img src="${escapeAttr(imgFeatured)}" alt="${escapeAttr(p.name)}" loading="lazy" width="1200" height="400" decoding="async">
          </div>
          <div class="featured-card-body featured-card-body--hero">
            <span class="badge badge--sm">OFERTA</span>
            <h3 class="featured-card-title featured-card-title--hero">${escapeHtml(p.name)}</h3>
            <p class="featured-card-price featured-card-price--hero">$ ${escapeHtml(String(p.price))} <span class="currency-label ${currencyClass}">${currencyLabel}</span></p>
            <span class="featured-card-cta featured-card-cta--hero">Ver detalle</span>
          </div>
        </button>
      </article>
      <div class="featured-dots">
        ${items.map((_, idx) => `<button type="button" class="featured-dot ${idx === currentFeaturedIndex ? 'active' : ''}" data-slide="${idx}" aria-label="Ir a producto ${idx + 1}" aria-pressed="${idx === currentFeaturedIndex}"></button>`).join('')}
      </div>`;

      featuredEl.querySelector('[data-featured-open]').addEventListener('click', () => {
        const id = featuredEl.querySelector('[data-featured-open]').getAttribute('data-featured-open');
        if (id) openProductModal(id);
      });

      featuredEl.querySelectorAll('[data-slide]').forEach((btn) => {
        btn.addEventListener('click', () => {
          clearInterval(featuredInterval);
          currentFeaturedIndex = parseInt(btn.getAttribute('data-slide'), 10);
          renderCurrentSlide();
          startFeaturedRotation();
        });
      });
    }

    function startFeaturedRotation() {
      if (items.length <= 1) return;
      if (featuredInterval) clearInterval(featuredInterval);
      featuredInterval = setInterval(() => {
        currentFeaturedIndex = (currentFeaturedIndex + 1) % items.length;
        renderCurrentSlide();
      }, 15000);
    }

    renderCurrentSlide();
    startFeaturedRotation();
  }

  function renderProducts() {
    const list = productsFiltered();
    if (!container) return;
    container.innerHTML = '';
    if (!list.length) {
      container.innerHTML =
        '<p class="empty-store">No hay productos que coincidan con tu búsqueda o categoría.</p>';
      renderFeatured();
      renderFilters();
      return;
    }
    list.forEach((p) => {
      const div = document.createElement('article');
      div.className = 'product';
      const imgSrc = resolveAssetUrl(p.img);
      const currencyLabel = p.currency === 'CUP' ? 'CUP' : 'USD';
      const currencyClass = 'currency-' + (p.currency || 'USD').toLowerCase();
      div.innerHTML = `
        <div class="product-img-wrap">
          <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(p.name)}" loading="lazy">
        </div>
        <h3 class="product-title">${escapeHtml(p.name)}</h3>
        <p class="product-meta">${escapeHtml(getCategoryName(p.categoryId))}</p>
        <p class="product-price">$ ${escapeHtml(String(p.price))} <span class="currency-label ${currencyClass}">${currencyLabel}</span></p>
        <div class="product-actions">
          <button type="button" class="btn-secondary btn-product-secondary" data-detail="${escapeAttr(
            p.id
          )}">Detalle</button>
          <button type="button" class="btn-primary btn-product-add" data-add="${escapeAttr(p.id)}">Añadir</button>
        </div>
      `;
      div.querySelector('[data-detail]').addEventListener('click', () => openProductModal(p.id));
      div.querySelector('[data-add]').addEventListener('click', () => addToCart(p.id, 1));
      container.appendChild(div);
    });
    renderFeatured();
    renderFilters();
  }

  function openProductModal(productId) {
    const p = getProductById(productId);
    if (!p || !productModalBody) return;
    const imgSrc = resolveAssetUrl(p.img);
    const stockNote =
      p.stock == null ? 'Disponible' : p.stock > 0 ? `${p.stock} en stock` : 'Sin stock';
    const currencyLabel = p.currency === 'CUP' ? 'CUP' : 'USD';
    const currencyClass = 'currency-' + (p.currency || 'USD').toLowerCase();
    productModalBody.innerHTML = `
      <div class="product-modal-grid">
        <div class="product-modal-img">
          <img src="${escapeAttr(imgSrc)}" alt="${escapeAttr(p.name)}">
        </div>
        <div class="product-modal-info">
          <h2 id="product-modal-title" class="product-modal-title">${escapeHtml(p.name)}</h2>
          <p class="product-modal-meta">${escapeHtml(getCategoryName(p.categoryId))} · ${escapeHtml(
            stockNote
          )}</p>
          <p class="product-modal-price">$ ${escapeHtml(String(p.price))} <span class="currency-label ${currencyClass}">${currencyLabel}</span></p>
          <p class="product-modal-desc">${escapeHtml(p.description || 'Sin descripción.')}</p>
          <div class="product-modal-actions">
            <button type="button" class="btn-primary" id="modal-add-cart">Añadir al carrito</button>
          </div>
        </div>
      </div>
    `;
    productModalBody.querySelector('#modal-add-cart').addEventListener('click', () => {
      addToCart(p.id, 1);
      closeModal(productModal);
    });

    openModal(productModal);
  }

  function maxQtyForProduct(p, currentQty) {
    if (!p) return 0;
    if (p.stock == null) return currentQty + 999;
    return Math.max(0, p.stock - currentQty);
  }

  function addToCart(productId, qtyAdd) {
    const p = getProductById(productId);
    if (!p) return;
    if (p.stock != null && p.stock <= 0) {
      showToast('Producto sin stock');
      return;
    }
    const lines = normalizeCartLines();
    const idx = lines.findIndex((l) => l.productId === productId);
    const cur = idx >= 0 ? lines[idx].qty : 0;
    const canAdd = maxQtyForProduct(p, cur);
    const add = Math.min(qtyAdd, canAdd);
    if (add <= 0) {
      showToast('No hay más unidades disponibles');
      return;
    }
    if (idx >= 0) lines[idx].qty += add;
    else lines.push({ productId, qty: add });
    saveCartLines(lines);
    updateCartUI();
    showToast('Producto añadido al carrito');
  }

  function setLineQty(productId, qty) {
    const p = getProductById(productId);
    let lines = normalizeCartLines();
    const idx = lines.findIndex((l) => l.productId === productId);
    if (idx < 0) return;
    let q = Math.max(0, Math.floor(qty));
    if (p && p.stock != null) q = Math.min(q, p.stock);
    if (q <= 0) lines = lines.filter((l) => l.productId !== productId);
    else lines[idx].qty = q;
    saveCartLines(lines);
    updateCartUI();
  }

  function updateCartUI() {
    const lines = normalizeCartLines();
    if (cartContainer) cartContainer.innerHTML = '';
    let total = 0;
    let count = 0;
    lines.forEach((line) => {
      const p = getProductById(line.productId);
      if (!p) return;
      const sub = Number(p.price) * line.qty;
      total += sub;
      count += line.qty;
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <div class="cart-row-info">
          <span class="cart-row-name">${escapeHtml(p.name)}</span>
          <span class="cart-row-price">$${p.price} × ${line.qty} = $${sub.toFixed(2)}</span>
        </div>
        <div class="cart-row-controls">
          <button type="button" class="qty-btn" data-qty-dec="${escapeAttr(p.id)}" aria-label="Menos">−</button>
          <span class="qty-val">${line.qty}</span>
          <button type="button" class="qty-btn" data-qty-inc="${escapeAttr(p.id)}" aria-label="Más">+</button>
          <button type="button" class="cart-remove" data-remove="${escapeAttr(p.id)}" aria-label="Eliminar">✕</button>
        </div>
      `;
      row.querySelector('[data-qty-dec]').addEventListener('click', () =>
        setLineQty(p.id, line.qty - 1)
      );
      row.querySelector('[data-qty-inc]').addEventListener('click', () =>
        addToCart(p.id, 1)
      );
      row.querySelector('[data-remove]').addEventListener('click', () => setLineQty(p.id, 0));
      cartContainer.appendChild(row);
    });
    if (totalEl) {
      totalEl.innerHTML = `Total: <strong>$${total.toFixed(2)}</strong>`;
    }
    if (countEl) countEl.textContent = count > 99 ? '99+' : String(count);
    if (cartEmptyEl) cartEmptyEl.classList.toggle('hidden', count > 0);
    if (cartContainer) cartContainer.classList.toggle('hidden', count === 0);
    if (btnCheckout) btnCheckout.disabled = count === 0;
  }

  function fillCheckoutSummary() {
    if (!checkoutSummary) return;
    const lines = normalizeCartLines();
    let total = 0;
    let html = '<ul class="checkout-lines">';
    lines.forEach((line) => {
      const p = getProductById(line.productId);
      if (!p) return;
      const sub = Number(p.price) * line.qty;
      total += sub;
      html += `<li>${escapeHtml(p.name)} × ${line.qty} — $${sub.toFixed(2)}</li>`;
    });
    html += `</ul><p class="checkout-total-line"><strong>Total: $${total.toFixed(2)}</strong></p>`;
    checkoutSummary.innerHTML = html;
  }

  const openCartBtn = document.getElementById('open-cart');
  if (openCartBtn) {
    openCartBtn.addEventListener('click', () => {
      updateCartUI();
      openModal(cartModal);
    });
  }

  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      closeModal(cartModal);
      fillCheckoutSummary();
      checkoutForm?.classList.remove('hidden');
      checkoutSuccess?.classList.add('hidden');
      openModal(checkoutModal);
    });
  }

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      checkoutForm.classList.add('hidden');
      checkoutSuccess?.classList.remove('hidden');
      saveCartLines([]);
      updateCartUI();
    });
  }

  if (checkoutDone) {
    checkoutDone.addEventListener('click', () => {
      closeModal(checkoutModal);
      checkoutForm?.reset();
      checkoutForm?.classList.remove('hidden');
      checkoutSuccess?.classList.add('hidden');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      renderProducts();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortMode = sortSelect.value;
      renderProducts();
    });
  }

  if (footerYear) footerYear.textContent = String(new Date().getFullYear());

  document.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY) {
      renderProducts();
      updateCartUI();
    }
  });

  window.addEventListener('focus', () => {
    renderProducts();
    updateCartUI();
  });

  renderProducts();
  updateCartUI();
})();
