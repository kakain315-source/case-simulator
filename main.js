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

/* SHA-256 (for password hashing) */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return [...new
