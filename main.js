const app = document.getElementById('app');

app.innerHTML = `
    <h1>Case Simulator</h1>
    <button id="openCase">Open Case</button>
    <div id="result"></div>
`;

const items = [
    { name: "Common Item", chance: 60 },
    { name: "Uncommon Item", chance: 25 },
    { name: "Rare Item", chance: 10 },
    { name: "Epic Item", chance: 4 },
    { name: "Legendary Item", chance: 1 }
];

document.getElementById("openCase").addEventListener("click", () => {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let result = "Nothing";

    for (const item of items) {
        cumulative += item.chance;
        if (roll < cumulative) {
            result = item.name;
            break;
        }
    }

    document.getElementById("result").innerHTML = `
        <h2>You got: <span style="color:yellow">${result}</span></h2>
    `;
});
