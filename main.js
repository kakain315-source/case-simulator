/* === Standoff2 Case Simulator — clean version (no admin) === */

/* ---- Data ---- */
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

const $ = id => document.getElementById(id);

function saveState() {
    localStorage.setItem("caseSimState", JSON.stringify(STORE));
}

function loadState() {
    try {
        return JSON.parse(localStorage.getItem("caseSimState")) || DEFAULT_STATE;
    } catch {
        return DEFAULT_STATE;
    }
}

let STORE = loadState();

/* ---- Auth UI ---- */
const auth = $('auth'), game = $('game'), inUser = $('inUser'), inPass = $('inPass');
const btnRegister = $('btnRegister'), btnLogin = $('btnLogin'), btnProfile = $('btnProfile');
const userLabel = $('userLabel');

/* ---- Game UI ---- */
const caseSelect = $('caseSelect'), balanceEl = $('balance');
const openCaseBtn = $('openCase'), reel = $('reel');
const inventoryEl = $('inventory'), shopEl = $('shop');

/* ---- Helpers ---- */
function refreshAuthUI() {
    if (STORE.currentUser) {
        auth.classList.add("hidden");
        game.classList.remove("hidden");
        userLabel.textContent = STORE.currentUser;
        refreshBalance();
        renderInventory();
    } else {
        auth.classList.remove("hidden");
        game.classList.add("hidden");
    }
}

btnProfile.addEventListener("click", () => {
    STORE.currentUser = null;
    saveState();
    refreshAuthUI();
});

btnRegister.addEventListener("click", async () => {
    const name = inUser.value.trim();
    const pass = inPass.value.trim();
    if (!name || !pass) return alert("Введите данные");
    if (STORE.users[name]) return alert("Пользователь уже есть");

    STORE.users[name] = {
        password: pass,
        coins: 500,
        inventory: []
    };
    STORE.currentUser = name;
    saveState();
    refreshAuthUI();
});

btnLogin.addEventListener("click", async () => {
    const name = inUser.value.trim();
    const pass = inPass.value.trim();
    if (!name || !pass) return alert("Введите данные");
    if (!STORE.users[name] || STORE.users[name].password !== pass)
        return alert("Неверные данные");

    STORE.currentUser = name;
    saveState();
    refreshAuthUI();
});

function refreshBalance() {
    const user = STORE.users[STORE.currentUser];
    balanceEl.textContent = user ? user.coins : 0;
}

function renderInventory() {
    const user = STORE.users[STORE.currentUser];
    inventoryEl.innerHTML = "";

    if (!user.inventory.length) {
        inventoryEl.textContent = "Пусто";
        return;
    }

    user.inventory.forEach((it, i) => {
        const d = document.createElement("div");
        d.className = "inv-item";
        d.innerHTML = `<span class="rarity-${it.rarity}">${it.name}</span>`;
        inventoryEl.appendChild(d);
    });
}

/* ---- Shop ---- */
function renderShop() {
    shopEl.innerHTML = "";

    CASES.forEach(c => {
        const el = document.createElement("div");
        el.className = "inv-item";
        el.innerHTML = `
            <div>${c.name} — ${c.price}₵</div>
            <button data-id="${c.id}">Купить</button>
        `;
        shopEl.appendChild(el);
    });

    shopEl.querySelectorAll("button").forEach(btn => {
        btn.onclick = () => buyCase(btn.dataset.id);
    });
}

function buyCase(id) {
    const user = STORE.users[STORE.currentUser];
    const c = CASES.find(x => x.id === id);
    if (user.coins < c.price) return alert("Недостаточно монет");

    user.coins -= c.price;
    saveState();
    refreshBalance();
    
    openCase(c);
}

/* ---- Case opening ---- */
function weightedPick(weights) {
    let total = 0;
    for (const w of Object.values(weights)) total += w;

    let r = Math.random() * total;
    for (const [rar, w] of Object.entries(weights)) {
        if (r < w) return rar;
        r -= w;
    }
}

function pickItem(c) {
    const rar = weightedPick(c.rarities);
    const pool = c.items.filter(i => i.rarity === rar);
    return pool[Math.floor(Math.random() * pool.length)];
}

let isSpinning = false;

function openCase(c) {
    if (isSpinning) return;
    isSpinning = true;
    openCaseBtn.disabled = true;

    const final = pickItem(c);

    const user = STORE.users[STORE.currentUser];
    user.inventory.push(final);
    saveState();
    renderInventory();
    refreshBalance();

    alert(`Вы получили: ${final.name} (${final.rarity})`);

    setTimeout(() => {
        isSpinning = false;
        openCaseBtn.disabled = false;
    }, 500);
}

openCaseBtn.onclick = () => {
    const id = caseSelect.value;
    const c = CASES.find(x => x.id === id);
    const user = STORE.users[STORE.currentUser];

    if (user.coins < c.price) return alert("Недостаточно монет");
    user.coins -= c.price;
    saveState();
    refreshBalance();

    openCase(c);
};

/* INIT */
(function init() {
    CASES.forEach(c => {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = `${c.name} — ${c.price}₵`;
        caseSelect.appendChild(o);
    });

    renderShop();
    refreshAuthUI();
})();
