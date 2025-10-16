// ===== STORAGE KEYS =====
const LS_KEY = "dynamic_quote_generator_quotes_v1";
const SESSION_LAST_QUOTE_KEY = "dqg_last_viewed_quote";

// ===== INITIAL SAMPLE QUOTES =====
const defaultQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "Do what you can, with what you have, where you are.", category: "Inspiration" },
  { text: "Success usually comes to those who are too busy to be looking for it.", category: "Success" }
];

// ===== DOM ELEMENTS =====
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteTextInput = document.getElementById("newQuoteText");
const newQuoteCategoryInput = document.getElementById("newQuoteCategory");
const importFileInput = document.getElementById("importFile");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const clearStorageBtn = document.getElementById("clearStorageBtn");
const showLastBtn = document.getElementById("showLast");
const importFeedback = document.getElementById("importFeedback");

// ===== APP STATE =====
let quotes = [];

// ===== UTILITIES =====
function saveQuotesToLocalStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
  }
}

function loadQuotesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (err) {
    console.warn("Could not parse stored quotes:", err);
    return null;
  }
}

function saveLastViewedToSession(quoteObj) {
  try {
    sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, JSON.stringify(quoteObj));
  } catch (err) {
    console.warn("Failed to write sessionStorage:", err);
  }
}

function getLastViewedFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_LAST_QUOTE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function isValidQuoteArray(arr) {
  if (!Array.isArray(arr)) return false;
  return arr.every(q => q && typeof q.text === "string" && typeof q.category === "string");
}

// ===== UI Helpers =====
function updateCategoryOptions() {
  const categories = Array.from(new Set(quotes.map(q => q.category))).sort();
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

function displayQuote(quoteObj) {
  if (!quoteObj) {
    quoteDisplay.innerHTML = `<em>No quote to display.</em>`;
    return;
  }
  quoteDisplay.innerHTML = `
    <div style="font-size:1.05rem">“${escapeHtml(quoteObj.text)}”</div>
    <small>— ${escapeHtml(quoteObj.category)}</small>
  `;
  // store last viewed in sessionStorage
  saveLastViewedToSession(quoteObj);
}

function escapeHtml(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// ===== Core Features =====
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const pool = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (!pool.length) {
    quoteDisplay.innerHTML = `<em>No quotes found for "${escapeHtml(selectedCategory)}".</em>`;
    return;
  }
  const idx = Math.floor(Math.random() * pool.length);
  displayQuote(pool[idx]);
}

function addQuoteFromInputs() {
  const text = newQuoteTextInput.value.trim();
  const category = newQuoteCategoryInput.value.trim();

  if (!text || !category) {
    alert("Please fill both quote text and category.");
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);
  saveQuotesToLocalStorage();
  updateCategoryOptions();
  newQuoteTextInput.value = "";
  newQuoteCategoryInput.value = "";

  displayQuote({ text: `Added: ${newQ.text}`, category: newQ.category });
}

// ===== Import / Export =====
function exportQuotesAsJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quotes_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromFileInput() {
  const file = importFileInput.files && importFileInput.files[0];
  importFeedback.textContent = "";
  if (!file) {
    importFeedback.textContent = "No file selected.";
    return;
  }
  if (!file.name.toLowerCase().endsWith(".json")) {
    importFeedback.textContent = "Please select a .json file.";
    return;
  }

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (!isValidQuoteArray(parsed)) {
        importFeedback.textContent = "Invalid JSON format. Expect an array of {text, category} objects.";
        return;
      }
      // Option: merge while avoiding exact duplicates
      const beforeCount = quotes.length;
      const existingSet = new Set(quotes.map(q => q.text + "||" + q.category));
      parsed.forEach(q => {
        const key = q.text + "||" + q.category;
        if (!existingSet.has(key)) {
          quotes.push({ text: String(q.text), category: String(q.category) });
          existingSet.add(key);
        }
      });
      saveQuotesToLocalStorage();
      updateCategoryOptions();
      importFeedback.textContent = `Imported ${quotes.length - beforeCount} new quote(s).`;
    } catch (err) {
      console.error("Import error:", err);
      importFeedback.textContent = "Failed to parse JSON file.";
    }
  };
  reader.onerror = () => {
    importFeedback.textContent = "Error reading file.";
  };
  reader.readAsText(file);
}

// ===== Utilities for clear storage =====
function clearLocalStorage() {
  const confirmed = confirm("This will remove all saved quotes from localStorage. Proceed?");
  if (!confirmed) return;
  localStorage.removeItem(LS_KEY);
  quotes = [...defaultQuotes];
  saveQuotesToLocalStorage();
  updateCategoryOptions();
  quoteDisplay.innerHTML = "<em>Local storage cleared. Restored default quotes.</em>";
}

// ===== Initialization =====
function init() {
  const stored = loadQuotesFromLocalStorage();
  if (stored && isValidQuoteArray(stored)) {
    quotes = stored;
  } else {
    // first time: seed with defaults and save
    quotes = [...defaultQuotes];
    saveQuotesToLocalStorage();
  }
  updateCategoryOptions();

  // Try restoring last viewed quote (session)
  const last = getLastViewedFromSession();
  if (last) {
    quoteDisplay.innerHTML = `<small>Last viewed (this session):</small>`;
    displayQuote(last);
  } else {
    quoteDisplay.innerHTML = `<em>Welcome — use "Show New Quote" or add your own quotes.</em>`;
  }

  // Bind events
  newQuoteBtn.addEventListener("click", showRandomQuote);
  showLastBtn.addEventListener("click", () => {
    const lastQ = getLastViewedFromSession();
    if (!lastQ) {
      alert("No last viewed quote in this session.");
      return;
    }
    displayQuote(lastQ);
  });
  addQuoteBtn.addEventListener("click", addQuoteFromInputs);
  categoryFilter.addEventListener("change", showRandomQuote);
  exportBtn.addEventListener("click", exportQuotesAsJson);
  importBtn.addEventListener("click", importFromFileInput);
  clearStorageBtn.addEventListener("click", clearLocalStorage);

  // helpful keyboard: Enter to add quote when input focused
  newQuoteCategoryInput.addEventListener("keyup", (e) => { if (e.key === "Enter") addQuoteFromInputs(); });
  newQuoteTextInput.addEventListener("keyup", (e) => { if (e.key === "Enter") addQuoteFromInputs(); });
}

// Start
init();
