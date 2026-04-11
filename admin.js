  async function startAdminPanel() {
    if (window.__electrostoreAdminMounted) return;
    window.__electrostoreAdminMounted = true;
    
    // Cargar catálogo desde Supabase o localStorage
    let catalog = await loadCatalog();

  const catList = document.getElementById('cat-list');
  const catNameInput = document.getElementById('cat-name');
  const catForm = document.getElementById('cat-form');
  const catEditingId = document.getElementById('cat-editing-id');
  const catSubmitBtn = document.getElementById('cat-submit');

  const prodList = document.getElementById('prod-list');
  const prodForm = document.getElementById('prod-form');
  const prodIdInput = document.getElementById('prod-id');
  const prodCodeInput = document.getElementById('prod-code');
  const prodNameInput = document.getElementById('prod-name');
  const prodPriceInput = document.getElementById('prod-price');
  const prodCurrencySelect = document.getElementById('prod-currency');
  const prodCategorySelect = document.getElementById('prod-category');
  const prodImageUrlInput = document.getElementById('prod-image-url');
  const prodImagePreview = document.getElementById('prod-image-preview');
  const prodSubmitBtn = document.getElementById('prod-submit');
  const prodCancelBtn = document.getElementById('prod-cancel');
  const prodClearImageBtn = document.getElementById('prod-clear-image');
  const prodDescriptionInput = document.getElementById('prod-description');
  const prodFeaturedInput = document.getElementById('prod-featured');
  const prodStockInput = document.getElementById('prod-stock');
  const codeValidationMsg = document.getElementById('code-validation-msg');

  let pendingImageData = null;

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function persist() {
    saveCatalog(catalog);
    // Forzar recarga de datos después de guardar
    setTimeout(async () => {
      catalog = await loadCatalog();
      renderCategories();
      fillProductCategorySelect();
      renderProducts();
    }, 500);
  }

  function renderCategories() {
    console.log('Renderizando categorías:', catalog.categories);
    catList.innerHTML = '';
    if (!catalog.categories || catalog.categories.length === 0) {
      catList.innerHTML = '<li class="admin-empty">No hay categorías. Crea la primera arriba.</li>';
      return;
    }
    catalog.categories.forEach((c) => {
      const count = catalog.products.filter((p) => p.categoryId === c.id).length;
      const li = document.createElement('li');
      li.className = 'admin-list-item';
      li.innerHTML = `
      <div>
        <strong>${escapeHtml(c.name)}</strong>
        <span class="muted">(${count} producto${count !== 1 ? 's' : ''})</span>
      </div>
      <div class="admin-actions">
        <button type="button" class="btn-secondary" data-edit-cat="${c.id}">Editar</button>
        <button type="button" class="btn-danger" data-del-cat="${c.id}">Eliminar</button>
      </div>
    `;
      li.querySelector('[data-edit-cat]').addEventListener('click', () => startEditCategory(c.id));
      li.querySelector('[data-del-cat]').addEventListener('click', () => deleteCategory(c.id));
      catList.appendChild(li);
    });
  }

  function startEditCategory(id) {
    const c = catalog.categories.find((x) => x.id === id);
    if (!c) return;
    catNameInput.value = c.name;
    catEditingId.value = id;
    catSubmitBtn.textContent = 'Guardar categoría';
  }

  function resetCategoryForm() {
    catNameInput.value = '';
    catEditingId.value = '';
    catSubmitBtn.textContent = 'Añadir categoría';
  }

  catForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = catNameInput.value.trim();
    console.log('Enviando categoría:', name, 'editId:', catEditingId.value);
    if (!name) {
      console.warn('Nombre de categoría vacío');
      return;
    }
    const editId = catEditingId.value;
    if (editId) {
      const c = catalog.categories.find((x) => x.id === editId);
      if (c) {
        c.name = name;
        console.log('Categoría actualizada:', c);
      }
    } else {
      const newCat = { id: uid(), name };
      console.log('Nueva categoría:', newCat);
      catalog.categories.push(newCat);
    }
    persist();
    resetCategoryForm();
    renderCategories();
    fillProductCategorySelect();
  });

  function deleteCategory(id) {
    const hasProducts = catalog.products.some((p) => p.categoryId === id);
    const msg = hasProducts
      ? 'Esta categoría tiene productos. ¿Eliminarla y dejar esos productos sin categoría?'
      : '¿Eliminar esta categoría?';
    if (!confirm(msg)) return;
    catalog.categories = catalog.categories.filter((c) => c.id !== id);
    catalog.products.forEach((p) => {
      if (p.categoryId === id) p.categoryId = null;
    });
    persist();
    renderCategories();
    fillProductCategorySelect();
    renderProducts();
  }

  function fillProductCategorySelect() {
    console.log('Llenando select de categorías, disponibles:', catalog.categories);
    const cur = prodCategorySelect.value;
    prodCategorySelect.innerHTML = '<option value="">— Sin categoría —</option>';
    if (!catalog.categories || catalog.categories.length === 0) {
      console.warn('No hay categorías disponibles');
    }
    catalog.categories.forEach((c) => {
      prodCategorySelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    });
    if (cur && [...prodCategorySelect.options].some((o) => o.value === cur)) {
      prodCategorySelect.value = cur;
    }
  }

  function renderProducts() {
    prodList.innerHTML = '';
    if (!catalog.products.length) {
      prodList.innerHTML = '<li class="admin-empty">No hay productos. Añade uno con el formulario.</li>';
      return;
    }
    catalog.products.forEach((p) => {
      const catName =
        catalog.categories.find((c) => c.id === p.categoryId)?.name || 'Sin categoría';
      const thumbSrc = resolveAssetUrl(p.img);
      const li = document.createElement('li');
      li.className = 'admin-list-item admin-product-row';
      const feat = p.featured
        ? '<span class="admin-badge-featured" title="Destacado en inicio">DESTACADO</span>'
        : '';
      li.innerHTML = `
      <div class="admin-product-info">
        <img src="${thumbSrc}" alt="" class="admin-thumb" loading="lazy">
        <div>
          <strong>${escapeHtml(p.name)}${feat}</strong>
          <div class="muted">${p.code} · ${p.currency} $${p.price} · ${escapeHtml(catName)}</div>
        </div>
      </div>
      <div class="admin-actions">
        <button type="button" class="btn-secondary" data-edit-prod="${p.id}">Editar</button>
        <button type="button" class="btn-danger" data-del-prod="${p.id}">Eliminar</button>
      </div>
    `;
      li.querySelector('[data-edit-prod]').addEventListener('click', () => startEditProduct(p.id));
      li.querySelector('[data-del-prod]').addEventListener('click', () => deleteProduct(p.id));
      prodList.appendChild(li);
    });
  }

  function isDataUrl(s) {
    return typeof s === 'string' && s.startsWith('data:');
  }

  function startEditProduct(id) {
    const p = catalog.products.find((x) => x.id === id);
    if (!p) return;
    prodIdInput.value = p.id;
    prodCodeInput.value = p.code || '';
    prodNameInput.value = p.name;
    prodPriceInput.value = p.price;
    prodCurrencySelect.value = p.currency || 'USD';
    prodCategorySelect.value = p.categoryId || '';
    if (prodDescriptionInput) prodDescriptionInput.value = p.description || '';
    if (prodFeaturedInput) prodFeaturedInput.checked = !!p.featured;
    if (prodStockInput) prodStockInput.value = p.stock != null ? String(p.stock) : '';
    if (isDataUrl(p.img)) {
      prodImageUrlInput.value = '';
      prodImagePreview.src = p.img;
      prodImagePreview.classList.remove('hidden');
    } else {
      prodImageUrlInput.value = p.img;
      prodImagePreview.src = resolveAssetUrl(p.img);
      prodImagePreview.classList.remove('hidden');
    }
    prodSubmitBtn.textContent = 'Guardar producto';
    prodCancelBtn.classList.remove('hidden');
    prodForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetProductForm() {
    prodIdInput.value = '';
    prodCodeInput.value = '';
    prodNameInput.value = '';
    prodPriceInput.value = '';
    prodCurrencySelect.value = 'USD';
    prodCategorySelect.value = '';
    prodImageUrlInput.value = '';
    prodImagePreview.src = '';
    prodImagePreview.classList.add('hidden');
    if (prodDescriptionInput) prodDescriptionInput.value = '';
    if (prodFeaturedInput) prodFeaturedInput.checked = false;
    if (prodStockInput) prodStockInput.value = '';
    codeValidationMsg.style.display = 'none';
    prodSubmitBtn.textContent = 'Añadir producto';
    prodCancelBtn.classList.add('hidden');
  }

  prodCancelBtn.addEventListener('click', () => resetProductForm());

  prodClearImageBtn.addEventListener('click', () => {
    prodImageUrlInput.value = '';
    prodImagePreview.src = '';
    prodImagePreview.classList.add('hidden');
  });

  // Validación en tiempo real del código de producto
  prodCodeInput.addEventListener('input', () => {
    const code = prodCodeInput.value.trim().toUpperCase();
    const currentProdId = prodIdInput.value;
    const codeRegex = /^[A-Z]{2}-[A-Z]{3}-\d{3}$/;

    if (!code) {
      codeValidationMsg.style.display = 'none';
      return;
    }

    if (!codeRegex.test(code)) {
      codeValidationMsg.textContent = '❌ Formato inválido. Usa XX-XXX-NNN (ej: CP-REF-001)';
      codeValidationMsg.style.color = '#ff6b6b';
      codeValidationMsg.style.display = 'block';
      prodCodeInput.style.borderColor = '#ff6b6b';
      return;
    }

    // Verificar si el código ya existe en otro producto
    const codeExists = catalog.products.some(
      (p) => p.code === code && p.id !== currentProdId
    );

    if (codeExists) {
      codeValidationMsg.textContent = '❌ Este código ya existe en otro producto';
      codeValidationMsg.style.color = '#ff6b6b';
      codeValidationMsg.style.display = 'block';
      prodCodeInput.style.borderColor = '#ff6b6b';
    } else {
      codeValidationMsg.textContent = '✓ Código disponible';
      codeValidationMsg.style.color = '#51cf66';
      codeValidationMsg.style.display = 'block';
      prodCodeInput.style.borderColor = '#51cf66';
    }
  });

  prodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = prodCodeInput.value.trim().toUpperCase();
    const name = prodNameInput.value.trim();
    const price = parseFloat(prodPriceInput.value);
    const currency = prodCurrencySelect.value;
    const categoryId = prodCategorySelect.value || null;
    const urlVal = prodImageUrlInput.value.trim();
    const description = prodDescriptionInput ? prodDescriptionInput.value.trim() : '';
    const featured = prodFeaturedInput ? prodFeaturedInput.checked : false;
    const stockRaw = prodStockInput ? prodStockInput.value.trim() : '';
    const stock =
      stockRaw === '' ? null : Math.max(0, Math.floor(Number(stockRaw)));
    
    // Validaciones
    if (!code || !/^[A-Z]{2}-[A-Z]{3}-\d{3}$/.test(code)) {
      alert('Código inválido. Usa formato XX-XXX-NNN (ej: CP-REF-001)');
      return;
    }
    if (!name || Number.isNaN(price) || price < 0) {
      alert('Nombre y precio válido son obligatorios.');
      return;
    }
    if (stockRaw !== '' && Number.isNaN(stock)) {
      alert('Stock debe ser un número entero o dejarse vacío.');
      return;
    }
    
    // Verificar código único
    const editId = prodIdInput.value;
    const codeExists = catalog.products.some(
      (p) => p.code === code && p.id !== editId
    );
    if (codeExists) {
      alert('El código ' + code + ' ya existe en otro producto.');
      return;
    }
    
    const fallbackImg = 'https://placehold.co/400x300/141414/dc2626?text=Producto';

    if (editId) {
      const p = catalog.products.find((x) => x.id === editId);
      if (p) {
        p.code = code;
        p.name = name;
        p.price = price;
        p.currency = currency;
        p.categoryId = categoryId;
        p.description = description;
        p.stock = stock;
        if (featured) {
          catalog.products.forEach((x) => {
            x.featured = x.id === editId;
          });
        } else {
          p.featured = false;
        }
        // Usar la ruta de imagen local proporcionada
        if (urlVal) {
          p.img = urlVal;
        } else {
          p.img = fallbackImg;
        }
      }
    } else {
      // Nuevo producto: usar la ruta de imagen local o fallback
      const img = urlVal || fallbackImg;
      const newId = uid();
      if (featured) {
        catalog.products.forEach((x) => {
          x.featured = false;
        });
      }
      catalog.products.push({
        id: newId,
        code,
        name,
        price,
        currency,
        categoryId,
        img,
        description,
        featured: !!featured,
        stock
      });
    }

    persist();
    resetProductForm();
    renderCategories();
    renderProducts();
  });

  function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    catalog.products = catalog.products.filter((p) => p.id !== id);
    persist();
    renderCategories();
    renderProducts();
    resetProductForm();
  }

  renderCategories();
  console.log('Inicializando panel admin, categorías iniciales:', catalog.categories);
  fillProductCategorySelect();
  renderProducts();
}

window.addEventListener('electrostore-admin-auth', startAdminPanel);

// Exportar para uso global
window.startAdminPanel = startAdminPanel;
