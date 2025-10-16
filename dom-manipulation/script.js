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

const quoteDisplay = document.getElementById('quoteDisplay');
const syncButton = document.getElementById('syncQuotes');
const syncStatus = document.getElementById('syncStatus');

let quotes = JSON.parse(localStorage.getItem('quotes')) || [];

// --- Fetch Quotes from "Server" ---
async function fetchQuotesFromServer() {
  syncStatus.textContent = 'Fetching latest quotes from server...';
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    const serverQuotes = await response.json();
    
    // Convert server posts into quote-like objects
    const formattedQuotes = serverQuotes.map(q => ({
      text: q.title,
      category: 'Server Sync'
    }));

    // Conflict resolution: server data takes precedence
    quotes = [...formattedQuotes, ...quotes.filter(localQ => 
      !formattedQuotes.some(serverQ => serverQ.text === localQ.text)
    )];
    
    localStorage.setItem('quotes', JSON.stringify(quotes));
    syncStatus.textContent = '✅ Sync complete. Server data updated.';
    showRandomQuote();
  } catch (error) {
    syncStatus.textContent = '❌ Sync failed. Check your connection.';
    console.error(error);
  }
}

// --- Upload Local Quotes to Server (Simulation) ---
async function uploadQuotesToServer() {
  syncStatus.textContent = 'Uploading local quotes to server...';
  
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(quotes),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      syncStatus.textContent = '✅ Local quotes synced to server successfully!';
    } else {
      throw new Error('Server upload failed');
    }
  } catch (error) {
    syncStatus.textContent = '❌ Upload failed.';
    console.error(error);
  }
}

// --- Trigger Sync ---
syncButton.addEventListener('click', async () => {
  await uploadQuotesToServer();
  await fetchQuotesFromServer();
});

function resolveConflicts(serverQuotes) {
  let conflicts = 0;
  const newQuotes = serverQuotes.map(sq => {
    const conflict = quotes.find(lq => lq.text === sq.text);
    if (conflict) conflicts++;
    return sq;
  });
  if (conflicts > 0) {
    alert(`${conflicts} conflicts resolved automatically using server data.`);
  }
  return newQuotes;
}
