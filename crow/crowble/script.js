fetch("crowble.txt")
    .then(response => response.text())
    .then(text => {
        document.getElementById("crowble").innerHTML = text;
    })
    .catch(error => {
        console.error("Failed to load crowble.txt:", error);
    });