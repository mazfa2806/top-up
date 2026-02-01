const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/execI";
const ADMIN_PASSWORD = "mazfa2806";

/* =====================
   LOAD PRODUK
===================== */
function loadProducts(isAdmin = false) {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("product-list");
      list.innerHTML = "";

      if (!data || data.length === 0) {
        list.innerHTML = "<p>Tidak ada produk</p>";
        return;
      }

      data.forEach((p, i) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <h3>${p.name}</h3>
          <p>Harga: ${p.price}</p>
          <p>Stok: ${p.stock}</p>

          ${isAdmin ? `
            <button onclick="deleteProduct(${i})" class="btn-delete">
              Hapus
            </button>
          ` : `
            <button onclick="buyProduct('${p.name}', ${p.price})">
              Beli
            </button>
          `}
        `;

        list.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      alert("Gagal memuat produk");
    });
}

/* =====================
   LOGIN ADMIN
===================== */
function loginAdmin() {
  const pw = document.getElementById("password").value;

  if (pw === ADMIN_PASSWORD) {
    localStorage.setItem("admin", "true");
    window.location.href = "admin.html";
  } else {
    alert("Password salah");
  }
}

function checkAdmin() {
  if (localStorage.getItem("admin") !== "true") {
    window.location.href = "login.html";
  }
}

/* =====================
   TAMBAH PRODUK
===================== */
function addProduct() {
  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;
  const stock = document.getElementById("stock").value;

  if (!name || !price || !stock) {
    alert("Lengkapi semua data");
    return;
  }

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "add",
      name,
      price,
      stock
    })
  })
    .then(() => {
      loadProducts(true);
      alert("Produk ditambahkan");
    });
}

/* =====================
   HAPUS PRODUK
===================== */
function deleteProduct(index) {
  if (!confirm("Hapus produk ini?")) return;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      index
    })
  })
    .then(() => {
      loadProducts(true);
    });
}

/* =====================
   BELI VIA WHATSAPP
===================== */
function buyProduct(name, price) {
  const text = `Halo admin, saya mau beli:
Produk: ${name}
Harga: ${price}`;

  const wa = "628XXXXXXXXX"; // ganti nomor kamu
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`);
}

/* =====================
   LOGOUT
===================== */
function logout() {
  localStorage.removeItem("admin");
  window.location.href = "index.html";
  }
