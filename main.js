/* --- Standoff Case Simulator (исправленный main.js) --- */

/* ========== CASE DATA ============= */

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

/* ========== STORAGE ============= */

let STORE = JSON.parse(localStorage.getItem("cs2Data") || "{}");
if (!STORE.users) STORE = { users: {}, currentUser: null };

function save() {
    localStorage.setItem("cs2Data", JSON.stringify(STORE));
}

/* ========== ELEMENTS ============= */

const inpUser = document.getElementById("inUser");
const inpPass = document.getElementById("inPass");
const btnLogin = document.getElementById("btnLogin");
const btnReg = document.getElementById("btnRegister");
const btnProfile = document.getElementById("btnProfile");

const auth = document.getElementById("auth");
const game = document.getElementById("game");

const balance = document.getElementById("balance");
const inventory = document.getElementById("inventory");
const shop = document.getElementById("shop");

const caseSelect = document.getElementById("caseSelect");
const openCaseBtn = document.getElementById("openCase");

const reel = document.getElementById("reel");
const resultText = document.getElementById("resultText");

const btnAdmin = document.getElementById("btnAdmin");
const adminModal = document.getElementById("adminModal");
const adminPass = document.getElementById("adminPass");
const adminOk = document.getElementById("adminOk");
const adminCancel = document.getElementById("adminCancel");

/* ========== AUTH ============= */

function refreshUI() {
    if (STORE.currentUser) {
        auth.classList.add("hidden");
        game.classList.remove("hidden");
        updateBalance();
        renderInventory();
    } else {
        auth.classList.remove("hidden");
        game.classList.add("hidden");
    }
}

btnReg.onclick = function () {
    const u = inpUser.value.trim();
    const p = inpPass.value.trim();

    if (!u || !p) return alert("Введите имя и пароль");
    if (STORE.users[u]) return alert("Пользователь существует");

    STORE.users[u] = {
        password: p,
        coins: 500,
        inventory: []
    };

    STORE.currentUser = u;
    save();
    refreshUI();
};

btnLogin.onclick = function () {
    const u = inpUser.value.trim();
    const p = inpPass.value.trim();

    if (!STORE.users[u] || STORE.users[u].password !== p)
        return alert("Неверные данные");

    STORE.currentUser = u;
    save();
    refreshUI();
};

btnProfile.onclick = function () {
    STORE.currentUser = null;
    save();
    refreshUI();
};

/* ========== BALANCE / INVENTORY ============= */

function updateBalance() {
    if (STORE.currentUser) {
        balance.textContent = STORE.users[STORE.currentUser].coins;
    }
}

function renderInventory() {
    const u = STORE.users[STORE.currentUser];
    inventory.innerHTML = "";

    if (u.inventory.length === 0) {
        inventory.textContent = "Пусто";
        return;
    }

    u.inventory.forEach((it, i) => {
        const el = document.createElement("div");
        el.className = "invItem";
        el.innerHTML = `
            <b class="rarity-${it.rarity}">${it.name}</b>
            <button data-i="${i}">Продать</button>
        `;
        inventory.appendChild(el);
    });

    inventory.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {
            const idx = +btn.dataset.i;
            const item = u.inventory[idx];
            const price = Math.floor(getPrice(item.rarity) * 0.5);
            u.inventory.splice(idx, 1);
            u.coins += price;
            save();
            updateBalance();
            renderInventory();
        };
    });
}

function getPrice(r) {
    return { Legend: 500, Epic: 200, Rare: 100, Uncommon: 50, Common: 20 }[r];
}

/* ========== SHOP ============= */

function initShop() {
    CASES.forEach(c => {
        const el = document.createElement("div");
        el.className = "shopCard";
        el.innerHTML = `${c.name} — ${c.price}₵ <button data-id="${c.id}">Купить</button>`;
        shop.appendChild(el);
    });

    shop.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            openCase(id);
        };
    });
}

/* ========== CASE OPENING ============= */

function randomRarity(w) {
    let r = Math.random() * 100;
    for (let k in w) {
        if (r < w[k]) return k;
        r -= w[k];
    }
}

function randomItem(c) {
    const rar = randomRarity(c.rarities);
    const pool = c.items.filter(x => x.rarity === rar);
    return pool[Math.floor(Math.random() * pool.length)];
}

function openCase(id) {
    const u = STORE.users[STORE.currentUser];
    const c = CASES.find(x => x.id === id);

    if (u.coins < c.price) return alert("Недостаточно монет");

    u.coins -= c.price;
    updateBalance();

    const item = randomItem(c);

    u.inventory.push(item);
    save();
    renderInventory();

    resultText.textContent = `${item.name} (${item.rarity})`;
}

/* ========== ADMIN (HIDDEN PASSWORD) ============= */

async function sha256(msg) {
    const data = new TextEncoder().encode(msg);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)]
        .map(x => x.toString(16).padStart(2, "0"))
        .join("");
}

// hash("Mila2010lilia")
const ADMIN_HASH = "6c7db1b3035a3d41e8c25b9f6a09a1a09b29b9fdfb31cdd192d08d7569b0ce83";

btnAdmin.onclick = () => {
    adminModal.classList.remove("hidden");
    adminPass.value = "";
};

adminCancel.onclick = () => adminModal.classList.add("hidden");

adminOk.onclick = async () => {
    const hash = await sha256(adminPass.value);

    if (hash === ADMIN_HASH) {
        const u = STORE.users[STORE.currentUser];
        if (u) {
            u.coins = 999999999;
            save();
            updateBalance();
            alert("Админ: монеты добавлены");
        }
        adminModal.classList.add("hidden");
    } else {
        alert("Неверный пароль");
    }
};

/* ========== INIT ============= */

function init() {
    CASES.forEach(c => {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = `${c.name} — ${c.price}₵`;
        caseSelect.appendChild(o);
    });

    initShop();
    refreshUI();
}

init();
