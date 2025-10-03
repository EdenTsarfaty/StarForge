const selector = document.getElementById("theme-select")
const presetTheme = localStorage.getItem("theme");

if (presetTheme) {
  selector.value = presetTheme;
} else {
  selector.value = "system";
}

selector.addEventListener("change", (e) => {
  const choice = e.target.value;
  applyTheme(choice);
})


function applyTheme(choice) {
  document.documentElement.classList.remove("dark", "light", "system");
  if (choice === "dark") {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }

  if (choice === "light") {
    document.documentElement.classList.add("light");
    localStorage.setItem("theme", "light");
  }

  if (choice === "system") {
    document.documentElement.classList.add("system");
    localStorage.removeItem("theme");
  }
}