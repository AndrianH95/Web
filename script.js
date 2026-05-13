// Секція 11: Додавання контенту через DOM

let count = 0;

const addBtn   = document.getElementById("addBtn");
const clearBtn = document.getElementById("clearBtn");
const output   = document.getElementById("output");

addBtn.addEventListener("click", function () {
  count++;
  const p = document.createElement("p");
  p.textContent = "📝 Новий абзац #" + count + " — доданий через JavaScript";
  p.className = "added-item";
  output.appendChild(p);
});

clearBtn.addEventListener("click", function () {
  output.innerHTML = "";
  count = 0;
});

// Секція 12: Зміна теми (dark / light)

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  this.textContent = isDark ? "☀️ Світла тема" : "🌙 Темна тема";
});

// Секція 12: Показати / сховати пояснення

const toggleExplBtn = document.getElementById("toggleExplBtn");
const toggleContent = document.getElementById("toggleContent");

toggleExplBtn.addEventListener("click", function () {
  toggleContent.classList.toggle("hidden");
  const isVisible = !toggleContent.classList.contains("hidden");
  this.textContent = isVisible ? "🙈 Сховати пояснення" : "👁 Показати пояснення";
});