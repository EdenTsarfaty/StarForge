import { updateCredits } from "/js/navbar.js";

const auctionsGrid = document.getElementById("auctions-grid");
const warning = document.getElementById("warning-no-items");

function noAuctionsInMarket() {
  container.innerHTML = ""; // Nukes all children of main div

  warning.style.display = "block";
}

function loadCard(auction, pendingAdmin = false ) {
  // create container
  const auctionCard = document.createElement("div");
  auctionCard.className = "auction-card";
  auctionCard.id = `auction-${auction.id}`;
  
  const cardInner = document.createElement("div");
  cardInner.className = "card-inner";

  const textSection = document.createElement("div");
  textSection.className = "text";

  // title
  const title = document.createElement("h1");
  title.textContent = auction.title;
  textSection.appendChild(title);

  // description
  const description = document.createElement("p");
  description.textContent = auction.description;
  textSection.appendChild(description);

  const actionSection = document.createElement("div");
  actionSection.className = "action";

  // countdown
  const countdown = document.createElement("h1");
  if (!pendingAdmin) {
    countdown.className = "countdown";
    startCountdown(countdown, auction.endTime);
  } else {
    countdown.textContent = "Auction closed"
  }
  actionSection.appendChild(countdown);

  // current bid
  const currentBid = document.createElement("h3");
  if (!pendingAdmin) {
    currentBid.textContent = `Current Bid: ${auction.currentBid}⚛`;
  } else {
    if (auction.currentBidder) {
      currentBid.innerHTML = `Winning Bid: ${auction.currentBid}⚛<br>User: ${auction.currentBidder}`;
    } else {
      currentBid.innerHTML = `Winning Bid: ${auction.currentBid}⚛<br>No bids`;
    }
  }
  actionSection.appendChild(currentBid);

  // bid button
  const bidButton = document.createElement("button");
  if (!pendingAdmin) {
    bidButton.textContent = "Place bid";
    bidButton.onclick = () => { openBidModal(auction) };
  } else {
    bidButton.textContent = "Close auction";
    bidButton.onclick = () => { closeAuction(auction, auctionCard) };
  }

  actionSection.appendChild(bidButton);
  cardInner.appendChild(textSection);
  cardInner.appendChild(actionSection);
  auctionCard.appendChild(cardInner);

  auctionsGrid.appendChild(auctionCard);
}

// ---- Helpers ----
function startCountdown(countdownTimer, endTime) {
  let timer;
  function update() {
    const now = Date.now();
    const diff = new Date(endTime) - now;

    if (diff <= 0) {
      countdownTimer.textContent = "Auction closed";
      clearInterval(timer); //stops the job
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdownTimer.textContent = `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  update(); // run once immediately
  timer = setInterval(update, 1000); // run every 1 second
}





// ---- Modal Bid fucntions ----
const bidModal = document.getElementById("bid-modal");
const bidModalTitle = document.getElementById("modal-title");
const bidForm = document.getElementById("bid-form");
const closeBidModalBtn = document.getElementById("close-bid-modal");

// Global auctionID between functions
let currentAuctionId = null;

// When "Place bid" clicked
function openBidModal(auction) {
  currentAuctionId = auction.id;
  bidModalTitle.textContent = `Bidding on: ${auction.title}`;
  bidModal.classList.add("show");
  document.getElementById("bid-amount").value = auction.currentBid;
}

// Close modal
function closeBidModal() {
  bidModal.classList.remove("show");
  currentAuctionId = null;
}

// Handle form submit
bidForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("bid-amount").value;

  const res = await fetch("/auction/bid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auctionId: currentAuctionId, amount })
  });

  if (res.ok) {
    const data = await res.json();

    const card = document.getElementById(`auction-${currentAuctionId}`)
    const updatedBid = card.querySelector(".action h3");
    updatedBid.textContent = `Current Bid: ${amount}⚛`;

    if (data.sameUser) {
      updateCredits(-Number(amount) + Number(data.oldAmount)); //deduct only diff
    } else {
      updateCredits(-Number(amount));
    }

    alert("Bid placed!");
    closeBidModal();
  } else {
    const msg = await res.text();
    alert(msg);
  }
});

// Hook up cancel button
closeBidModalBtn.addEventListener("click", closeBidModal);





// ---- Modal Post fucntions ----
const postModal = document.getElementById("post-modal");
const postForm = document.getElementById("post-form");
const openPostModalBtn = document.getElementById("post-btn");
const closePostModalBtn = document.getElementById("close-post-modal");

// When "Post Auction" clicked
function openPostModal() {
  postModal.classList.add("show");
}

// Close modal
function closePostModal() {
  postModal.classList.remove("show");
}

// Handle form submit
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const title = data.get("post-title");
  const description = data.get("post-desc");
  const currentBid = Number(data.get("post-amount"));
  const endTime = (new Date(data.get("post-endtime"))).toISOString();
  const auction = { title, description, currentBid, endTime };
  console.log(endTime);

  const res = await fetch("/auction/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify( auction )
  });

  if (res.ok) {
    auction.id = (await res.json()).id
    loadCard(auction);
    alert("Auction posted!");
    e.target.reset();
    closePostModal();
  } else {
    const msg = await res.text();
    alert(msg);
  }
});



// Hook up cancel button
closePostModalBtn.addEventListener("click", closePostModal);

//Hook up Post Auction button
openPostModalBtn.addEventListener("click", openPostModal);






// Close auctions pending for admin approval
async function closeAuction (auction, card) {
  if (confirm(`Close auction by ${auction.currentBidder} for ${auction.currentBid} for ${auction.title}`)) {
      const res = await fetch("/auction/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auctionId: auction.id })
    });
    if (res.ok) {
      card.remove();
    } else {
      const msg = await res.text();
      console.error(msg);
      alert("Could not close auction");
    }
  }
}






async function loadAuctions() {
  try {
    const res = await fetch("/market/load");
    if (res.ok) {
      const auctions = await res.json();
      if (auctions.length === 0) {
        noAuctionsInMarket();
      } else {
        auctions.forEach( (auction) => {
          if (auction.pendingAdmin) {
            loadCard(auction, auction.pendingAdmin);
          } else {
            loadCard(auction);
          }
        });
        auctionsGrid.style.display = "grid";
      }
    }
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

loadAuctions();