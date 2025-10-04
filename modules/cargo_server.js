import express from "express";
import { checkAuth } from "./checkAuth.js";
import { cargo, cargoItems, saveCargo, sellCargoItem, sellCargoAll } from "../persist_module.js";

const router = express.Router();

router.get('/cargo/load-log', checkAuth, async (req, res) => {
  try {
      const username = req.session.user;
      const manifest = cargo[username] || { items: {} };

      const items = Object.entries(manifest.items)
          .map(([id, qty]) => {
          const def = cargoItems[id];  // lookup definition
          if (!def) return null;

          return {
              id: Number(id),
              qty,
              title: def.title,
              description: def.description,
              price: def.price,
              image: def.image
          };
          })
          .filter(Boolean); // drop nulls if bad ids

      res.json(items);
  } catch (err) {
    return res.status(500).send("Internal server error:", err);
  }
});

router.post('/cargo/sell', checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const itemId = req.body.itemId;
    try {
        await sellCargoItem(username, itemId);
        return res.status(200).send(`Item ${cargoItems[itemId].title} sold.`);
    } catch (err) {
    return res.status(500).send(err);
    }
  } catch (err) {
    return res.status(500).send("Internal server error:", err);
  }
});

router.post('/cargo/sellAll', checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const manifest = cargo[username] || { items: {} };
    let totalAmount = 0;

    try {
        Object.entries(manifest.items).forEach(([itemId, quantity]) => {
            const itemDef = cargoItems[itemId];
            if (!itemDef) return; // skip if not in catalog
            totalAmount += quantity * itemDef.price;
        });

        await sellCargoAll(username, totalAmount);

        res.sendStatus(200);
    } catch (err) {
        console.error("sellAll error:", err);
        res.status(500).send("Error selling cargo");
    }
  } catch (err) {
    return res.status(500).send("Internal server error:", err);
  }
});

router.post('/cargo/unload', checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const today = new Date().toDateString();

    if (!cargo[username]) {
      cargo[username] = { lastUnload: null, items: {} };
    }

    if (cargo[username].lastUnload === today) {
      return res.status(429).send("You already unloaded your cargo today.\nCargo Bay serves each customer once per day.");
    }
    cargo[username].lastUnload = today;

    const newItems = [];

    // iterate definitions
    Object.entries(cargoItems).forEach(([id, def]) => {
      if (Math.random() > def.rarity) {
        const min = def.quantityRange.min;
        const max = def.quantityRange.max;
        const qty = min + Math.floor(Math.random() * (max - min + 1));

        if (qty > 0) {
          cargo[username].items[id] = (cargo[username].items[id] || 0) + qty;

          newItems.push({
            id: Number(id),
            title: def.title,
            description: def.description,
            price: def.price,
            image: def.image,
            qty
          });
        }
      }
    });

    await saveCargo();

    res.json(newItems);
  } catch (err) {
    return res.status(500).send("Internal server error:", err);
  }
});

export default router;