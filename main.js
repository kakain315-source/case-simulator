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

const DEFAULT_STATE = {
  users: {},
  currentUser: null
};

// ---- helpers ----
const $ = id => document.getElementById(id);

function saveState(state){
  localStorage.setItem('caseSimState', JSON.stringify(state));
}
function loadState(){
  try{
    return JSON.parse(localStorage.getItem('caseSimState')) || DEFAULT_STATE;
  }catch(e){ return DEFAULT_STATE; }
}

let STORE = loadState();

// ensure current user exists
function ensureUser(name){
  if(!STORE.users[name]) {
    STORE.users[name] = { coins: 500, inventory: [] };
    saveState(STORE);
  }
}

// ---- UI refs ----
const auth = $('auth'), game = $('game'), inUser = $('inUser'), inPass = $('inPass');
const btnRegister = $('btnRegister'), btnLogin = $('btnLogin'), userLabel = $('userLabel'), btnProfile = $('btnProfile');
const caseSelect = $('caseSelect'), openCase = $('openCase'), reel = $('reel'), resultText = $('resultText');
const inventoryEl = $('inventory'), shopEl = $('shop'), balanceEl = $('balance'), btnAdmin = $('btnAdmin');
const adminModal = $('adminModal'), adminOk = $('adminOk'), adminCancel = $('adminCancel'), adminPass = $('adminPass');

// ---- init ----
function initUI(){
  CASES.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = `${c.name} — ${c.price}₵`;
    caseSelect.appendChild(o);
  });

  renderShop();
  refreshAuthUI();
}

// ---- auth ----
function refreshAuthUI(){
  if(STORE.currentUser){
    auth.classList.add('hidden');
    game.classList.remove('hidden');
    userLabel.textContent = STORE.currentUser;
    btnProfile.textContent = 'Выйти';
    refreshBalance();
    renderInventory();
  } else {
    auth.classList.remove('hidden');
    game.classList.add('hidden');
    userLabel.textContent = '';
    btnProfile.textContent = 'Профиль';
  }
}

btnProfile.addEventListener('click', ()=>{
  if(STORE.currentUser){
    STORE.currentUser = null;
    saveState(STORE);
    refreshAuthUI();
  } else inUser.focus();
});

btnRegister.addEventListener('click', ()=>{
  const name=inUser.value.trim(), pass=inPass.value.trim();
  if(!name||!pass) return alert('Введите имя и пароль');
  if(STORE.users[name]) return alert('Пользователь существует');

  STORE.users[name] = { password: pass, coins:500, inventory:[] };
  STORE.currentUser = name;
  saveState(STORE);
  ensureUser(name);
  refreshAuthUI();
});

btnLogin.addEventListener('click', ()=>{
  const name=inUser.value.trim(), pass=inPass.value.trim();
  if(!name||!pass) return alert('Введите имя и пароль');
  if(!STORE.users[name] || STORE.users[name].password !== pass)
    return alert('Неверные данные');

  STORE.currentUser = name;
  saveState(STORE);
  refreshAuthUI();
});

// ---- balance & inventory ----
function refreshBalance(){
  if(!STORE.currentUser) return balanceEl.textContent='0';
  balanceEl.textContent = STORE.users[STORE.currentUser].coins || 0;
}

function renderInventory(){
  inventoryEl.innerHTML='';
  const inv=(STORE.users[STORE.currentUser].inventory)||[];
  if(inv.length===0) inventoryEl.textContent='Пусто';

  inv.forEach((it,idx)=>{
    const el=document.createElement('div');
    el.className='inv-item';
    el.innerHTML=`<span class="rarity-${it.rarity}">${it.name}</span><button data-idx="${idx}">Продать (50%)</button>`;
    inventoryEl.appendChild(el);
  });

  inventoryEl.querySelectorAll('button').forEach(b=>{
    b.onclick=()=>{
      const i=+b.dataset.idx;
      sellItem(i);
    };
  });
}

function renderShop(){
  shopEl.innerHTML='';
  CASES.forEach(c=>{
    const el=document.createElement('div');
    el.className='shop-item';
    el.innerHTML=`<div>${c.name} — ${c.price}₵</div><button data-id="${c.id}">Купить кейс</button>`;
    shopEl.appendChild(el);
  });

  shopEl.querySelectorAll('button').forEach(b=>{
    b.onclick=()=>{
      buyCase(b.dataset.id);
    };
  });
}

// ---- buy/sell ----
function buyCase(id){
  const c=CASES.find(x=>x.id===id);
  const u=STORE.users[STORE.currentUser];
  if(u.coins < c.price) return alert('Недостаточно монет');
  u.coins -= c.price;
  saveState(STORE);
  refreshBalance();
  openCaseByObj(c);
}

function sellItem(i){
  const u=STORE.users[STORE.currentUser];
  const it=u.inventory.splice(i,1)[0];
  const gained=Math.floor(getRarityValue(it.rarity)*0.5);
  u.coins+=gained;
  saveState(STORE);
  refreshBalance();
  renderInventory();
  alert(`Продано за ${gained}₵`);
}

function getRarityValue(r){
  return {Legend:500, Epic:200, Rare:100, Uncommon:50, Common:20}[r]||20;
}

// ---- case opening ----
let isSpinning=false;

function weightedPick(weights){
  const entries=Object.entries(weights);
  let total=entries.reduce((s,[,v])=>s+v,0);
  let r=Math.random()*total;
  for(const [k,w] of entries){
    if(r<w) return k;
    r-=w;
  }
  return entries[0][0];
}

function pickItemFromCase(c){
  const rarity=weightedPick(c.rarities);
  const pool=c.items.filter(i=>i.rarity===rarity);
  return pool[Math.floor(Math.random()*pool.length)];
}

function openCaseByObj(c){
  if(isSpinning) return;
  isSpinning=true;
  openCase.disabled=true;

  const finalItem=pickItemFromCase(c);
  reel.innerHTML='';

  const cards=[];
  for(let i=0;i<15;i++){
    cards.push(c.items[Math.floor(Math.random()*c.items.length)]);
  }
  cards.push(finalItem);

  cards.forEach(it=>{
    const n=document.createElement('div');
    n.className='card';
    n.innerHTML=`<div>${it.name}</div><div>${it.rarity}</div>`;
    reel.appendChild(n);
  });

  const cardW=192;
  const targetIdx=cards.length-1;
  const offset=targetIdx*cardW;

  requestAnimationFrame(()=>{
    reel.style.transition='transform 2.5s cubic-bezier(.22,.95,.12,1)';
    reel.style.transform=`translateX(-${offset}px)`;
  });

  setTimeout(()=>{
    const u=STORE.users[STORE.currentUser];
    u.inventory.push(finalItem);
    saveState(STORE);
    refreshBalance();
    renderInventory();
    resultText.textContent=`${finalItem.name} (${finalItem.rarity})`;

    isSpinning=false;
    openCase.disabled=false;

    setTimeout(()=>{
      reel.style.transition='none';
      reel.style.transform='translateX(0)';
    },100);
  },2600);
}

// ---- ADMIN PANEL (hidden password) ----

// SHA-256 function
async function sha256(msg){
  const data=new TextEncoder().encode(msg);
  const hashBuffer=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b=>b.toString(16).padStart(2,"0")).join("");
}

// hash("Mila2010lilia")
const ADMIN_HASH="6c7db1b3035a3d41e8c25b9f6a09a1a09b29b9fdfb31cdd192d08d7569b0ce83";

btnAdmin.addEventListener('click',()=>{
  adminModal.classList.remove('hidden');
  adminPass.value='';
  adminPass.focus();
});

adminCancel.addEventListener('click',()=>adminModal.classList.add('hidden'));

adminOk.addEventListener('click', async ()=>{
  const hash = await sha256(adminPass.value);
  if(hash === ADMIN_HASH){
    adminModal.classList.add('hidden');
    const u=STORE.users[STORE.currentUser];
    if(u){
      u.coins = 999999999;
      saveState(STORE);
      refreshBalance();
      alert('Админ: монеты обновлены');
    }
  } else {
    alert('Неверный пароль');
  }
});

// ---- open by button ----
openCase.addEventListener('click',()=>{
  const id=caseSelect.value;
  const c=CASES.find(x=>x.id===id);
  const u=STORE.users[STORE.currentUser];
  if(u.coins<c.price) return alert('Недостаточно монет');
  u.coins-=c.price;
  saveState(STORE);
  refreshBalance();
  openCaseByObj(c);
});

initUI();
