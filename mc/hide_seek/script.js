const MapList = document.getElementById("MapList");

const maps = [
    "Backroom's Level 0",
    "Backroom's Level 1",
    "Backroom's Level 2",

    "Desert Temple",
    "Jungle Temple",

    "Desert Village",
    "Taiga Village",

    "Takopi's Home",
    
    "Deep State",
    "Dock",
    "The Sand Pyramid",
    "Pale Oak Forest",
    "Ring Castle",
    "The Sanian Maze",
    "Trial Chamber",

    "Pillager Training Grounds",
    "Pillager Hotel",
    "Men Ding's Mansion",
    "Mansion Of The Storm",
];

maps.forEach(map => {
    const formattedName = map
        .replace(/'/g, "")
        .replace(/\s+/g, "_");

    const item = document.createElement("div");
    item.className = "item";

    item.onclick = () => {
        window.location.href = `/mc/hide_seek/${formattedName}`;
    };

    const img = document.createElement("img");
    img.src = `/mc/hide_seek/${formattedName}/favicon.png`;

    img.onerror = () => {
        img.src = "https://placehold.co/128";
    };

    const text = document.createElement("a");
    const strong = document.createElement("strong");
    strong.textContent = map;
    text.appendChild(strong);

    item.appendChild(img);
    item.appendChild(text);

    MapList.appendChild(item);
});