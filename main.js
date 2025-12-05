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
  // fill cases
  CASES.forEach(c => {
    const o = document.createElement('option'); o.value = c.id; o.textContent = `${c.name} — ${c.price}₵`; caseSelect.appendChild(o);
  });

  // shop: simple buy single case or item
  renderShop();
  refreshAuthUI();
}

function refreshAuthUI(){
  if(STORE.currentUser){
    auth.classList.add('hidden'); game.classList.remove('hidden');
    userLabel.textContent = STORE.currentUser;
    btnProfile.textContent = 'Выйти';
    refreshBalance();
    renderInventory();
  } else {
    auth.classList.remove('hidden'); game.classList.add('hidden');
    userLabel.textContent = '';
    btnProfile.textContent = 'Профиль';
  }
}

btnProfile.addEventListener('click', ()=>{
  if(STORE.currentUser){ // logout
    STORE.currentUser = null; saveState(STORE); refreshAuthUI();
  } else {
    // focus login fields
    inUser.focus();
  }
});

btnRegister.addEventListener('click', ()=>{
  const name = inUser.value.trim(); const pass = inPass.value.trim();
  if(!name || !pass) return alert('Введите имя и пароль');
  if(STORE.users[name]) return alert('Пользователь существует');
  STORE.users[name] = { password: pass, coins: 500, inventory: [] };
  STORE.currentUser = name; saveState(STORE); ensureUser(name);
  refreshAuthUI();
});

btnLogin.addEventListener('click', ()=>{
  const name = inUser.value.trim(); const pass = inPass.value.trim();
  if(!name || !pass) return alert('Введите имя и пароль');
  if(!STORE.users[name] || STORE.users[name].password !== pass) return alert('Неверные данные');
  STORE.currentUser = name; saveState(STORE); refreshAuthUI();
});

// ---- rendering ----
function refreshBalance(){
  if(!STORE.currentUser) return balanceEl.textContent = '0';
  balanceEl.textContent = STORE.users[STORE.currentUser].coins || 0;
}

function renderInventory(){
  inventoryEl.innerHTML = '';
  if(!STORE.currentUser) return;
  const inv = STORE.users[STORE.currentUser].inventory || [];
  if(inv.length === 0) inventoryEl.textContent = 'Пусто';
  inv.forEach((it, idx) => {
    const el = document.createElement('div'); el.className='inv-item';
    el.innerHTML = `<span class="rarity-${it.rarity}">${it.name}</span><button data-idx="${idx}">Продать (50%)</button>`;
    inventoryEl.appendChild(el);
  });
  inventoryEl.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', e=>{
      const i = +e.target.dataset.idx;
      sellItem(i);
    });
  });
}

function renderShop(){
  shopEl.innerHTML = '';
  CASES.forEach(c=>{
    const el = document.createElement('div'); el.className='shop-item';
    el.innerHTML = `<div>${c.name} — ${c.price}₵</div><button data-id="${c.id}">Купить кейс</button>`;
    shopEl.appendChild(el);
  });
  shopEl.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      buyCase(id);
    });
  });
}

// ---- actions ----
function buyCase(id){
  if(!STORE.currentUser) return alert('Авторизуйтесь');
  const c = CASES.find(x=>x.id===id);
  const user = STORE.users[STORE.currentUser];
  if(user.coins < c.price) return alert('Недостаточно монет');
  user.coins -= c.price;
  // open immediately
  saveState(STORE); refreshBalance();
  openCaseByObj(c);
}

function sellItem(index){
  const user = STORE.users[STORE.currentUser];
  const it = user.inventory.splice(index,1)[0];
  const gained =  Math.max(10, Math.floor((getRarityValue(it.rarity))*0.5));
  user.coins += gained; saveState(STORE); refreshBalance(); renderInventory();
  alert(`Продано за ${gained}₵`);
}

function getRarityValue(r){
  switch(r){case 'Legend': return 500; case 'Epic': return 200; case 'Rare': return 100; case 'Uncommon': return 50; default: return 20;}
}

// ---- case logic & animation ----
function weightedPick(weights){
  const entries = Object.entries(weights);
  const total = entries.reduce((s,[,v])=>s+v,0);
  let r = Math.random()*total;
  for(const [k,w] of entries){
    if(r < w) return k;
    r -= w;
  }
  return entries[0][0];
}

function pickItemFromCase(c){
  const rarity = weightedPick(c.rarities);
  const pool = c.items.filter(i => i.rarity === rarity);
  if(pool.length === 0) return c.items[Math.floor(Math.random()*c.items.length)];
  return pool[Math.floor(Math.random()*pool.length)];
}

function openCaseByObj(c){
  if(!STORE.currentUser) return alert('Авторизуйтесь');
  if(isSpinning) return;
  isSpinning = true;
  openCase.disabled = true;

  // prepare reel cards
  reel.innerHTML = '';
  const buffer = 8;
  const finalItem = pickItemFromCase(c);
  const cards = [];
  for(let i=0;i<buffer;i++){
    const item = c.items[Math.floor(Math.random()*c.items.length)];
    cards.push(item);
  }
  // place multiple cycles and final center
  const cycles = 6;
  for(let t=0;t<cycles;t++){
    c.items.forEach(it=>cards.push(it));
  }
  // push final item plus small tail
  cards.push(finalItem);
  for(let i=0;i<6;i++) cards.push(c.items[Math.floor(Math.random()*c.items.length)]);

  cards.forEach(it=>{
    const node = document.createElement('div'); node.className='card';
    node.innerHTML = `<div style="font-weight:700">${it.name}</div><div class="rarity">${it.rarity}</div>`;
    reel.appendChild(node);
  });

  // compute translate to center final card (center index)
  // each card width approximate 180 + gap 12
  const cardW = 180 + 12;
  const centerIndex = Math.floor(reel.children.length/2);
  // find index of finalItem occurrence near middle
  let targetIdx = Array.from(reel.children).findIndex((n,i)=> i>cycles && n.textContent.includes(finalItem.name));
  if(targetIdx < 0) targetIdx = Math.floor(reel.children.length/2);

  const offset = (targetIdx - centerIndex) * cardW;

  // animate
  requestAnimationFrame(()=> {
    reel.style.transition = 'transform 2.6s cubic-bezier(.22,.95,.12,1)';
    reel.style.transform = `translateX(-${offset}px)`;
  });

  setTimeout(()=> {
    // finish
    isSpinning = false; openCase.disabled = false;
    // add to inventory and update
    const user = STORE.users[STORE.currentUser];
    user.inventory.push(finalItem);
    saveState(STORE);
    refreshBalance(); renderInventory();
    resultText.textContent = `${finalItem.name} (${finalItem.rarity})`;
    // small highlight
    alert(`Поздравляем! Вы получили: ${finalItem.name} (${finalItem.rarity})`);
    // reset reel transform smooth fade
    setTimeout(()=>{ reel.style.transition='none'; reel.style.transform='none'; }, 100);
  }, 2700);
}

// admin
btnAdmin.addEventListener('click', ()=>{ adminModal.classList.remove('hidden'); adminPass.value=''; adminPass.focus();});
adminCancel.addEventListener('click', ()=>adminModal.classList.add('hidden'));
adminOk.addEventListener('click', ()=>{
  if(adminPass.value === 'Mila2010lilia'){
    adminModal.classList.add('hidden');
    // give unlimited coins (for demo we'll set to big number)
    const u = STORE.users[STORE.currentUser];
    if(u){ u.coins = 999999999; saveState(STORE); refreshBalance(); alert('Админ: монеты обновлены'); }
  } else alert('Неверный пароль');
});

// openCase button hookup (also buy in shop)
openCase.addEventListener('click', ()=>{
  // open currently selected without charge (or charge if needed)
  const id = caseSelect.value;
  const c = CASES.find(x=>x.id===id);
  const user = STORE.users[STORE.currentUser];
  if(user.coins < c.price) return alert('Недостаточно монет');
  user.coins -= c.price; saveState(STORE); refreshBalance();
  openCaseByObj(c);
});

// init
initUI();
