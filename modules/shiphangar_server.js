import express from "express";
import { checkAuth } from "./checkAuth.js";
import { ships, repairPart, firstDock, upgradePart, payWithCredits } from "../persist_module.js";

const router = express.Router();

// ---- Hardcoded definitions for all parts ----
const PART_DEFS = {
  hull: { decayRate: 0.95, baseCost: 500 },
  weapons: { decayRate: 0.98, baseCost: 300 },
  cloaking: { decayRate: 0.99, baseCost: 700 },
  landing: { decayRate: 0.94, baseCost: 200 },
  engine: { decayRate: 0.97, baseCost: 500 }
};

// ---- Telemetry route ----
router.get("/ship/telemetry", checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const DAY = 1000 * 60 * 60 * 24; //ms * s * m * h
    const today = new Date(todayDate());

    if (ships[username]) {
      const ship = ships[username];
      const shipWithStats = {};

      Object.entries(ship).forEach(([part, def]) => {
        const { decayRate, baseCost } = PART_DEFS[part];

        const lastVisit = new Date(def.repaired);
        const daysBetween = Math.floor((today - lastVisit) / DAY);

        const condition = conditionAfterXDays(daysBetween, decayRate);

        shipWithStats[part] = {
          ...def,
          condition,
          repairPrice: repairCost(condition, baseCost),
          upgradePrice: upgradeCost(def.level, baseCost)
        };
      });

      return res.json(shipWithStats);

    } else {
      // First time docking: just create dynamic parts
      const todayISO = todayDate();
      const ship = {
          hull:     { repaired: todayISO, level: 1 },
          weapons:  { repaired: todayISO, level: 1 },
          cloaking: { repaired: todayISO, level: 1 },
          landing:  { repaired: todayISO, level: 1 },
          engine:   { repaired: todayISO, level: 1 }
      };

      await firstDock(username, ship);

      const shipWithStats = {};
      Object.entries(ship).forEach(([part, def]) => {
        const { baseCost } = PART_DEFS[part];
        shipWithStats[part] = {
          ...def,
          condition: 100,
          repairPrice: 0,
          upgradePrice: upgradeCost(def.level, baseCost)
        };
      });

      return res.json(shipWithStats);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal server error");
  }
});

// ---- Helpers ----
// Returns today in ISO format
function todayDate() {
    return new Date().toISOString().slice(0, 10);
}

function conditionAfterXDays(days, dailyFactor) {
    return Math.floor(100 * (dailyFactor ** days));
}

function repairCost(currentCondition, baseCost) {
    return Math.floor(baseCost * (1 - (currentCondition / 100)));
}

function upgradeCost(level, baseCost, factor = 2.5) {
    return Math.floor(baseCost * (factor ** level));
}



router.post("/ship/repair", checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const part = req.body.part;

    if (!part) {
        return res.status(400).send("Missing part name");
    }

    const userShip = ships[username];
    if (!userShip || !userShip[part]) {
        return res.status(404).send("Ship part not found");
    }

    const def = userShip[part];
    const { decayRate, baseCost } = PART_DEFS[part];

    const DAY = 1000 * 60 * 60 * 24;
    const now = new Date();
    const lastVisit = new Date(def.repaired);
    const daysBetween = Math.floor((now - lastVisit) / DAY);

    const condition = conditionAfterXDays(daysBetween, decayRate);

    if (condition === 100) {
      return res.status(400).send("Cant repair past repaired condition");
    }

    const price = repairCost(condition, baseCost);

    if (!(await payWithCredits(username, price))) {
        return res.status(403).send("Not enough credits");
    }

    await repairPart(username, part);

    return res.json({
        part,
        level: userShip[part].level,
        condition: 100,
        repairPrice: 0,
        upgradePrice: upgradeCost(def.level, baseCost),
    });

  } catch (err) {
    console.error("Repair error:", err);
    return res.status(500).send("Internal server error");
  }
});

router.post("/ship/upgrade", checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const part = req.body.part;

    if (!part) {
        return res.status(400).send("Missing part name");
    }

    const userShip = ships[username];
    if (!userShip || !userShip[part]) {
        return res.status(404).send("Ship part not found");  
    }

    const def = userShip[part];
    const { decayRate, baseCost } = PART_DEFS[part];

    // Ensure condition is 100% (can only upgrade from full repair)
    const lastVisit = new Date(def.repaired);
    const now = new Date();
    const daysBetween = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
    const currentCondition = conditionAfterXDays(daysBetween, decayRate);

    if (currentCondition < 100) {
      return res.status(400).send("Part must be fully repaired (100%) to upgrade");
    }

    // Max level check
    if (def.level >= 3) {
      return res.status(400).send("Maximum upgrade level reached");
    }

    // Upgrade cost based on current level
    const price = upgradeCost(def.level, baseCost);

    if (!(await payWithCredits(username, price))) {
        return res.status(403).send("Not enough credits");
    }

    await upgradePart(username, part);

    return res.json({
        part,
        level: userShip[part].level,
        condition: 100,
        repairPrice: 0,
        upgradePrice: upgradeCost(userShip[part].level, baseCost)
    });

  } catch (err) {
    console.error("Upgrade error:", err);
    return res.status(500).send("Internal server error");
  }
});

export default router;