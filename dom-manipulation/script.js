// ===== STORAGE KEYS =====
const LS_QUOTES_KEY = "quote_generator_quotes";
const LS_CATEGORY_KEY = "quote_generator_last_category";

// ===== INITIAL QUOTES =====
const defaultQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", category: "Success" },
  { text: "Do what you can, with what you have, where you are.", category: "Inspiration" }
];

// ===== DOM ELEMENTS =====
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const showQuoteBtn = document.getElementById("showQuoteBtn");
const showAllBtn = document.getElementById("showAllBtn");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const newQuoteText = document.getElementById("newQuoteText");
const newQuoteCategory = document.getElementById("newQuoteCategory");

// ===== STATE =====
let quotes = [];

// ===== LOCAL STORAGE UTILITIES =====
function saveQuotes() {
  localStorage.setItem(LS_QUOTES_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem(LS_QUOTES_KEY);
  if (!stored) return [...defaultQuotes];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [...defaultQuotes];
  } catch {
    return [...defaultQuotes];
  }
}

function saveLastCategory(category) {
  localStorage.setItem(LS_CATEGORY_KEY, category);
}

function getLastCategory() {
  return localStorage.getItem(LS_CATEGORY_KEY) || "all";
}

// ===== DOM MANIPULATION =====

// Populate the category dropdown dynamically
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected filter from localStorage
  const lastCategory = getLastCategory();
  if (categories.includes(lastCategory) || lastCategory === "all") {
    categoryFilter.value = lastCategory;
  } else {
    categoryFilter.value = "all";
  }
}

// Display quotes filtered by category
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  saveLastCategory(selectedCategory);

  let filtered = quotes;
  if (selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  if (filtered.length === 0) {
    quoteDisplay.innerHTML = `<p><em>No quotes found for "${selectedCategory}".</em></p>`;
    return;
  }

  const html = filtered
    .map(q => `<p>"${q.text}"<br><small>— ${q.category}</small></p>`)
    .join("<hr/>");

  quoteDisplay.innerHTML = html;
}

// Show a random quote (filtered)
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const pool = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (pool.length === 0) {
    quoteDisplay.innerHTML = `<p><em>No quotes found in this category.</em></p>`;
    return;
  }

  const randomQuote = pool[Math.floor(Math.random() * pool.length)];
  quoteDisplay.innerHTML = `
    <p>"${randomQuote.text}"</p>
    <small>— ${randomQuote.category}</small>
  `;
}

// Add a new quote dynamically and update categories
function addQuote() {
  const text = newQuoteText.value.trim();
  const category = newQuoteCategory.value.trim();

  if (!text || !category) {
    alert("Please fill in both quote and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories(); // refresh dropdown in case new category added
  filterQuotes(); // refresh quotes display

  newQuoteText.value = "";
  newQuoteCategory.value = "";
  alert("Quote added successfully!");
}

// ===== INITIALIZATION =====
function init() {
  quotes = loadQuotes();
  populateCategories();
  filterQuotes(); // show quotes for last selected filter
}

// ===== EVENT LISTENERS =====
categoryFilter.addEventListener("change", filterQuotes);
showQuoteBtn.addEventListener("click", showRandomQuote);
showAllBtn.addEventListener("click", () => {
  categoryFilter.value = "all";
  saveLastCategory("all");
  filterQuotes();
});
addQuoteBtn.addEventListener("click", addQuote);

// ===== RUN APP =====
init();
