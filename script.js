const API_URL = "https://script.google.com/macros/s/AKfycbwHxg_ir21pRQKVXi6q66yaSPx_Smii8UtRUPo4NS-zkUyiBByOwNuy0453herHp3bZxw/exec";
const ADMIN_KEY = "mazfa2806";
const WA_NUMBER = "6283850340631";

let PRODUCTS = [];
let ACTIVE_CAT = "all";

/* ===================== SAFE DOM ===================== */
const $ = (id) => document.getElementById(id);

/* ===================== HELPERS ===================== */
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
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function escapeJS(str) {
  return String(str).replace(/'/g, "\\'");
}
function badgeFor(stockVal) {
  const s = toNumber(stockVal);
  if (s <= 0) return { cls: "sold", text: "Habis" };
  if (s <= 5) return { cls: "limited", text: "Limited" };
  return { cls: "ready", text: "Ready" };
}

/* ===================== CATEGORY (NO SHEET CHANGE) ===================== */
function guessCategory(name) {
  const n = String(name || "").toLowerCase();

  // Diamond FF
  if (n.includes("[ff]") || n.includes("free fire") || n.includes("diamond ff") || n.includes("dm ff")) return "ff";

  // Panel Pterodactyl
  if (n.includes("[panel]") || n.includes("pterodactyl") || n.includes("ptero") || n.startsWith("panel")) return "panel";

  // APK Premium
  if (n.includes("[apk]") || n.includes("apk premium") || n.includes("apk") || n.includes("premium") || n.includes("pro") || n.includes("mod")) return "apk";

  return "lain";
}

function normalizeNameWithCategory(rawName, cat) {
  const n = String(rawName || "").trim();
  const low = n.toLowerCase();

  if (cat === "ff") {
    if (!low.includes("[ff]") && !low.includes("free fire") && !low.includes("diamond ff") && !low.includes("dm ff")) return `[FF] ${n}`;
    return n;
  }
  if (cat === "panel") {
    if (!low.includes("[panel]") && !low.includes("ptero") && !low.includes("pterodactyl") && !low.startsWith("panel")) return `[PANEL] ${n}`;
    return n;
  }
  if (cat === "apk") {
    if (!low.includes("[apk]") && !low.includes("apk")) return `[APK] ${n}`;
    if (!low.includes("premium") && !low.includes("pro")) return `${n} Premium`;
    return n;
  }
  return n;
}
/* ===================== API LOAD ===================== */
function loadProducts(isAdmin) {
  const loading = $("loading");
  const list = $("product-list");

  if (loading) loading.style.display = "block";
  if (list) list.innerHTML = "";

  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      if (loading) loading.style.display = "none";

      if (!Array.isArray(data)) {
        console.log("API response:", data);
        alert("Data server tidak sesuai format.");
        return;
      }

      PRODUCTS = data;

      if (isAdmin) {
        bindAdminOnce();
        renderAdmin();
      } else {
        bindStoreOnce();
        buildStoreTabs();
        renderStore();
      }
    })
    .catch(err => {
      if (loading) loading.style.display = "none";
      console.error(err);
      alert("Gagal memuat produk (cek console).");
    });
}

/* ===================== STORE ===================== */
function applyStoreFilters(items) {
  const q = ($("search")?.value || "").toLowerCase().trim();
  const sort = ($("sort")?.value || "default");

  let out = items.slice();

  // category
  if (ACTIVE_CAT !== "all") out = out.filter(p => guessCategory(p?.name) === ACTIVE_CAT);

  // search
  if (q) out = out.filter(p => String(p?.name || "").toLowerCase().includes(q));

  // sort
  if (sort === "low") out.sort((a,b) => toNumber(a?.price) - toNumber(b?.price));
  if (sort === "high") out.sort((a,b) => toNumber(b?.price) - toNumber(a?.price));
  if (sort === "az") out.sort((a,b) => String(a?.name||"").localeCompare(String(b?.name||"")));

  return out;
}

function renderStore() {
  const list = $("product-list");
  if (!list) return;

  const filtered = applyStoreFilters(PRODUCTS);

  const count = $("count");
  if (count) count.textContent = `Menampilkan ${filtered.length} produk`;

  let html = "";
  filtered.forEach((p) => {
    const name = p?.name ?? "";
    const priceText = formatIDR(p?.price ?? "");
    const stock = p?.stock ?? "";
    const b = badgeFor(stock);

    html += `
      <div class="pCardX">
        <div class="pInfoX">
          <h3>${escapeHTML(name)}</h3>
          <p>Harga: ${escapeHTML(priceText)}</p>
          <p>Stok: ${escapeHTML(stock)}</p>
          <div class="badgeX ${b.cls}">${b.text}</div>
        </div>
        <button class="pBtnX" onclick="buy('${escapeJS(name)}','${escapeJS(priceText)}')">Beli</button>
      </div>
    `;
  });

  list.innerHTML = html || `<div class="loadingX">Tidak ada produk.</div>`;
}

function buildStoreTabs() {
  const wrap = $("catChips");
  if (!wrap) return;

  const tabs = [
    ["all", "All"],
    ["ff", "Diamond FF"],
    ["panel", "Panel Ptero"],
    ["apk", "APK Premium"],
    ["lain", "Lainnya"],
  ];

  wrap.innerHTML = tabs.map(([v, label]) => `
    <button class="tabX ${v===ACTIVE_CAT?'active':''}" type="button" data-cat="${v}">${label}</button>
  `).join("");

  wrap.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      ACTIVE_CAT = btn.dataset.cat || "all";
      buildStoreTabs();
      renderStore();
    });
  });
}

function bindStoreOnce() {
  const search = $("search");
  const clear = $("clearSearch");
  const sort = $("sort");

  // defensif: kalau elemen gak ada, diam
  if (!search || !clear || !sort) return;

  if (search.dataset.bound === "1") return;
  search.dataset.bound = "1";

  const apply = () => renderStore();

  search.addEventListener("input", apply);
  sort.addEventListener("change", apply);
  clear.addEventListener("click", () => { search.value = ""; apply(); });
}

/* ===================== BUY (WA) ===================== */
function buy(name, priceText) {
  const text = `Halo admin, saya mau beli:\nProduk: ${name}\nHarga: ${priceText}`;
  const url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
  window.location.href = url;
          }

/* ===================== ADMIN ===================== */
function login() {
  const pass = $("adminPass")?.value || "";
  if (pass === ADMIN_KEY) {
    if ($("login-box")) $("login-box").style.display = "none";
    if ($("admin-panel")) $("admin-panel").style.display = "block";
    loadProducts(true);
  } else {
    alert("Password salah");
  }
}

function logout() { location.reload(); }

function addProduct() {
  const rawName = $("pname")?.value?.trim() || "";
  const price = $("pprice")?.value?.trim() || "";
  const stock = $("pstock")?.value?.trim() || "";
  const cat = $("pcat")?.value || "lain";

  if (!rawName || !price) return alert("Nama & harga wajib diisi");

  const name = normalizeNameWithCategory(rawName, cat);

  const payload = {
    key: ADMIN_KEY,
    action: "add",

    // format baru (kalau backend kamu pakai ini)
    name: name,
    price: price,
    stock: stock,

    // format lama (banyak Apps Script pakai ini)
    Produk: name,
    Harga: price,
    Stok: stock,
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      const txt = await res.text();
      console.log("ADD response:", res.status, txt);

      if (!res.ok) throw new Error("HTTP " + res.status);

      // reset input
      if ($("pname")) $("pname").value = "";
      if ($("pprice")) $("pprice").value = "";
      if ($("pstock")) $("pstock").value = "";

      loadProducts(true);
    })
    .catch((err) => {
      console.error("ADD ERROR:", err);
      alert("Gagal tambah produk. Cek console (F12).");
    });
}

function deleteProduct(realIndex) {
  const payload = {
    key: ADMIN_KEY,
    action: "delete",

    // format baru
    index: realIndex,

    // format lama (jaga-jaga)
    Index: realIndex,
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      const txt = await res.text();
      console.log("DELETE response:", res.status, txt);

      if (!res.ok) throw new Error("HTTP " + res.status);

      loadProducts(true);
    })
    .catch((err) => {
      console.error("DELETE ERROR:", err);
      alert("Gagal hapus produk. Cek console (F12).");
    });
                                   }

// admin view (filter + search) -> delete pakai idx asli
function adminView() {
  const q = ($("adminSearch")?.value || "").toLowerCase().trim();
  const cat = ($("adminCategory")?.value || "all");

  let view = PRODUCTS.map((p, idx) => ({ p, idx }));

  if (cat !== "all") view = view.filter(x => guessCategory(x.p?.name) === cat);
  if (q) view = view.filter(x => String(x.p?.name || "").toLowerCase().includes(q));

  return view;
}

function renderAdmin() {
  const list = $("product-list");
  if (!list) return;

  const view = adminView();

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
      <div class="pCardX">
        <div class="pInfoX">
          <h3>${escapeHTML(name)}</h3>
          <p>Harga: ${escapeHTML(price)}</p>
          <p>Stok: ${escapeHTML(stock)}</p>
          <p style="margin-top:6px; opacity:.75; font-size:12px;">Kategori: ${catLabel}</p>
        </div>
        <button class="pBtnX" onclick="deleteProduct(${idx})">Hapus</button>
      </div>
    `;
  });

  list.innerHTML = html || `<div class="loadingX">Tidak ada produk di filter ini.</div>`;
}

function bindAdminOnce() {
  const s = $("adminSearch");
  const c = $("adminCategory");

  if (!s || !c) return;
  if (s.dataset.bound === "1") return;
  s.dataset.bound = "1";

  const apply = () => renderAdmin();
  s.addEventListener("input", apply);
  c.addEventListener("change", apply);
}

function adminResetFilter() {
  if ($("adminSearch")) $("adminSearch").value = "";
  if ($("adminCategory")) $("adminCategory").value = "all";
  renderAdmin();
}
/* ===== TOGGLE HAMBURGER MENU ===== */

function toggleMenu(){
  const menu = document.getElementById("navMenu");
  if(!menu) return;

  menu.classList.toggle("show");
}

/* Tutup menu kalau klik luar */
document.addEventListener("click", function(e){
  const menu = document.getElementById("navMenu");
  const btn = document.querySelector(".menu-btn");

  if(!menu || !btn) return;

  if(!menu.contains(e.target) && !btn.contains(e.target)){
    menu.classList.remove("show");
  }
});
