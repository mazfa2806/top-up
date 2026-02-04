const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";
const ADMIN_KEY = "mazfa2806";

const WA_NUMBER = "6283850340631";

let PRODUCTS = [];
let ACTIVE_CAT = "all";

/* ================== UTIL ================== */
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeJS(str) {
  return String(str).replace(/'/g, "\\'");
}
function toNumber(val) {
  return Number(String(val ?? "").replace(/[^\d.-]/g, "")) || 0;
}
function formatIDR(val) {
  const n = toNumber(val);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
function badgeFor(stockVal) {
  const s = toNumber(stockVal);
  if (s <= 0) return { cls: "sold", text: "Habis" };
  if (s <= 5) return { cls: "limited", text: "Limited" };
  return { cls: "ready", text: "Ready" };
}

/* ================== CATEGORY (DARI NAMA) ================== */
function guessCategory(name) {
  const n = String(name || "").toLowerCase();

  // Diamond Free Fire
  if (
    n.includes("[ff]") ||
    n.includes("free fire") ||
    n.includes("diamond ff") ||
    n.includes("dm ff")
  ) return "ff";

  // Panel Pterodactyl
  if (
    n.includes("[panel]") ||
    n.includes("pterodactyl") ||
    n.includes("ptero") ||
    n.startsWith("panel")
  ) return "panel";

  // APK Premium
  if (
    n.includes("[apk]") ||
    n.includes("apk premium") ||
    n.includes("apk") ||
    n.includes("premium") ||
    n.includes("pro") ||
    n.includes("mod")
  ) return "apk";

  return "lain";
}

// Saat tambah produk: tempelin prefix biar kategori kebaca di index/admin
function normalizeNameWithCategory(rawName, cat) {
  const n = String(rawName || "").trim();
  const low = n.toLowerCase();

  if (cat === "ff") {
    if (!low.includes("[ff]") && !low.includes("free fire") && !low.includes("diamond ff") && !low.includes("dm ff")) {
      return `[FF] ${n}`;
    }
    return n;
  }

  if (cat === "panel") {
    if (!low.includes("[panel]") && !low.startsWith("panel") && !low.includes("ptero") && !low.includes("pterodactyl")) {
      return `[PANEL] ${n}`;
    }
    return n;
  }

  if (cat === "apk") {
    if (!low.includes("[apk]") && !low.includes("apk")) {
      return `[APK] ${n}`;
    }
    if (!low.includes("premium") && !low.includes("pro")) {
      return `${n} Premium`;
    }
    return n;
  }

  return n;
}

/* ================== CORE LOAD ================== */
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

      if (isAdmin) {
        bindAdminFilterOnce();
        renderAdminList();
      } else {
        bindIndexControlsOnce();
        buildIndexChips();
        renderIndex();
      }
    })
    .catch(err => {
      if (loading) loading.style.display = "none";
      console.error(err);
      alert("Gagal memuat produk");
    });
}

/* ================== INDEX ================== */
function applyIndexFilters(items) {
  const q = (document.getElementById("search")?.value || "").toLowerCase().trim();
  const cat = (document.getElementById("category")?.value || ACTIVE_CAT || "all");
  const sort = (document.getElementById("sort")?.value || "default");

  let out = items.slice();

  if (cat !== "all") out = out.filter(p => guessCategory(p?.name) === cat);
  if (q) out = out.filter(p => String(p?.name || "").toLowerCase().includes(q));

  if (sort === "low") out.sort((a,b) => toNumber(a?.price) - toNumber(b?.price));
  if (sort === "high") out.sort((a,b) => toNumber(b?.price) - toNumber(a?.price));
  if (sort === "az") out.sort((a,b) => String(a?.name||"").localeCompare(String(b?.name||"")));

  return out;
}

function renderIndex() {
  const list = document.getElementById("product-list");
  if (!list) return;

  const filtered = applyIndexFilters(PRODUCTS);
  updateCount(filtered.length);

  let html = "";
  filtered.forEach((p) => {
    const name = p?.name ?? "";
    const priceText = formatIDR(p?.price ?? "");
    const stock = p?.stock ?? "";
    const b = badgeFor(stock);

    html += `
      <div class="card">
        <div class="info">
          <h3>${escapeHTML(name)}</h3>
          <p>Harga: ${escapeHTML(priceText)}</p>
          <p>Stok: ${escapeHTML(stock)}</p>
          <div class="badge ${b.cls}">${b.text}</div>
        </div>
        <button onclick="buy('${escapeJS(name)}','${escapeJS(priceText)}')">Beli</button>
      </div>
    `;
  });

  list.innerHTML = html || `<div class="loading">Tidak ada produk.</div>`;
}

function updateCount(n) {
  const el = document.getElementById("count");
  if (el) el.textContent = `Menampilkan ${n} produk`;
}

function buildIndexChips() {
  const wrap = document.getElementById("catChips");
  if (!wrap) return;

  const cats = [
    ["all", "All"],
    ["ff", "Diamond FF"],
    ["panel", "Panel Ptero"],
    ["apk", "APK Premium"],
    ["lain", "Lainnya"],
  ];

  const current = document.getElementById("category")?.value || ACTIVE_CAT || "all";

  wrap.innerHTML = cats.map(([val,label]) => `
    <button class="chip-btn ${val===current?'active':''}" type="button" data-cat="${val}">
      ${label}
    </button>
  `).join("");

  wrap.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.cat || "all";
      ACTIVE_CAT = v;
      const sel = document.getElementById("category");
      if (sel) sel.value = v;
      buildIndexChips();
      renderIndex();
    });
  });
}

function bindIndexControlsOnce() {
  const qEl = document.getElementById("search");
  const clearEl = document.getElementById("clearSearch");
  const catEl = document.getElementById("category");
  const sortEl = document.getElementById("sort");

  if (!qEl || !clearEl || !catEl || !sortEl) return;
  if (qEl.dataset.bound === "1") return;
  qEl.dataset.bound = "1";

  const apply = () => {
    ACTIVE_CAT = catEl.value || ACTIVE_CAT;
    buildIndexChips();
    renderIndex();
  };

  qEl.addEventListener("input", apply);
  catEl.addEventListener("change", apply);
  sortEl.addEventListener("change", apply);
  clearEl.addEventListener("click", () => { qEl.value=""; apply(); });
}

/* ================== BUY (WA) ================== */
function buy(name, priceText) {
  const text = `Halo admin, saya mau beli:\nProduk: ${name}\nHarga: ${priceText}`;
  const url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
  window.location.href = url;
}

/* ================== ADMIN ================== */
function login() {
  const pass = document.getElementById("adminPass")?.value || "";
  if (pass === ADMIN_KEY) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    loadProducts(true);
  } else alert("Password salah");
}

function logout() { location.reload(); }

function addProduct() {
  const rawName = document.getElementById("pname")?.value?.trim() || "";
  const price = document.getElementById("pprice")?.value?.trim() || "";
  const stock = document.getElementById("pstock")?.value?.trim() || "";
  const cat = document.getElementById("pcat")?.value || "lain";

  if (!rawName || !price) return alert("Nama & harga wajib diisi");

  const name = normalizeNameWithCategory(rawName, cat);

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "add",
      name, price, stock
    })
  })
  .then(() => {
    const n = document.getElementById("pname"); if (n) n.value = "";
    const p = document.getElementById("pprice"); if (p) p.value = "";
    const s = document.getElementById("pstock"); if (s) s.value = "";
    loadProducts(true);
  })
  .catch(err => {
    console.error(err);
    alert("Gagal tambah produk");
  });
}

// admin filter view -> delete harus pakai index asli
function getAdminView() {
  const q = (document.getElementById("adminSearch")?.value || "").toLowerCase().trim();
  const cat = (document.getElementById("adminCategory")?.value || "all");

  let view = PRODUCTS.map((p, idx) => ({ p, idx }));

  if (cat !== "all") view = view.filter(x => guessCategory(x.p?.name) === cat);
  if (q) view = view.filter(x => String(x.p?.name || "").toLowerCase().includes(q));

  return view;
}

function renderAdminList() {
  const list = document.getElementById("product-list");
  if (!list) return;

  const view = getAdminView();
  let html = "";

  view.forEach(({p, idx}) => {
    const name = p?.name ?? "";
    const price = p?.price ?? "";
    const stock = p?.stock ?? "";

    const cat = guessCategory(name);
    const catLabel =
      cat === "ff" ? "Diamond FF" :
      cat === "panel" ? "Panel Ptero" :
      cat === "apk" ? "APK Premium" : "Lainnya";

    html += `
      <div class="card">
        <div class="info">
          <h3>${escapeHTML(name)}</h3>
          <p>Harga: ${escapeHTML(price)}</p>
          <p>Stok: ${escapeHTML(stock)}</p>
          <p style="opacity:.75;font-size:12px;margin-top:6px;">Kategori: ${catLabel}</p>
        </div>
        <button onclick="deleteProduct(${idx})">Hapus</button>
      </div>
    `;
  });

  list.innerHTML = html || `<div class="loading">Tidak ada produk di filter ini.</div>`;
}

function bindAdminFilterOnce() {
  const s = document.getElementById("adminSearch");
  const c = document.getElementById("adminCategory");
  if (!s || !c) return;

  if (s.dataset.bound === "1") return;
  s.dataset.bound = "1";

  const apply = () => renderAdminList();
  s.addEventListener("input", apply);
  c.addEventListener("change", apply);
}

function adminResetFilter() {
  const s = document.getElementById("adminSearch");
  const c = document.getElementById("adminCategory");
  if (s) s.value = "";
  if (c) c.value = "all";
  renderAdminList();
}

function deleteProduct(realIndex) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "delete",
      index: realIndex
    })
  })
  .then(() => loadProducts(true))
  .catch(err => {
    console.error(err);
    alert("Gagal hapus produk");
  });
    }
