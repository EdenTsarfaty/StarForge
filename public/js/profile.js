async function loadFields () {
    try{
        const res = await fetch('/profile/load', {
            method: "GET",
            credentials: "include"
        })
        if (res.ok) {
            const data = await res.json();
            const fields = document.querySelectorAll(".form-row");
            fields.forEach(field => {
                // 1. Place user's data
                const fieldType = field.dataset.fieldtype;
                console.log(fieldType)
                let input;
                if (fieldType !== "password") { //For passwords fields we do not place data
                    input = field.querySelector("input");
                    if (fieldType === "DoB") {
                        input.value = data[fieldType];
                    } else {
                        input.placeholder = data[fieldType];
                    }
                }


                // 2. Wire edit buttons
                //    (username cannot be changed; password implemented differently)
                if (fieldType !== "username" && fieldType !== "password") {
                    const editBtn = field.querySelector(".icon-btn.edit");
                    const cancelBtn = field.querySelector(".icon-btn.x-mark");
                    const finishedBtn = field.querySelector(".icon-btn.check")
                    editBtn.onclick = () => {
                        input.disabled = false;
                        editBtn.style.display = "none";
                        finishedBtn.style.display = "inline";
                        cancelBtn.style.display = "inline";
                    }


                // 3. Wire finished edit button
                    finishedBtn.onclick = async () => {
                        const changeResponse = await fetch(`/profile/edit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ [fieldType]:input.value }),
                            credentials: "include"
                        })
                        if (changeResponse.ok) {
                            alert(`Changed ${fieldType} successfully`);
                            input.disabled = true;
                            input.placeholder = input.value;
                            input.value = "";
                            editBtn.style.display = "inline";
                            finishedBtn.style.display = "none";
                            cancelBtn.style.display = "none";
                        } else {
                            const msg = await changeResponse.text();
                            alert(`Could not change ${fieldType}.\n${msg}`);
                        }
                    }

                // 4. Wire cancel buttons
                    cancelBtn.onclick = () => {
                        input.disabled = true;
                        if (fieldType === "DoB") {
                            input.value = data[fieldType];
                        } else {
                            input.value = "";
                        }
                        editBtn.style.display = "inline";
                        finishedBtn.style.display = "none";
                        cancelBtn.style.display = "none";
                    }

                }
            })

            setupPasswordField();
        }
    } catch (err) {
        console.error(err);
    }
}

async function setupPasswordField() {
    // Grab all elements
    const field = document.querySelector(".form-row.pass");
    const newPass = document.querySelector(".form-row.new-pass");
    const confirmPass = document.querySelector(".form-row.confirm-pass");

    const passPolicy = document.getElementById("pass-policy");

    const editBtn = field.querySelector(".icon-btn.edit");
    const cancelBtn = field.querySelector(".icon-btn.x-mark");
    const finishedBtn = field.querySelector(".icon-btn.check");
    const passToggleBtn = field.querySelector(".icon-btn.toggle-password");
    const newPassToggleBtn = newPass.querySelector(".icon-btn.toggle-password");

    const passInput = field.querySelector("input");
    const newPassInput = newPass.querySelector("input");
    const confirmPassInput = confirmPass.querySelector("input");

    const passToggleOnIcon = passToggleBtn.querySelector(".on");
    const passToggleOffIcon = passToggleBtn.querySelector(".off");
    const newPassToggleOnIcon = newPassToggleBtn.querySelector(".on");
    const newPassToggleOffIcon = newPassToggleBtn.querySelector(".off");

    const passPolicyLowercase = passPolicy.querySelector("#lowercase");
    const passPolicyUppercase = passPolicy.querySelector("#uppercase");
    const passPolicyNumber = passPolicy.querySelector("#number");
    const passPolicySpecial = passPolicy.querySelector("#special");
    const passPolicyMatch = passPolicy.querySelector("#match");


    // Main edit button
    editBtn.onclick = () => {
        passInput.disabled = false;
        editBtn.style.display = "none";
        finishedBtn.style.display = "inline";
        cancelBtn.style.display = "inline";
        passToggleBtn.style.display = "inline";
        newPass.style.display = "block";
        confirmPass.style.display = "block";
        passPolicy.style.display = "block";
        passInput.placeholder = "";
    }

    // Main cancel button
    function cancelPasswordEdit () {
        passInput.disabled = true;
        passInput.value = "";
        editBtn.style.display = "inline";
        finishedBtn.style.display = "none";
        cancelBtn.style.display = "none";
        passToggleBtn.style.display = "none";
        newPass.style.display = "none";
        newPassInput.value = "";
        confirmPass.style.display = "none";
        confirmPassInput.value = "";
        passPolicy.style.display = "none";
        passInput.placeholder = "●●●●●";
        [passPolicyLowercase, passPolicyUppercase, passPolicyNumber, passPolicySpecial, passPolicyMatch].forEach(element => {
            element.classList.remove("satisfied");
        });
    }
    cancelBtn.onclick = cancelPasswordEdit;

    // Existing password visibility toggle
    passToggleBtn.onclick = () => {
        if (passInput.type === "password") {
            passInput.type = "text";
            passToggleOnIcon.style.display = "none";
            passToggleOffIcon.style.display = "inline";
        } else {
            password.type = "password";
            passToggleOnIcon.style.display = "inline";
            passToggleOffIcon.style.display = "none";
        }
    };

    // New password visibility toggle
    newPassToggleBtn.onclick = () => {
        if (newPassInput.type === "password") {
            newPassInput.type = "text";
            confirmPassInput.type = "text";
            newPassToggleOnIcon.style.display = "none";
            newPassToggleOffIcon.style.display = "inline";
        } else {
            newPassInput.type = "password";
            confirmPassInput.type = "password";
            newPassToggleOnIcon.style.display = "inline";
            newPassToggleOffIcon.style.display = "none";
        }
    };


    // Password policy check
    function checkPasswordPolicy(pass, confirmPass) {
        const rules = {
            hasUpper: /[A-Z]/.test(pass),
            hasLower: /[a-z]/.test(pass),
            hasNumber: /\d/.test(pass),
            hasSpecial: /[!@#$%^&*]/.test(pass),
            matches: pass === confirmPass
        };

        rules.hasUpper ? passPolicyUppercase.classList.add("satisfied") : passPolicyUppercase.classList.remove("satisfied");
        rules.hasLower ? passPolicyLowercase.classList.add("satisfied") : passPolicyLowercase.classList.remove("satisfied");
        rules.hasNumber ? passPolicyNumber.classList.add("satisfied") : passPolicyNumber.classList.remove("satisfied");
        rules.hasSpecial ? passPolicySpecial.classList.add("satisfied") : passPolicySpecial.classList.remove("satisfied");
        rules.matches ? passPolicyMatch.classList.add("satisfied") : passPolicyMatch.classList.remove("satisfied");

        return Object.values(rules).every(Boolean);
    }

    newPassInput.addEventListener("input", () => {
        checkPasswordPolicy(newPassInput.value, confirmPassInput.value);
    });

    confirmPassInput.addEventListener("input", (e) => {
        const val = e.target.value;
        (val === confirmPassInput.value) ? passPolicyMatch.classList.add("satisfied") : passPolicyMatch.classList.remove("satisfied");
    });

    // Main finished button
    editBtn.addEventListener("click", async () => {
        const res = await fetch(`/profile/edit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: newPassInput.value }),
            credentials: "include"
        })
        if (res.ok) {
            alert(`Changed password successfully`);
            cancelPasswordEdit();
        } else {
            const msg = await res.text();
            alert(`Could not change password.\n${msg}`);
        }
    });
}

loadFields();