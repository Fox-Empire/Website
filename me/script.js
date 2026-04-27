const STEAM_ID = "76561199473562472"
const Vercel = "https://api.933152270.xyz/api"

document.querySelectorAll(".link-btn").forEach(btn => {
    const url = btn.dataset.url;
    const domain = new URL(url).hostname;

    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    btn.querySelector(".link-icon").src = favicon;

    btn.onclick = () => {
        window.location.href = url;
    };
});

function setSteamIcon(button) {
  const appid = button.dataset.appid;
  const img = button.querySelector('.steam-icon');

  if (!appid || !img) return;

  const sources = [
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_header.jpg`
  ];

  let i = 0;

  function tryNext() {
    if (i >= sources.length) return;
    img.src = sources[i++];
  }

  img.onerror = tryNext;

  // start loading first image
  tryNext();

  button.onclick = () => {
    window.location.href = `https://store.steampowered.com/app/${appid}`;
  };
}

document.querySelectorAll('.steam-btn').forEach(setSteamIcon);

function formattedTimeUnix(unixTime) {
  if (!unixTime) return [0,0,0];

  const now = Date.now() / 1000;
  let diffSeconds = Math.max(0, now - unixTime);

  const days = Math.floor(diffSeconds / 86400);
  diffSeconds %= 86400;

  const hours = Math.floor(diffSeconds / 3600);
  diffSeconds %= 3600;

  const minutes = Math.floor(diffSeconds / 60);

  return [days, hours, minutes];
}

function formattedTime(minutes) {
  if (!minutes) return [0, 0, 0];

  const hoursTotal = Math.floor(minutes / 60);

  const days = Math.floor(hoursTotal / 24);
  const hours = hoursTotal % 24;
  const mins = minutes % 60;

  return [days, hours, mins];
}

async function GetSteamLibrary(id) {
    try {
        var link = ""
        if (id) {
            link = `${Vercel}/steam-library?steamid=${id}&include_free=1`
        } else {
            link = `${Vercel}/steam-library?steamid=${STEAM_ID}&include_free=1`
        };
        console.log(link);
        const res = await fetch(link);
        const data = await res.json();
        console.log(data);
        return data;
    } catch (err) {
        console.error("Error fetching Steam library:", err);
    }
}
async function GetSteamWishlist(id) {
    try {
        var link = ""
        if (id) {
            link = `${Vercel}/steam-wishlist?steamid=${id}`
        } else {
            link = `${Vercel}/steam-wishlist?steamid=${STEAM_ID}`
        };
        console.log(link);
        const res = await fetch(link);
        const data = await res.json();
        console.log(data);
        return data;
    } catch (err) {
        console.error("Error fetching Steam wishlist:", err);
    }
}

function getSteamIcon(appid, iconHash) {
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`;
}

function FormatGames(Library) {
    var lib = [];

    Library.games.forEach(game => {

        var lp = formattedTimeUnix(game.rtime_last_played);

        if (lp[0] == 0) {lp = "Never Played"} else {lp = `${lp[0]} Days, ${lp[1]} Hours, ${lp[2]} Minutes Ago`};

        const name = game.name ?? "Unknown";
        var pt_windows = formattedTime(game.playtime_windows_forever);
        var pt_mac = formattedTime(game.playtime_mac_forever);
        var pt_linux = formattedTime(game.playtime_linux_forever);
        var pt_deck = formattedTime(game.playtime_deck_forever);
        var pt_afk = formattedTime(game.playtime_disconnected);
        var pt_total = formattedTime(game.playtime_forever);
        var pt_total_afk = formattedTime(game.playtime_forever + game.playtime_disconnected);

        
        if (pt_windows[0] == 0 && pt_windows[1] == 0 && pt_windows[2] == 0) {pt_windows = "-"} else {pt_windows = `${pt_windows[0]} Days, ${pt_windows[1]} Hours, ${pt_windows[2]} Minutes`};
        if (pt_mac[0] == 0 && pt_mac[1] == 0 && pt_mac[2] == 0) {pt_mac = "-"} else {pt_mac = `${pt_mac[0]} Days, ${pt_mac[1]} Hours, ${pt_mac[2]} Minutes`};
        if (pt_linux[0] == 0 && pt_linux[1] == 0 && pt_linux[2] == 0) {pt_linux = "-"} else {pt_linux = `${pt_linux[0]} Days, ${pt_linux[1]} Hours, ${pt_linux[2]} Minutes`};
        if (pt_deck[0] == 0 && pt_deck[1] == 0 && pt_deck[2] == 0) {pt_deck = "-"} else {pt_deck = `${pt_deck[0]} Days, ${pt_deck[1]} Hours, ${pt_deck[2]} Minutes`};
        if (pt_afk[0] == 0 && pt_afk[1] == 0 && pt_afk[2] == 0) {pt_afk = "-"} else {pt_afk = `${pt_afk[0]} Days, ${pt_afk[1]} Hours, ${pt_afk[2]} Minutes`};
        if (pt_total[0] == 0 && pt_total[1] == 0 && pt_total[2] == 0) {pt_total = "-"} else {pt_total = `${pt_total[0]} Days, ${pt_total[1]} Hours, ${pt_total[2]} Minutes`};
        if (pt_total_afk[0] == 0 && pt_total_afk[1] == 0 && pt_total_afk[2] == 0) {pt_total_afk = "-"} else {pt_total_afk = `${pt_total_afk[0]} Days, ${pt_total_afk[1]} Hours, ${pt_total_afk[2]} Minutes`};

        const lpf = lp;
        const icon = getSteamIcon(game.appid, game.img_icon_url) ?? "https://placehold.co/128";
        const link = `https://store.steampowered.com/app/${game.appid}`;

        var newGame = {
            name: name,
            pt: {
                total: pt_total,
                total_afk: pt_total_afk,
                afk: pt_afk,
                windows: pt_windows,
                mac: pt_mac,
                linux: pt_linux,
                deck: pt_deck
            },
            lp: lpf,
            icon: icon,
            link: link
        };
        lib.push(newGame);
    });

    lib.sort((a, b) => a.name.localeCompare(b.name));
    return lib;
}

const library = document.getElementById("steam-library");
const template = document.getElementById("steam-item");

(async () => {
    const res = await GetSteamLibrary();
    const games = FormatGames(res.response);

    games.forEach(game => {
        const newItem = template.cloneNode(true);
        newItem.removeAttribute("id");
        newItem.querySelector(".steam-item-icon").src = game.icon;
        newItem.querySelector(".steam-item-name").textContent = game.name;
        newItem.querySelector(".steam-item-pt").innerHTML = `
            <div class="hover-wrapper">
                <span class="hover-text">Playtime:<br>${game.pt.total}</span>
                <div class="tooltip" style="outline: 2px solid #1b2838; font-size:70%;">
                    Total Time: ${game.pt.total_afk}<br>
                    Time AFK: ${game.pt.afk}<br><br>
                    Windows: ${game.pt.windows}<br>
                    Mac: ${game.pt.mac}<br>
                    Linux: ${game.pt.linux}<br>
                    Handheld: ${game.pt.deck}
                </div>
            </div>
        `;
        newItem.querySelector(".steam-item-lp").innerHTML = `Last Played:</br>${game.lp}`;

        newItem.onclick = () => {
            window.location.href = `${game.link}`;
        };

        library.appendChild(newItem);
    })

    template.remove();
})();

const games = [
    {
        "name": "Minecraft",
        "link": "https://minecraft.net"
    },
    {
        "name": "Hytale",
        "link": "https://hytale.com"
    },
    {
        "name": "osu!",
        "link": "https://osu.ppy.sh"
    },
    {
        "name": "Fast As Duck",
        "link": "https://aalexdoesstuff.itch.io/fast-as-duck"
    },
    {
        "name": "Karlson",
        "link": "https://danidev.itch.io/karlson"
    },
]

const otherLibrary = document.getElementById("other-games");
const otherTemplate = document.getElementById("other-item");

games.forEach(game => {
        const newItem = otherTemplate.cloneNode(true);
        newItem.removeAttribute("id");
        newItem.querySelector(".other-item-icon").src = `https://www.google.com/s2/favicons?domain=${game.link}&sz=64`;
        newItem.querySelector(".other-item-name").textContent = game.name;

        newItem.onclick = () => {
            window.location.href = `${game.link}`;
        };
        otherLibrary.appendChild(newItem);
});

otherTemplate.remove();

(async () => {
    const res = await GetSteamWishlist();
    console.log(res);
})();