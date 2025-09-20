// Collects all form fields
form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (password_match) {
        const data = new FormData(e.target);
        const cc_number = data.get("card");
        const expiry_month = data.get("expiry-mm");
        const expiry_year = data.get("expiry-yy");
        const name = data.get("name");
        console.log(title, description, cost, image);
    }
});