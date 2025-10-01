(async function updateNavbar() {
  const res = await fetch("/session");
  if (res.ok) {
    const data = await res.json();

    const userGreeting = document.getElementById("user-greeting");
    userGreeting.innerText = `Hello ${data.username}!`

    if (data.isAdmin) {
      const adminLink = document.getElementById("admin-link");
      adminLink.style.display = "inline";
    }
  }
})();

// Global variable for session
let ship = {};

// Fetch all telemetry
async function loadShipTelemetry() {
  try {
    const res = await fetch("/ship/telemetry", {
      method: "GET",
      credentials: "include"
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error("Failed to load telemetry");
    }

    ship = data;

    Object.entries(ship).forEach(([part, info]) => {
      updateCard(part, info);
    });
  } catch (err) {
    console.error("Telemetry load failed:", err);
  }
}

// Update one card
function updateCard(part, { level, condition, repairPrice, upgradePrice }) {
  const card = document.querySelector(`.overlay.${part}`);

  updateCardLevel(card, level);
  updateCardCondition(card, condition, level);
  updateCardPrices(card, part, repairPrice, upgradePrice);
  wireCardButtons(card, part);
}

// Update helpers
function updateCardLevel(card, level) {
  card.classList.remove("v1", "v2", "v3");
  card.classList.add(`v${level}`);
}

function updateCardCondition(card, condition, level) {
  const stats = card.querySelector("h3");
  stats.textContent = `V${level}  ${condition}%`;

  const repairBtn  = card.querySelector(".repair-btn");
  const upgradeBtn = card.querySelector(".upgrade-btn");
  if (level === 3 || condition !== 100) {
    upgradeBtn.style.display = "none";
  }
  if (level !== 3 && condition === 100) {
    repairBtn.style.display = "none";
    upgradeBtn.style.display = "inline";
  }
  if (level === 3 && condition === 100) {
    upgradeBtn.style.display = "none";
    repairBtn.style.display = "inline";
    repairBtn.style.opacity = "0.7";
  }
}

function updateCardPrices(card, part, repairPrice, upgradePrice) {
  const repairBtn = card.querySelector(".repair-btn");
  const upgradeBtn = card.querySelector(".upgrade-btn");

  if (ship[part].level === 3 && ship[part].condition === 100) {
    repairBtn.innerHTML = `Repair`;
  } else {
    repairBtn.innerHTML = `Repair<br>${repairPrice}⚛`;
  }
  upgradeBtn.innerHTML = `Upgrade<br>${upgradePrice}⚛`;
}

function wireCardButtons(card, part) {
  const repairBtn = card.querySelector(".repair-btn");
  const upgradeBtn = card.querySelector(".upgrade-btn");

  repairBtn.onclick = () => handleRepair(part);
  upgradeBtn.onclick = () => handleUpgrade(part);
}

// Repair
async function handleRepair(part) {
  if (confirm(`Upgrade ${part} for ${ship[part].repairPrice}⚛?`)) {
    try {
      const res = await fetch("/ship/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part })
      });
      if (res.ok) {
        const updatedPart = await res.json();
        ship[part] = updatedPart;
        updateCard(part, updatedPart); // only refresh this card
      } else {
        alert("Repair failed");
      }
    } catch (err) {
      console.error("Repair error:", err);
    }
  }
}

// Upgrade
async function handleUpgrade(part) {
  if (confirm(`Upgrade ${part} for ${ship[part].upgradePrice}⚛?`)) {
    try {
      const res = await fetch("/ship/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ part })
      });
      if (res.ok) {
        const updatedPart = await res.json();
        ship[part] = updatedPart;
        updateCard(part, updatedPart); // only refresh this card
      } else {
        const msg = await res.text();
        alert(msg);
      }
    } catch (err) {
      console.error("Upgrade error:", err);
    }
  }
}

// Boot
loadShipTelemetry();