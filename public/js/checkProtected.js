(async function() {
  const res = await fetch("/session", { credentials: "include" });
  if (res.status === 401) {
    window.location.href = "login.html";
  }
})();