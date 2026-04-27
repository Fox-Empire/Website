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