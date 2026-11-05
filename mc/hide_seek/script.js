function addMaps(id, table) {
    const MapList = document.getElementById(id);
    table.forEach(map => {
        console.log(map)
        const formattedName = map["Name"]
            .replace(/'/g, "")
            .replace(/\s+/g, "_")
            .replace(/[\[\]]/g, "")
            .toLowerCase();

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
        strong.textContent = map["Name"];

        text.appendChild(strong);
        item.appendChild(img);
        item.appendChild(text);

        MapList.appendChild(item);
    });
}

fetch('./maps.json')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        addMaps("MapList", data["Maps"]);
        addMaps("PlannedMapList", data["Planned"]);
    })
    .catch(error => console.error('Error loading maps.json:', error));