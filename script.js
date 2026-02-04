const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";
const ADMIN_KEY = "mazfa2806";

// Load produk untuk index/admin
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

      let html = "";
      data.forEach((p, i) => {
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
            ${
              isAdmin
                ? `<button onclick="deleteProduct(${i})">Hapus</button>`
                : `<button onclick="buy('${escapeJS(name)}','${escapeJS(price)}')">Beli</button>`
            }
          </div>
        `;
      });

      if (list) list.innerHTML = html;
    })
    .catch(err => {
      if (loading) loading.style.display = "none";
      console.error(err);
      alert("Gagal memuat produk");
    });
}

// WhatsApp
function buy(name, price) {
  const waNumber = "6283850340631";
  const text = `Halo admin, saya mau beli:\nProduk: ${name}\nHarga: ${price}`;
  const url = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

// Admin login
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

function logout() {
  location.reload();
}

// Add product (kompatibel dengan backend lama)
function addProduct() {
  const nameEl = document.getElementById("pname");
  const priceEl = document.getElementById("pprice");
  const stockEl = document.getElementById("pstock");

  const name = nameEl ? nameEl.value.trim() : "";
  const price = priceEl ? priceEl.value.trim() : "";
  const stock = stockEl ? stockEl.value.trim() : "";

  if (!name || !price) {
    alert("Nama & harga wajib diisi");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    // JANGAN pakai headers biar tetap seperti versi lama (menghindari CORS)
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "add",

      // format baru
      name: name,
      price: price,
      stock: stock,

      // format lama (kalau backend kamu pakai ini)
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

// Delete product (kompatibel dengan backend lama)
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

// Utils keamanan kecil
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeJS(str) {
  return String(str).replace(/'/g, "\\'");
                    }
