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
  const nameEl = document.getElementById("pname");
  const priceEl = document.getElementById("pprice");
  const stockEl = document.getElementById("pstock");

  if (!nameEl || !priceEl || !stockEl) return alert("Form admin tidak lengkap");

  const name = nameEl.value.trim();
  const price = Number(priceEl.value || 0);
  const stock = Number(stockEl.value || 0);

  if (!name || !price) return alert("Nama & harga wajib diisi");

  try {
    const url = `${API_URL}?action=add&key=${encodeURIComponent(ADMIN_KEY)}`;

    // Body dikirim TANPA headers biar ga kena preflight CORS
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        // kirim variasi nama field biar kompatibel dengan script apa pun
        name, price, stock,
        Produk: name,
        Harga: price,
        Stok: stock
      }),
    });

    const txt = await res.text();
    console.log("ADD response:", txt);

    nameEl.value = "";
    priceEl.value = "";
    stockEl.value = "";

    loadProducts(true);
  } catch (e) {
    console.error("ADD error:", e);
    alert("Gagal tambah produk (lihat Console)");
  }
}

async function deleteProduct(i) {
  if (!confirm("Hapus produk ini?")) return;

  try {
    const url = `${API_URL}?action=delete&key=${encodeURIComponent(ADMIN_KEY)}`;

    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        index: i
      }),
    });

    const txt = await res.text();
    console.log("DELETE response:", txt);

    loadProducts(true);
  } catch (e) {
    console.error("DELETE error:", e);
    alert("Gagal hapus produk (lihat Console)");
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
