async function loadHeader() {
  const res = await fetch("/shared/header.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("afterbegin", html);
}

async function loadFooter() {
  const res = await fetch("/shared/footer.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);
}

async function init() {
  const body = document.body;
  const main = document.createElement("main");

  Array.from(body.children).forEach(el => {
    if (el.tagName !== "HEADER" && el.tagName !== "FOOTER") {
      main.appendChild(el);
    }
  });

  body.appendChild(main);

  
  await loadHeader();
  await loadFooter();

  document.querySelectorAll(".footer-div .ex button").forEach(btn => {
    const url = btn.dataset.url;
    const domain = new URL(url).hostname;

    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    btn.querySelector("img").src = favicon;

    btn.onclick = () => {
      window.location.href = url;
    };
  });
}

init();



async function postCode(code, id) {
  try {
    console.log("Sending request...");

    const res = await fetch("https://api.933152270.xyz/api/verify-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code,
        id
      })
    });

    console.log("Status:", res.status);

    const text = await res.text();
    console.log("RAW RESPONSE:");
    console.log(text);

    // Try parse safely
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.log("Invalid JSON from server");
      alert("Server error");
      return;
    }

    // Handle HTTP errors properly
    if (!res.ok) {
      console.log("Request failed:", json);
      alert(json?.error || "Request failed");
      return;
    }

    console.log("PARSED JSON:", json);

    if (json.valid) {
      alert(json.popup || "Success!");
    } else {
      alert("Invalid Code");
    }

  } catch (err) {
    console.error("Request failed:");
    console.error(err);
    alert("Network error");
  }
}

async function submitCode() {
  const code = document.getElementById("codeInput").value;
  console.log("Entered code:", code);

  postCode(code, 1);
}

function goBackLevel() {
  let path = window.location.pathname;

  // remove trailing slash (except root)
  if (path !== "/" && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  const parent = path.substring(0, path.lastIndexOf("/")) || "/";

  window.location.href = parent;
}