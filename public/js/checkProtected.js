(async function() {
  const res = await fetch("/session", { credentials: "include" });
  if (res.status === 401) {
    window.location.href = "login.html?next=" + encodeURIComponent(window.location.pathname);
    return;
  }
  const data = await res.json();
  if (!data.isAdmin && window.location.pathname.includes("admin")) {
    window.location.href = "store.html";
  }
})();