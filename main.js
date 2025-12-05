/* main.js — Standoff2-style case simulator (offline PWA) */

// ---- simple data model ----
const CASES = [
  { id:'rival', name:'Rival Case', price:100, rarities:{Common:60,Uncommon:25,Rare:10,Epic:4,Legend:1},
    items:[
      {name:'Knife Rust', rarity:'Legend'},
      {name:'Rifle Storm', rarity:'Epic'},
      {name:'SMG Urban', rarity:'Rare'},
      {name:'Pistol Sand', rarity:'Uncommon'},
      {name:'Ammo Pack', rarity:'Common'}
    ]},
  { id:'origin', name:'Origin Case', price:80, rarities:{Common:62,Uncommon:23,Rare:10,Epic:4,Legend:1},
    items:[
      {name:'Shotgun Maple', rarity:'Rare'},
      {name:'Rifle Bronze', rarity:'Uncommon'},
      {name:'Pistol Classic', rarity:'Common'},
      {name:'AWP Ember', rarity:'Legend'},
      {name:'SMG Neon', rarity:'Epic'}
    ]}
];

// STORE
const DEFAULT_STATE = { users: {}, currentUser: null };
const $ = id => document.getElementById(id);

function saveState(s){ localStorage.setItem("caseSimState", JSON.stringify(s)); }
function loadState(){ return JSON.parse(localStorage.getItem("caseSimState")||"{}") || DEFAULT_STATE; }
let STORE = loadState();

// UI elements
const auth=$("auth"), game=$("game"), inUser=$("inUser"), inPass=$("inPass");
const btnRegister=$("btnRegister"), btnLogin=$("btnLogin"), userLabel=$("userLabel"), btnProfile=$("btnProfile");
const caseSelect=$("caseSelect"), openCase=$("openCase"), reel=$("reel"), resultText=$("resultText");
const inventoryEl=$("inventory"), shopEl=$("shop"), balanceEl=$("balance"), btnAdmin=$("btnAdmin");
const adminModal=$("adminModal"), adminOk=$("adminOk"), adminCancel=$("adminCancel"), adminPass=$("adminPass");

// ---- helpers ----
function ensureUser(name){
  if(!STORE.users[name]){
    STORE.users[name]={password:"",coins:500,inventory:[]};
    saveState(STORE);
  }
}

function refreshAuthUI(){
  if(STORE.currentUser){
    auth.classList.add("hidden");
    game.classList.remove("hidden");
    userLabel.textContent = STORE.currentUser;
    btnProfile.textContent = "Выйти";
    refreshBalance();
    renderInventory();
  } else {
    auth.classList.remove("hidden");
    game.classList.add("hidden");
    userLabel.textContent = "";
    btnProfile.textContent = "Профиль";
  }
}

btnProfile.addEventListener("click", ()=>{
  if(STORE.currentUser){
    STORE.currentUser=null;
    saveState(STORE);
    refreshAuthUI();
  }
});

// Registration
btnRegister.addEventListener("click",()=>{
  const name=inUser.value.trim(), pass=inPass.value.trim();
  if(!name||!pass) return alert("Введите имя и пароль");
  if(STORE.users[name]) return alert("Пользователь существует");

  STORE.users[name]={password:pass, coins:500, inventory:[]};
  STORE.currentUser=name; saveState(STORE); refreshAuthUI();
});

// Login
btnLogin.addEventListener("click",()=>{
  const name=inUser.value.trim(), pass=inPass.value.trim();
  if(!STORE.users[name] || STORE.users[name].password!==pass)
    return alert("Неверные данные");

  STORE.currentUser=name; saveState(STORE); refreshAuthUI();
});

// ---- inventory & shop ----
function refreshBalance(){
  if(!STORE.currentUser) return balanceEl.textContent="0";
  balanceEl.textContent=STORE.users[STORE.currentUser].coins;
}

function renderInventory(){
  inventoryEl.innerHTML="";
  const inv=STORE.users[STORE.currentUser].inventory;
  if(inv.length===0){ inventoryEl.textContent="Пусто"; return; }

  inv.forEach((it,i)=>{
    const el=document.createElement("div");
    el.className="inv-item";
    el.innerHTML=`<span class="rarity-${it.rarity}">${it.name}</span> <button data-i="${i}">Продать</button>`;
    inventoryEl.appendChild(el);
  });

  inventoryEl.querySelectorAll("button").forEach(b=>{
    b.onclick=()=>{
      const i=+b.dataset.i;
      const user=STORE.users[STORE.currentUser];
      const item=user.inventory.splice(i,1)[0];
      const value=Math.floor(getRarityValue(item.rarity)*0.5);
      user.coins+=value;
      saveState(STORE);
      refreshBalance();
      renderInventory();
    };
  });
}

function getRarityValue(r){
  return {Legend:500, Epic:200, Rare:100, Uncommon:50, Common:20}[r]||20;
}

function renderShop(){
  shopEl.innerHTML="";
  CASES.forEach(c=>{
    const el=document.createElement("div");
    el.className="shop-item";
    el.innerHTML=`<div>${c.name} — ${c.price}₵</div><button data-id="${c.id}">Купить</button>`;
    shopEl.appendChild(el);
  });

  shopEl.querySelectorAll("button").forEach(b=>{
    b.onclick=()=>{
      const id=b.dataset.id;
      buyCase(id);
    };
  });
}

function buyCase(id){
  const user=STORE.users[STORE.currentUser];
  const c=CASES.find(x=>x.id===id);
  if(user.coins<c.price) return alert("Недостаточно монет");
  user.coins-=c.price;
  saveState(STORE); refreshBalance();
  openCaseByObj(c);
}

// ---- case opening ----
let isSpinning=false;

function weightedPick(weights){
  const entries=Object.entries(weights);
  let total=entries.reduce((s,[,w])=>s+w,0);
  let r=Math.random()*total;

  for(const [rar,w] of entries){
    if(r<w) return rar;
    r-=w;
  }
  return entries[0][0];
}

function pickItemFromCase(c){
  const rar=weightedPick(c.rarities);
  const pool=c.items.filter(i=>i.rarity===rar);
  return pool[Math.floor(Math.random()*pool.length)];
}

function openCaseByObj(c){
  if(isSpinning) return;
  isSpinning=true;
  openCase.disabled=true;

  const finalItem=pickItemFromCase(c);

  reel.innerHTML="";
  const cards=[];
  for(let i=0;i<15;i++){
    cards.push(c.items[Math.floor(Math.random()*c.items.length)]);
  }
  cards.push(finalItem);

  cards.forEach(it=>{
    const node=document.createElement("div");
    node.className="card";
    node.innerHTML=`<div>${it.name}</div><div>${it.rarity}</div>`;
    reel.appendChild(node);
  });

  // animation
  const cardW=180+12;
  const targetIndex=cards.length-1;
  const offset=targetIndex*cardW;

  requestAnimationFrame(()=>{
    reel.style.transition="transform 2.5s cubic-bezier(.22,.95,.12,1)";
    reel.style.transform=`translateX(-${offset}px)`;
  });

  setTimeout(()=>{
    const user=STORE.users[STORE.currentUser];
    user.inventory.push(finalItem);
    saveState(STORE);
    refreshBalance();
    renderInventory();
    resultText.textContent=finalItem.name+" ("+finalItem.rarity+")";
    isSpinning=false;
    openCase.disabled=false;

    setTimeout(()=>{
      reel.style.transition="none";
      reel.style.transform="translateX(0)";
    },100);
  },2600);
}

// ---- SECURE ADMIN PANEL (with SHA-256 hash) ----
const ADMIN_HASH="3acbb1f4f0d31af2762b4e653743e00607a0dc10be48edf2eb76b888c7e3492e";

async function sha256(msg){
  const enc=new TextEncoder().encode(msg);
  const buf=await crypto.subtle.digest("SHA-256",enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

btnAdmin.addEventListener("click",()=>{
  adminModal.classList.remove("hidden");
  adminPass.value="";
  adminPass.focus();
});

adminCancel.addEventListener("click",()=>{
  adminModal.classList.add("hidden");
});

adminOk.addEventListener("click", async ()=>{
  const input=adminPass.value.trim();
  const hash=await sha256(input);

  if(hash===ADMIN_HASH){
    adminModal.classList.add("hidden");
    const user=STORE.users[STORE.currentUser];
    if(user){
      user.coins=999999999;
      saveState(STORE);
      refreshBalance();
      alert("Админ режим активирован!");
    }
  } else {
    alert("Неверный пароль");
  }
});

// ---- INIT ----
function init(){
  CASES.forEach(c=>{
    const o=document.createElement("option");
    o.value=c.id; o.textContent=c.name+" — "+c.price+"₵";
    caseSelect.appendChild(o);
  });
  renderShop();
  refreshAuthUI();
}
init();
