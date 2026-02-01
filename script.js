const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";
const ADMIN_KEY = "mazfa2806";

function loadProducts(isAdmin) {
  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      const list = document.getElementById("product-list");
      list.innerHTML = "";
      data.forEach((p, i) => {
        list.innerHTML += `
        <div class="card">
          <h3>${p.name}</h3>
          <p>Harga: ${p.price}</p>
          <p>Stok: ${p.stock}</p>
          ${isAdmin
            ? `<button onclick="deleteProduct(${i})">Hapus</button>`
            : `<button onclick="buy('${p.name}',${p.price})">Beli</button>`
          }
        </div>`;
      });
    });
}

function buy(name, price) {
  const msg = `Halo admin, saya mau beli ${name} harga ${price}`;
  window.open(`https://wa.me/62XXXXXXXXXX?text=${encodeURIComponent(msg)}`);
}

function login() {
  const pass = document.getElementById("adminPass").value;
  if (pass === ADMIN_KEY) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    loadProducts(true);
  } else alert("Password salah");
}

function logout() {
  location.reload();
}

function addProduct() {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      key: ADMIN_KEY,
      action: "add",
      Produk: pname.value,
      Harga: pprice.value,
      Stok: pstock.value
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
