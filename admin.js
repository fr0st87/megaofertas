function startAdminPanel() {
  if (window.__electrostoreAdminMounted) return;
  window.__electrostoreAdminMounted = true;

  let catalog = loadCatalog();

  const catList = document.getElementById('cat-list');
  const catNameInput = document.getElementById('cat-name');
  const catForm = document.getElementById('cat-form');
  const catEditingId = document.getElementById('cat-editing-id');
  const catSubmitBtn = document.getElementById('cat-submit');

  const prodList = document.getElementById('prod-list');
  const prodForm = document.getElementById('prod-form');
  const prodIdInput = document.getElementById('prod-id');
  const prodNameInput = document.getElementById('prod-name');
  const prodPriceInput = document.getElementById('prod-price');
  const prodCategorySelect = document.getElementById('prod-category');
  const prodImageUrlInput = document.getElementById('prod-image-url');
  const prodImageInput = document.getElementById('prod-image');
  const prodImagePreview = document.getElementById('prod-image-preview');
  const prodSubmitBtn = document.getElementById('prod-submit');
  const prodCancelBtn = document.getElementById('prod-cancel');
  const prodClearImageBtn = document.getElementById('prod-clear-image');
  const prodDescriptionInput = document.getElementById('prod-description');
  const prodFeaturedInput = document.getElementById('prod-featured');
  const prodStockInput = document.getElementById('prod-stock');

  let pendingImageData = null;

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function persist() {
    saveCatalog(catalog);
  }

  function renderCategories() {
    catList.innerHTML = '';
    if (!catalog.categories.length) {
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
    if (!name) return;
    const editId = catEditingId.value;
    if (editId) {
      const c = catalog.categories.find((x) => x.id === editId);
      if (c) c.name = name;
    } else {
      catalog.categories.push({ id: uid(), name });
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
    const cur = prodCategorySelect.value;
    prodCategorySelect.innerHTML = '<option value="">— Sin categoría —</option>';
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
          <div class="muted">$${p.price} · ${escapeHtml(catName)}</div>
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
    prodNameInput.value = p.name;
    prodPriceInput.value = p.price;
    prodCategorySelect.value = p.categoryId || '';
    if (prodDescriptionInput) prodDescriptionInput.value = p.description || '';
    if (prodFeaturedInput) prodFeaturedInput.checked = !!p.featured;
    if (prodStockInput) prodStockInput.value = p.stock != null ? String(p.stock) : '';
    pendingImageData = null;
    prodImageInput.value = '';
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
    prodNameInput.value = '';
    prodPriceInput.value = '';
    prodCategorySelect.value = '';
    prodImageUrlInput.value = '';
    prodImageInput.value = '';
    pendingImageData = null;
    prodImagePreview.src = '';
    prodImagePreview.classList.add('hidden');
    if (prodDescriptionInput) prodDescriptionInput.value = '';
    if (prodFeaturedInput) prodFeaturedInput.checked = false;
    if (prodStockInput) prodStockInput.value = '';
    prodSubmitBtn.textContent = 'Añadir producto';
    prodCancelBtn.classList.add('hidden');
  }

  prodCancelBtn.addEventListener('click', () => resetProductForm());

  prodImageInput.addEventListener('change', () => {
    const file = prodImageInput.files && prodImageInput.files[0];
    if (!file || !file.type.startsWith('image/')) {
      if (file) alert('Elige un archivo de imagen (JPG, PNG, WEBP, etc.).');
      return;
    }
    if (file.size > 1.2 * 1024 * 1024) {
      alert(
        'La imagen supera ~1,2 MB: en GitHub Pages conviene usar archivos en img/productos/ y la ruta en el campo URL.'
      );
      prodImageInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingImageData = reader.result;
      prodImagePreview.src = pendingImageData;
      prodImagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  prodClearImageBtn.addEventListener('click', () => {
    pendingImageData = '';
    prodImageInput.value = '';
    prodImagePreview.src = '';
    prodImagePreview.classList.add('hidden');
  });

  prodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = prodNameInput.value.trim();
    const price = parseFloat(prodPriceInput.value);
    const categoryId = prodCategorySelect.value || null;
    const urlVal = prodImageUrlInput.value.trim();
    const description = prodDescriptionInput ? prodDescriptionInput.value.trim() : '';
    const featured = prodFeaturedInput ? prodFeaturedInput.checked : false;
    const stockRaw = prodStockInput ? prodStockInput.value.trim() : '';
    const stock =
      stockRaw === '' ? null : Math.max(0, Math.floor(Number(stockRaw)));
    if (!name || Number.isNaN(price) || price < 0) {
      alert('Nombre y precio válido son obligatorios.');
      return;
    }
    if (stockRaw !== '' && Number.isNaN(stock)) {
      alert('Stock debe ser un número entero o dejarse vacío.');
      return;
    }
    const editId = prodIdInput.value;
    const fallbackImg = 'https://placehold.co/400x300/141414/dc2626?text=Producto';

    if (editId) {
      const p = catalog.products.find((x) => x.id === editId);
      if (p) {
        p.name = name;
        p.price = price;
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
        if (pendingImageData !== null) {
          if (pendingImageData === '') {
            p.img = urlVal || fallbackImg;
          } else if (pendingImageData) {
            p.img = pendingImageData;
          }
        } else if (urlVal) {
          p.img = urlVal;
        }
      }
    } else {
      let img;
      if (pendingImageData) {
        img = pendingImageData;
      } else if (urlVal) {
        img = urlVal;
      } else {
        img = fallbackImg;
      }
      const newId = uid();
      if (featured) {
        catalog.products.forEach((x) => {
          x.featured = false;
        });
      }
      catalog.products.push({
        id: newId,
        name,
        price,
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
  fillProductCategorySelect();
  renderProducts();
}

window.addEventListener('electrostore-admin-auth', startAdminPanel);
