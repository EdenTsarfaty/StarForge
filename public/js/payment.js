cart = JSON.parse(sessionStorage.getItem("checkedOut"));

async function updatePayment() {
    totalPayment = document.getElementById("total-label");
    totalPayment.textContent = `Total to pay: ${cart.amount} ⚛`;
}

const radios = document.querySelectorAll("input[name=payment-method]");
const cardInputs = document.querySelectorAll(".section input");

radios.forEach(radio => {
    radio.addEventListener("change", () => {
        if (radio.value === "credits" && radio.checked) {
        cardInputs.forEach(inp => inp.disabled = true);
        }
        if (radio.value === "card" && radio.checked) {
        cardInputs.forEach(inp => inp.disabled = false);
        }
    });
});

paymentForm = document.getElementById("payment-form");

// Collects all form fields
paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const method = data.get("payment-method");
    if (method === "card") {
        const cc_number = data.get("card");
        const expiry_month = data.get("expiry-mm");
        const expiry_year = data.get("expiry-yy");
        const name = data.get("name");
        try {
            const res = await fetch("/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // sent but disregarded by server - fake payment
                body: JSON.stringify({ method, cc_number, expiry_month, expiry_year, name, items: cart.items, cost: cart.amount}),
            });
            if (res.ok) {
                window.location.href = "thankyou.html";
            } else {
                const msg = await res.text();
                console.error(msg);
                alert("Payment unsuccessful");
            }
        } catch (err) {
            console.error(err);
        }
    }


    if (method === "credits") {
        alert("Supported soon!");
    }
});

updatePayment();