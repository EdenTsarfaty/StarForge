import express from "express";
import { checkAuth, checkAdmin } from "./checkAuth.js";
import { users, auctions, closeAuction, placeBid, postAuction, recordActivity } from "../persist_module.js";

const router = express.Router();

router.get('/market', checkAuth);

router.get('/market/load', checkAuth, (req, res) => {
  const isAdmin = req.session.isAdmin;
  const now = Date.now();

  let market;

  if (isAdmin) {
    // Admin sees all, add a flag if past endTime
    market = auctions.filter(auction => auction.isOpen === true).map(auction => {
      const closed = new Date(auction.endTime) <= now;
      return {
        ...auction,
        pendingAdmin: closed
      };
    });
  } else {
    // Normal users see only open auctions
    market = auctions.filter(auction => new Date(auction.endTime) > now && auction.isOpen === true);
  }

  res.json(market);
});

router.post('/auction/bid', checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const auctionId = req.body.auctionId;
    const amount = Number(req.body.amount);

    const auction = auctions.find(auction => auction.id === auctionId);

    // ---- Error handling ----
    const now = Date.now();
    const closed = new Date(auction.endTime) <= now;

    if (!auction || closed || auction.isOpen === false) {
      return res.status(404).send("Auction not found or closed");
    }

    const user = users[username];

    if (!user) {
      throw new Error("User not found");
    }

    let sameUser = (auction.currentBidder === username);
    const oldAmount = auction.currentBid;

    if (sameUser) {
      const diff = amount - oldAmount;
      if (user.credits < diff) {
        return res.status(403).send("Not enough credits");
      }
    } else {
      if (user.credits < amount) {
        return res.status(403).send("Not enough credits");
      }
    }

    if (amount <= oldAmount) {
      return res.status(400).send("Bid must be higher than current bid")
    }

    await placeBid(username, auction, amount);

    return res.status(200).json({ sameUser, oldAmount });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});

router.post('/auction/close', checkAdmin, async (req, res) => {
  try {
    const auctionId = req.body.auctionId;
    const auction = auctions.find(auction => auction.id === auctionId);

    if (!auction || auction.isOpen === false) {
      return res.status(404).send("Auction not found or is already closed");
    }

    await closeAuction(auction);
    return res.sendStatus(200);

  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});

router.post('/auction/post', checkAuth, async (req, res) => {
  try {
    const username = req.session.user;
    const { title, description, endTime } = req.body;
    const startingPrice = Number(req.body.currentBid);
    const auction = { title, description, currentBid: startingPrice, endTime };

    const now = Date.now();
    if (now > new Date(endTime).getTime()) {
      return res.status(400).send("Auction end time must be in the future");
    }

    if (isNaN(startingPrice) || startingPrice <= 0) {
      return res.status(400).send("Starting price must be greater than 0");
    }

    if (title === "") {
      return res.status(400).send("Title cannot be empty");
    }

    const auctionId = await postAuction(auction);
    await recordActivity(new Date().toISOString(), username, "Posted auction");

    return res.status(201).json({ id: auctionId });

  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
});

export default router;