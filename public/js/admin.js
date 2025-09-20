const searchbox = document.getElementById("search");
const users = document.querySelectorAll("table tbody tr");

// Local filter to the activity log
searchbox.addEventListener("input", () => {
  const query = searchbox.value.toLowerCase();
  users.forEach(row => {
    const cells = row.querySelectorAll("td");
    const username = cells[1].innerText.toLowerCase();
    const match = username.startsWith(query);
    row.style.display = match ? "table-row" : "none";
  });
});

// Collects all form fields
form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (password_match) {
        const data = new FormData(e.target);
        const title = data.get("title");
        const description = data.get("description");
        const cost = data.get("cost");
        const image = data.get("image");
        console.log(title, description, cost, image);
    }
});