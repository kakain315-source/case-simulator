/* ===== standoff2 case simulator — main.js ===== */

/* ---------- Data ---------- */
const CASES = [
  {
    id: "rival",
    name: "Rival Case",
    price: 100,
    rarities: { Common: 60, Uncommon: 25, Rare: 10, Epic: 4, Legend: 1 },
    items: [
      { name: "Knife Rust", rarity: "Legend" },
      { name: "Rifle Storm", rarity: "Epic" },
      { name: "SMG Urban", rarity: "Rare" },
      { name: "Pistol Sand", rarity: "Uncommon" },
      { name: "Ammo Pack", rarity: "Common" }
    ]
  },
  {
    id: "origin",
    name: "Origin Case",
    price: 80,
    rarities: { Common: 62, Uncommon: 23, Rare: 10, Epic: 4, Legend: 1 },
    items: [
      { name: "Shotgun Maple", rarity: "Rare" },
      { name: "Rifle Bronze", rarity: "Uncommon" },
      { name: "Pistol Classic", rarity: "Common" },
      { name: "AWP Ember", rarity: "Legend" },
      { name: "SMG Neon", rarity: "Epic" }
    ]
  }
];

const DEFAULT_STATE = {
  users: {},
  currentUser: null
};

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);

function saveState() {
  localStorage.setItem("caseSimState", JSON.stringify(STORE));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem("caseSimState")) || DEFAULT_STATE;
  } catch (e) {
    return DEFAULT_STATE;
  }
}

let STORE = loadState();

/* SHA-256 (HEX) */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ---------- ADMIN PASSWORD HASH ---------- */
/*  
  ЗАМЕНИ значение на SHA-256 хеш твоего пароля.
  Пример: const ADMIN_HASH = "a34f9bc...";

  Чтобы получить хеш: 
      1) открой консоль браузера
      2) введи: await crypto.subtle.digest("SHA-256", new TextEncoder().encode("ТВОЙ_ПАРОЛЬ"))
*/
const ADMIN_HASH = "REPLACE_WITH_SHA256_HEX";

/* ---------- UI ---------- */
const auth = $("auth");
const game = $("game");
const inUser = $("inUser");
const inPass = $("inPass");
const btnRegister = $("btnRegister");
const btnLogin = $("btnLogin");
const btnProfile = $("btnProfile");
const userLabel = $("userLabel");
const balanceEl = $("balance");
const inventoryEl = $("inventory");
const shopEl = $("shop");
const caseSelect = $("caseSelect");
const openCase = $("openCase");
const reel = $("reel");
const btnAdmin = $("btnAdmin");

const adminModal = $("adminModal");
const adminPass = $("adminPass");
const adminOk = $("adminOk");
const adminCancel = $("adminCancel");

/* ---------- Auth UI ---------- */
function refreshAuthUI() {
  if (STORE.currentUser) {
    auth.classList.add("hidden");
    game.classList.remove("hidden");
    userLabel.textContent = STORE.currentUser;
    btnProfile.textContent = "Выйти";
    refreshBalance();
    renderInventory();
  } else {
    auth.classList.remove("hidden");
    game.classList.add("hidden");
    btnProfile.textContent = "Профиль";
    userLabel.textContent = "";
  }
}

/* ---------- Register ---------- */
btnRegister.addEventListener("click", async () => {
  const name = inUser.value.trim();
  const pass = inPass.value.trim();
  if (!name || !pass) return alert("Введите имя и пароль");
  if (STORE.users[name]) return alert("Пользователь существует");

  STORE.users[name] = {
    passwordHash: await sha256Hex(pass),
    coins: 500,
    inventory: []
  };

  STORE.currentUser = name;
  saveState();
  refreshAuthUI();
});

/* ---------- Login ---------- */
btnLogin.addEventListener("click", async () => {
  const name = inUser.value.trim();
  const pass = inPass.value.trim();
  if (!name || !pass) return alert("Введите имя и пароль");

  const user = STORE.users[name];
  if (!user) return alert("Пользователь не найден");

  const hash = await sha256Hex(pass);

  if (user.passwordHash !== hash) return alert("Неверный пароль");

  STORE.currentUser = name;
  saveState();
  refreshAuthUI();
});

/* ---------- Profile button ---------- */
btnProfile.addEventListener("click", () => {
  if (STORE.currentUser) {
    STORE.currentUser = null;
    saveState();
    refreshAuthUI();
  } else {
    inUser.focus();
  }
});

/* ---------- Shop ---------- */
function renderShop() {
  shopEl.innerHTML = "";

  CASES.forEach(c => {
    const div = document.createElement("div");
    div.style.margin = "6px 0";
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>${c.name} — ${c.price}₵</div>
        <button data-id="${c.id}" class="primary">Купить</button>
      </div>
    `;
    shopEl.appendChild(div);
  });

  shopEl.querySelectorAll("button").forEach(btn =>
    btn.addEventListener("click", e => {
      buyCase(e.target.dataset.id);
    })
  );
}

function buyCase(id) {
  if (!STORE.currentUser) return alert("Авторизуйтесь");

  const c = CASES.find(x => x.id === id);
  const user = STORE.users[STORE.currentUser];

  if (user.coins < c.price) return alert("Недостаточно монет");

  user.coins -= c.price;
  saveState();
  refreshBalance();

  openCaseByObj(c);
}

/* ---------- Balance ---------- */
function refreshBalance() {
  if (!STORE.currentUser) return;
  balanceEl.textContent = STORE.users[STORE.currentUser].coins;
}

/* ---------- Inventory ---------- */
function renderInventory() {
  const user = STORE.users[STORE.currentUser];
  const inv = user.inventory;

  inventoryEl.innerHTML = "";

  if (inv.length === 0) {
    inventoryEl.textContent = "Пусто";
    return;
  }

  inv.forEach((it, i) => {
    const row = document.createElement("div");
    row.className = "inv-item";
    row.innerHTML = `
      <span class="rarity-${it.rarity}">${it.name}</span>
      <button data-i="${i}" class="ghost">Продать</button>
    `;
    inventoryEl.appendChild(row);
  });

  inventoryEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", e => {
      sellItem(parseInt(e.target.dataset.i));
    });
  });
}

function sellItem(i) {
  const user = STORE.users[STORE.currentUser];
  const it = user.inventory[i];

  const prices = {
    Legend: 500,
    Epic: 200,
    Rare: 100,
    Uncommon: 50,
    Common: 20
  };

  const get = Math.floor(prices[it.rarity] * 0.5);

  user.inventory.splice(i, 1);
  user.coins += get;

  saveState();
  refreshBalance();
  renderInventory();
  alert("Продано за " + get + "₵");
}

/* ---------- Admin ---------- */
btnAdmin.addEventListener("click", () => {
  adminModal.classList.remove("hidden");
  adminPass.value = "";
  adminPass.focus();
});

adminCancel.addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

adminOk.addEventListener("click", async () => {
  const pass = adminPass.value.trim();
  const hash = await sha256Hex(pass);

  if (ADMIN_HASH === "REPLACE_WITH_SHA256_HEX") {
    return alert("Задай ADMIN_HASH в main.js!");
  }

  if (hash !== ADMIN_HASH) return alert("Неверный пароль");

  if (!STORE.currentUser) return alert("Сначала войдите в аккаунт");

  STORE.users[STORE.currentUser].coins = 999999999;
  saveState();
  refreshBalance();

  adminModal.classList.add("hidden");
  alert("Админ: coins = 999999999");
});

/* ---------- Case Opening ---------- */
let isSpinning = false;

function weightedPick(weights) {
  let total = 0;
  for (const k in weights) total += weights[k];

  let r = Math.random() * total;
  for (const k in weights) {
    if (r < weights[k]) return k;
    r -= weights[k];
  }
  return "Common";
}

function pickItemFromCase(c) {
  const r = weightedPick(c.rarities);
  const pool = c.items.filter(i => i.rarity === r);
  return pool[Math.floor(Math.random() * pool.length)];
}

function openCaseByObj(c) {
  if (isSpinning) return;

  isSpinning = true;
  openCase.disabled = true;

  reel.innerHTML = "";

  const final = pickItemFromCase(c);
  const cards = [];

  for (let i = 0; i < 20; i++)
    cards.push(c.items[Math.floor(Math.random() * c.items.length)]);

  cards.push(final);

  cards.forEach(it => {
    const el = document.createElement("div");
    el.className = "card-inner";
    el.innerHTML = `
      <div style="font-weight:700">${it.name}</div>
      <div class="rarity-${it.rarity}">${it.rarity}</div>
    `;
    reel.appendChild(el);
  });

  const cardW = 180 + 12;
  const finalIndex = cards.length - 1;
  const centerIndex = Math.floor(cards.length / 2);
  const offset = (finalIndex - centerIndex) * cardW;

  requestAnimationFrame(() => {
    reel.style.transition = "transform 2.3s cubic-bezier(.22,.95,.12,1)";
    reel.style.transform = `translateX(-${offset}px)`;
  });

  setTimeout(() => {
    const user = STORE.users[STORE.currentUser];
    user.inventory.push(final);
    saveState();
    renderInventory();
    refreshBalance();

    alert(`Поздравляем! Вы получили: ${final.name} (${final.rarity})`);

    reel.style.transition = "none";
    reel.style.transform = "none";

    isSpinning = false;
    openCase.disabled = false;
  }, 2500);
}

/* ---------- Open button ---------- */
openCase.addEventListener("click", () => {
  const id = caseSelect.value;
  const c = CASES.find(x => x.id === id);

  const user = STORE.users[STORE.currentUser];

  if (user.coins < c.price) return alert("Недостаточно монет");

  user.coins -= c.price;
  saveState();
  refreshBalance();

  openCaseByObj(c);
});

/* ---------- INIT ---------- */
function init() {
  CASES.forEach(c => {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = `${c.name} — ${c.price}₵`;
    caseSelect.appendChild(o);
  });

  renderShop();
  refreshAuthUI();
}

init();
