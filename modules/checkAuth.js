import express from "express";
const router = express.Router();

function getSessionInfo(req) {
  return {
    loggedIn: !!req.session.user,
    username: req.session.user || null,
    isAdmin: !!req.session.isAdmin
  };
}

function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login.html'); 
  }
  next();
}

function checkAdmin(req, res, next) {
  if (!req.session.user || !req.session.isAdmin) {
    return res.status(403).send('Forbidden'); 
  }
  next();
}

router.get("/session", (req, res) => {
  const session = getSessionInfo(req);
  if (!session.loggedIn) {
    return res.json({ loggedIn: false });
  }
  res.json(session);
});

export default router;