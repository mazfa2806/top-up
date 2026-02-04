const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";
const ADMIN_KEY = "mazfa2806";

let PRODUCTS = [];

/* ================== KATEGORI DARI NAMA (TANPA UBAH SHEET) ================== */
function guessCategory(name) {
  const n = String(name || "").toLowerCase();

  // Diamond Free Fire
  if (
    n.includes("free fire") ||
    n.includes("diamond ff") ||
    n.includes("diamond free fire") ||
    n.includes("dm ff") ||
    n.includes("[ff]") ||
    n.includes(" ff ")
  ) return "ff";

  // Panel Pterodactyl
  if (
    n.includes("pterodactyl") ||
    n.includes("ptero") ||
    n.includes("[panel]") ||
    n.includes("panel ptero") ||
    n.includes("panel pterodactyl") ||
    n.startsWith("panel")
  ) return "panel";

  // APK Premium
  if (
    n.includes("apk premium") ||
    n.includes("[apk]") ||
    n.includes("apk") ||
    n.includes("premium") ||
    n.includes("pro") ||
    n.includes("mod")
  ) return "apk";

  return "lain";
}

// Saat tambah produk: tempelin prefix biar kategori kebaca
function normalizeNameWithCategory(name, cat) {
  const n = String(name || "").trim();
  const low = n.toLowerCase();

  if (cat === "ff") {
    if (!low.includes("ff") && !low.includes("free fire")) return `[FF] ${n}`;
    return n;
  }
  if (cat === "panel") {
    if (!low.includes("panel") && !low.includes("ptero") && !low.includes("pterodactyl")) return `[PANEL] ${n}`;
    if (!low.includes("ptero") && !low.includes("pterodactyl")) return `${n} (Pterodactyl)`;
    return n;
  }
  if (cat === "apk") {
    if (!low.includes("apk")) return `[APK] ${n}`;
    if (!low.includes("premium") && !low.includes("pro")) return `${n} Premium`;
    return n;
  }
  return n;
}

/* ================== LOAD ================== */
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
        renderAdminList();
        bindAdminFilterOnce();
      } else {
        renderStoreList();
      }
    })
    .catch(err => {
      if (loading) loading.style.display = "none";
      console.error(err);
      alert("Gagal memuat produk");
    });
}

/* ================== STORE RENDER (INDEX) ================== */
function renderStoreList() {
  const list = document.getElementById("product-list");
  if (!list) return;

  let html = "";
  PRODUCTS.forEach((p, i) => {
    const name = p?.name ?? "";
    const price = p?.price ?? "";
    const stock = p?.stock ?? "";

    html += `
      <div class="card">
        <div class="info">
          <h3>${escapeHTML(name)}</h3>
          <p>Harga: ${escapeHTML(price)}</p>
          <p>Stok: ${escapeHTML(stock)}</p>
        </div>
        <button onclick="buy('${escapeJS(name)}','${escapeJS(price)}')">Beli</button>
      </div>
    `;
  });

  list.innerHTML = html;
}

/* ================== ADMIN FILTER + RENDER ================== */
function getAdminFilteredView() {
  const q = (document.getElementById("adminSearch")?.value || "").toLowerCase().trim();
  const cat = (document.getElementById("adminCategory")?.value || "all");

  // view: [{p, idx}]
  let view = PRODUCTS.map((p, idx) => ({ p, idx }));

  if (cat !== "all") {
    view = view.filter(x => guessCategory(x.p?.name) === cat);
  }

  if (q) {
    view = view.filter(x => String(x.p?.name || "").toLowerCase().includes(q));
  }

  return view;
}

function renderAdminList() {
  const list = document.getElementById("product-list");
  if (!list) return;

  const view = getAdminFilteredView();

  let html = "";
  view.forEach(({ p, idx }) => {
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

  list.innerHTML = html || `<div style="text-align:center; opacity:.65; padding:12px;">Tidak ada produk di filter ini.</div>`;
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

/* ================== WA ================== */
function buy(name, price) {
  const waNumber = "6283850340631";
  const text = `Halo admin, saya mau beli:\nProduk: ${name}\nHarga: ${price}`;
  const url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text);
  window.location.href = url;
}

/* ================== LOGIN ADMIN ================== */
function login() {
  const pass = document.getElementById("adminPass")?.value || "";
  if (pass === ADMIN_KEY) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    loadProducts(true);
  } else alert("Password salah");
}

function logout() {
  location.reload();
}

/* ================== ADD / DELETE (API LAMA TETAP) ================== */
function addProduct() {
  const nameEl = document.getElementById("pname");
  const priceEl = document.getElementById("pprice");
  const stockEl = document.getElementById("pstock");
  const catEl = document.getElementById("pcat");

  const rawName = nameEl ? nameEl.value.trim() : "";
  const price = priceEl ? priceEl.value.trim() : "";
  const stock = stockEl ? stockEl.value.trim() : "";
  const cat = catEl ? catEl.value : "lain";

  if (!rawName || !price) {
    alert("Nama & harga wajib diisi");
    return;
  }

  const name = normalizeNameWithCategory(rawName, cat);

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "add",
      name: name,
      price: price,
      stock: stock
    })
  })
    .then(() => {
      if (nameEl) nameEl.value = "";
      if (priceEl) priceEl.value = "";
      if (stockEl) stockEl.value = "";
      loadProducts(true);
    })
    .catch(err => {
      console.error(err);
      alert("Gagal tambah produk");
    });
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

/* ================== HELPERS ================== */
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeJS(str) {
  return String(str).replace(/'/g, "\\'");
}
