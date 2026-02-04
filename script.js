// ================= CONFIG =================
const API_URL =
  "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";

const ADMIN_KEY = "mazfa2806";

const WA_NUMBER = "6283850340631";

// ================= STATE =================
let PRODUCTS = [];

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Auto load untuk halaman utama
  if (document.getElementById("product-list")) {
    loadProducts(false);
  }
});

// ================= LOAD =================
async function loadProducts(isAdmin = false) {
  const loading = document.getElementById("loading");
  const list = document.getElementById("product-list");

  if (!list) return;

  loading && (loading.style.display = "block");
  list.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}?action=list`);
    const json = await res.json();

    if (!Array.isArray(json)) {
      throw new Error("Format data salah");
    }

    PRODUCTS = json;

    renderProducts(isAdmin);

    loading && (loading.style.display = "none");
  } catch (err) {
    console.error(err);

    loading && (loading.style.display = "none");

    list.innerHTML = `
      <div style="padding:15px;color:red">
        Gagal memuat produk.
      </div>
    `;
  }
}

// ================= RENDER =================
function renderProducts(isAdmin) {
  const list = document.getElementById("product-list");
  let html = "";

  PRODUCTS.forEach((p, i) => {
    html += `
      <div class="card">

        <div class="info">
          <h3>${escapeHTML(p.name)}</h3>
          <p>Harga: ${formatRupiah(p.price)}</p>
          <p>Stok: ${p.stock}</p>
        </div>

        ${
          isAdmin
            ? `<button class="btn-delete" onclick="deleteProduct(${i})">Hapus</button>`
            : `<button class="btn-buy" onclick="buy('${escapeJS(
                p.name
              )}',${p.price})">Beli</button>`
        }

      </div>
    `;
  });

  list.innerHTML = html;
}

// ================= BUY =================
function buy(name, price) {
  const text = `
Halo admin, saya mau beli:

Produk: ${name}
Harga: ${formatRupiah(price)}
  `.trim();

  const url =
    "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);

  window.open(url, "_blank");
}

// ================= ADMIN =================
function login() {
  const pass = document.getElementById("adminPass");

  if (!pass) return;

  if (pass.value === ADMIN_KEY) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";

    loadProducts(true);
  } else {
    alert("Password salah!");
  }
}

function logout() {
  location.reload();
}

async function addProduct() {
  const nameEl = document.getElementById("pname");   // input
  const priceEl = document.getElementById("pprice"); // input
  const stockEl = document.getElementById("pstock"); // input

  if (!nameEl || !priceEl || !stockEl) {
    alert("Input admin (pname/pprice/pstock) tidak ditemukan.");
    return;
  }

  const name = nameEl.value.trim();
  const price = priceEl.value.trim();
  const stock = stockEl.value.trim();

  if (!name || !price) {
    alert("Nama & harga wajib diisi");
    return;
  }

  try {
    const body = new URLSearchParams({
      action: "add",
      key: ADMIN_KEY,

      // field PRODUK (yang nanti kebaca jadi p.name/p.price/p.stock)
      name: name,
      price: price,
      stock: stock
    });

    const res = await fetch(API_URL, { method: "POST", body });
    const txt = await res.text();
    console.log("ADD response:", txt);

    nameEl.value = "";
    priceEl.value = "";
    stockEl.value = "";

    loadProducts(true);
  } catch (err) {
    console.error(err);
    alert("Gagal tambah produk (cek Console)");
  }
}

async function deleteProduct(i) {
  if (!confirm("Yakin hapus produk ini?")) return;

  try {
    const body = new URLSearchParams({
      action: "delete",
      key: ADMIN_KEY,
      index: String(i)
    });

    const res = await fetch(API_URL, { method: "POST", body });
    const txt = await res.text();
    console.log("DELETE response:", txt);

    loadProducts(true);
  } catch (err) {
    console.error(err);
    alert("Gagal hapus produk (cek Console)");
  }
  }

// ================= UTILS =================
function formatRupiah(num) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num || 0);
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[m]));
}

function escapeJS(str) {
  return String(str).replace(/'/g, "\\'");
}
