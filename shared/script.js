async function loadFooter() {
  const res = await fetch("/shared/footer.html");
  const html = await res.text();
  document.body.insertAdjacentHTML("beforeend", html);
}

async function init() {
  await loadFooter();

  document.querySelectorAll(".footer-link-btn").forEach(btn => {
    const url = btn.dataset.url;
    const domain = new URL(url).hostname;

    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    btn.querySelector(".footer-link-icon").src = favicon;

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