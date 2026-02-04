const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";
const ADMIN_KEY = "mazfa2806";

let PRODUCTS = [];

// ===== Helpers =====
function formatIDR(val) {
  const n = Number(String(val).replace(/[^\d.-]/g, "")) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeJS(str) {
  return String(str).replace(/'/g, "\\'");
}
function badgeFor(stockVal){
  const s = Number(stockVal) || 0;
  if (s <= 0) return { cls:"sold", text:"Habis" };
  if (s <= 5) return { cls:"limited", text:"Limited" };
  return { cls:"ready", text:"Ready" };
}

// ===== Load & Render =====
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
      renderProducts(isAdmin, PRODUCTS);

      // aktifkan search hanya di index (kalau elemennya ada)
      setupSearchIfAny(isAdmin);
    })
    .catch(err => {
      if (loading) loading.style.display = "none";
      console.error(err);
      alert("Gagal memuat produk");
    });
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
    const badge = badgeFor(stock);

    html += `
      <div class="card">
        <div class="info">
          <h3>${escapeHTML(name)}</h3>
          <p>Harga: ${priceText}</p>
          <p>Stok: ${escapeHTML(stock)}</p>
          ${!isAdmin ? `<div class="badge ${badge.cls}">${badge.text}</div>` : ``}
        </div>

        ${
          isAdmin
            ? `<button onclick="deleteProduct(${i})">Hapus</button>`
            : `<button onclick="buy('${escapeJS(name)}','${escapeJS(priceText)}')">Beli</button>`
        }
      </div>
    `;
  });

  list.innerHTML = html || `<div style="padding:12px;color:rgba(230,245,255,.65)">Tidak ada produk.</div>`;
}

// ===== WhatsApp =====
function buy(name, priceText) {
  const waNumber = "6283850340631";
  const text = `Halo admin, saya mau beli:\nProduk: ${name}\nHarga: ${priceText}`;
  const url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

// ===== Admin =====
function login() {
  const passEl = document.getElementById("adminPass");
  const pass = passEl ? passEl.value : "";

  if (pass === ADMIN_KEY) {
    const loginBox = document.getElementById("login-box");
    const panel = document.getElementById("admin-panel");
    if (loginBox) loginBox.style.display = "none";
    if (panel) panel.style.display = "block";
    loadProducts(true);
  } else {
    alert("Password salah");
  }
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

      // format produk
      name: name,
      price: price,
      stock: stock,

      // fallback kalau backend lama
      Produk: name,
      Harga: price,
      Stok: stock
    })
  })
    .then(() => loadProducts(true))
    .catch(err => {
      console.error(err);
      alert("Gagal tambah produk");
    });
}

function deleteProduct(i) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "delete",
      index: i
    })
  })
    .then(() => loadProducts(true))
    .catch(err => {
      console.error(err);
      alert("Gagal hapus produk");
    });
}

// ===== Search (Index only) =====
function setupSearchIfAny(isAdmin){
  if (isAdmin) return; // jangan ganggu admin

  const search = document.getElementById("search");
  const clearBtn = document.getElementById("clearSearch");
  if (!search || !clearBtn) return;

  // biar ga dobel listener kalau loadProducts dipanggil ulang
  if (search.dataset.bound === "1") return;
  search.dataset.bound = "1";

  const apply = () => {
    const q = (search.value || "").toLowerCase().trim();
    const filtered = !q
      ? PRODUCTS
      : PRODUCTS.filter(p => String(p?.name || "").toLowerCase().includes(q));
    renderProducts(false, filtered);
  };

  search.addEventListener("input", apply);
  clearBtn.addEventListener("click", () => {
    search.value = "";
    apply();
  });
      }
