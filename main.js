/* === ХРАНЕНИЕ ДАННЫХ === */
const SAVE_KEY = "my_case_simulator_save_v1";

/* Загружаем сохранение */
function loadSave() {
    try {
        return JSON.parse(localStorage.getItem(SAVE_KEY)) || {
            coins: 100,      // стартовые монеты
            inventory: [],   // список предметов
            opened: 0        // сколько кейсов открыто
        };
    } catch (e) {
        return { coins: 100, inventory: [], opened: 0 };
    }
}

/* Сохраняем данные */
function saveProgress(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

/* === ЛОГИКА КЕЙСА === */
function openCase() {
    let save = loadSave();

    if (save.coins < 10) {
        alert("Недостаточно монет!");
        return;
    }

    // списываем цену
    save.coins -= 10;

    // шанс выпадения предметов
    const items = [
        { name: "Blue Gun", rarity: "common", chance: 70 },
        { name: "Purple SMG", rarity: "rare", chance: 20 },
        { name: "Pink Rifle", rarity: "epic", chance: 8 },
        { name: "Golden Knife", rarity: "legendary", chance: 2 }
    ];

    const roll = Math.random() * 100;
    let current = 0;
    let drop;

    for (let item of items) {
        current += item.chance;
        if (roll <= current) {
            drop = item;
            break;
        }
    }

    // добавляем предмет в инвентарь
    save.inventory.push({
        name: drop.name,
        rarity: drop.rarity,
        time: Date.now()
    });

    save.opened += 1;
    saveProgress(save);

    alert("Выпало: " + drop.name + " (" + drop.rarity + ")");
}

/* === ОЧИСТКА СОХРАНЕНИЯ === */
function resetProgress() {
    localStorage.removeItem(SAVE_KEY);
    alert("Прогресс сброшен!");
}
