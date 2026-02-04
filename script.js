const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";
const ADMIN_KEY = "mazfa2806";

let PRODUCTS = [];
let ACTIVE_CAT = "all";

function loadProducts(isAdmin) {
  const loading = document.getElementById("loading");
  const list = document.getElementById("product-list");

  if (loading) loading.style.display = "block";
  if (list) list.innerHTML = "";

  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      if (loading) loading.style.display = "none";

      if (!Array.isArray(data)) {
        console.log("Response bukan array:", data);
        alert("Format data dari server tidak sesuai.");
        return;
      }

      PRODUCTS = data;

      // render awal
      renderProducts(isAdmin, applyFilters(PRODUCTS, isAdmin));

      // setup fitur index saja (tidak ganggu admin)
      if (!isAdmin) {
        buildCategoryChips();
        bindSearchSort();
        updateCount(applyFilters(PRODUCTS, false).length);
      }
    })
    .catch(err => {
      if (loading) loading.style.display = "none";
      console.error(err);
      alert("Gagal memuat produk");
    });
}

/* ========= BUY ========= */
function buy(name, priceText) {
  const waNumber = "6283850340631";
  const text = `Halo admin, saya mau beli:\nProduk: ${name}\nHarga: ${priceText}`;
  const url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

/* ========= ADMIN (biarkan sama) ========= */
function login() {
  const passEl = document.getElementById("adminPass");
  const pass = passEl ? passEl.value : "";

  if (pass === ADMIN_KEY) {
    const loginBox = document.getElementById("login-box");
    const panel = document.getElementById("admin-panel");
    if (loginBox) loginBox.style.display = "none";
    if (panel) panel.style.display = "block";
    loadProducts(true);
  } else alert("Password salah");
}

function logout() { location.reload(); }

function addProduct() {
  const nameEl = document.getElementById("pname");
  const priceEl = document.getElementById("pprice");
  const stockEl = document.getElementById("pstock");

  const name = nameEl ? nameEl.value.trim() : "";
  const price = priceEl ? priceEl.value.trim() : "";
  const stock = stockEl ? stockEl.value.trim() : "";

  if (!name || !price) return alert("Nama & harga wajib diisi");

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "add",
      name, price, stock,
      Produk: name,
      Harga: price,
      Stok: stock
    })
  }).then(() => loadProducts(true));
}

function deleteProduct(i) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "delete",
      index: i
    })
  }).then(() => loadProducts(true));
}

/* ========= INDEX ENHANCEMENTS ========= */

function formatIDR(val) {
  const n = Number(String(val).replace(/[^\d.-]/g, "")) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function badgeFor(stockVal){
  const s = Number(stockVal) || 0;
  if (s <= 0) return { cls:"sold", text:"Habis" };
  if (s <= 5) return { cls:"limited", text:"Limited" };
  return { cls:"ready", text:"Ready" };
}

// Kategori otomatis dari nama (kalau belum ada category field)
function guessCategory(name){
  const n = String(name || "").toLowerCase();
  if (n.includes("diamond")) return "diamond";
  if (n.includes("top up") || n.includes("topup")) return "topup";
  if (n.includes("voucher")) return "voucher";
  return "lainnya";
}

function applyFilters(items, isAdmin){
  if (isAdmin) return items;

  const qEl = document.getElementById("search");
  const sortEl = document.getElementById("sort");
  const q = (qEl?.value || "").toLowerCase().trim();
  const sort = sortEl?.value || "default";

  let out = items.slice();

  // category filter
  if (ACTIVE_CAT !== "all") {
    out = out.filter(p => guessCategory(p?.name) === ACTIVE_CAT);
  }

  // search
  if (q) {
    out = out.filter(p => String(p?.name || "").toLowerCase().includes(q));
  }

  // sort
  const priceNum = (p) => Number(String(p?.price ?? 0).replace(/[^\d.-]/g,"")) || 0;
  if (sort === "low") out.sort((a,b) => priceNum(a) - priceNum(b));
  if (sort === "high") out.sort((a,b) => priceNum(b) - priceNum(a));
  if (sort === "az") out.sort((a,b) => String(a?.name||"").localeCompare(String(b?.name||"")));

  return out;
}

function renderProducts(isAdmin, items) {
  const list = document.getElementById("product-list");
  if (!list) return;

  let html = "";
  items.forEach((p, i) => {
    const name = p?.name ?? "";
    const priceRaw = p?.price ?? "";
    const stock = p?.stock ?? "";

    const priceText = isAdmin ? escapeHTML(priceRaw) : formatIDR(priceRaw);
    const b = badgeFor(stock);

    html += `
      <div class="card">
        <div class="info">
          <h3>${escapeHTML(name)}</h3>
          <p>Harga: ${isAdmin ? escapeHTML(priceRaw) : priceText}</p>
          <p>Stok: ${escapeHTML(stock)}</p>
          ${!isAdmin ? `<div class="badge ${b.cls}">${b.text}</div>` : ``}
        </div>
        ${
          isAdmin
            ? `<button onclick="deleteProduct(${i})">Hapus</button>`
            : `<button onclick="buy('${escapeJS(name)}','${escapeJS(priceText)}')">Beli</button>`
        }
      </div>
    `;
  });

  list.innerHTML = html || `<div class="loading">Tidak ada produk.</div>`;
}

function buildCategoryChips(){
  const wrap = document.getElementById("catChips");
  if (!wrap) return;

  const cats = ["all","diamond","topup","voucher","lainnya"];
  wrap.innerHTML = cats.map(c => `
    <button class="chip-btn ${c===ACTIVE_CAT?'active':''}" type="button" data-cat="${c}">
      ${c === "all" ? "All" : c}
    </button>
  `).join("");

  wrap.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      ACTIVE_CAT = btn.dataset.cat || "all";
      buildCategoryChips();
      const filtered = applyFilters(PRODUCTS, false);
      renderProducts(false, filtered);
      updateCount(filtered.length);
    });
  });
}

function bindSearchSort(){
  const qEl = document.getElementById("search");
  const clearEl = document.getElementById("clearSearch");
  const sortEl = document.getElementById("sort");
  if (!qEl || !sortEl || !clearEl) return;

  if (qEl.dataset.bound === "1") return;
  qEl.dataset.bound = "1";

  const apply = () => {
    const filtered = applyFilters(PRODUCTS, false);
    renderProducts(false, filtered);
    updateCount(filtered.length);
  };

  qEl.addEventListener("input", apply);
  sortEl.addEventListener("change", apply);
  clearEl.addEventListener("click", () => { qEl.value=""; apply(); });
}

function updateCount(n){
  const el = document.getElementById("count");
  if (el) el.textContent = `Menampilkan ${n} produk`;
}

/* ========= escape helpers ========= */
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeJS(str) {
  return String(str).replace(/'/g, "\\'");
}
