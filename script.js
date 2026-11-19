
const $ = (selector) => document.querySelector(selector);

const money = (amount) =>
  "₦" + Number(amount).toLocaleString("en-NG");

const today = new Date().toISOString().slice(0, 10);

// -------------------------------
// DATA
// -------------------------------

const defaultTransactions = [
  { name: "Website development", date: "2026-11-18", category: "Services", type: "income", amount: 450000 },
  { name: "Office supplies", date: "2026-11-17", category: "Operations", type: "expense", amount: 85000 },
  { name: "Product sales", date: "2026-11-16", category: "Sales", type: "income", amount: 320000 },
  { name: "Marketing campaign", date: "2026-11-15", category: "Marketing", type: "expense", amount: 125000 },
  { name: "Consulting service", date: "2026-11-14", category: "Services", type: "income", amount: 275000 }
];

const defaultCustomers = [
  { name: "David Johnson", email: "david@example.com", joined: "2026-11-12" },
  { name: "Sarah Williams", email: "sarah@example.com", joined: "2026-11-10" },
  { name: "Michael Brown", email: "michael@example.com", joined: "2026-11-08" },
  { name: "Grace Anderson", email: "grace@example.com", joined: "2026-11-05" }
];

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

let transactions = loadData("nexusTransactions", defaultTransactions);
let customers = loadData("nexusCustomers", defaultCustomers);

const baseRevenue = 8450000;
const baseExpenses = 2180000;
const baseCustomers = 2840;

// -------------------------------
// STORAGE
// -------------------------------

function saveData() {
  localStorage.setItem("nexusTransactions", JSON.stringify(transactions));
  localStorage.setItem("nexusCustomers", JSON.stringify(customers));
}

// -------------------------------
// SAFE HTML
// -------------------------------

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// -------------------------------
// DATE
// -------------------------------

$("#currentDate").textContent = new Date().toLocaleDateString("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

function formatDate(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// -------------------------------
// TOAST
// -------------------------------

let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// -------------------------------
// ICONS
// -------------------------------

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// -------------------------------
// NAVIGATION
// -------------------------------

const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

function openPage(pageName) {
  pages.forEach(page => {
    page.classList.toggle("active", page.id === pageName);
  });

  navLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageName);
  });

  const activeLink = document.querySelector(
    `.nav-link[data-page="${pageName}"]`
  );

  $("#breadcrumb").textContent =
    activeLink?.querySelector("span")?.textContent || "Overview";

  $("#sidebar").classList.remove("open");

  if (pageName === "analytics") {
    setTimeout(drawAnalyticsChart, 50);
  }

  if (pageName === "overview") {
    setTimeout(drawRevenueChart, 50);
  }
}

navLinks.forEach(link => {
  link.addEventListener("click", () => openPage(link.dataset.page));
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => openPage(button.dataset.goto));
});

$("#menuToggle").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

// -------------------------------
// FINANCIAL TOTALS
// -------------------------------

function calculateTotals() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const revenue = baseRevenue + income;
  const totalExpenses = baseExpenses + expenses;
  const profit = revenue - totalExpenses;

  $("#revenueValue").textContent = money(revenue);
  $("#expenseValue").textContent = money(totalExpenses);
  $("#profitValue").textContent = money(profit);
  $("#chartTotal").textContent = money(revenue);
}

// -------------------------------
// TRANSACTIONS
// -------------------------------

function transactionIcon(category) {
  const icons = {
    Sales: "shopping-bag",
    Services: "briefcase-business",
    Marketing: "megaphone",
    Operations: "building-2",
    Other: "wallet"
  };

  return icons[category] || "wallet";
}

function transactionRow(item, showStatus = false) {
  const income = item.type === "income";

  return `
    <tr>
      <td>
        <div class="transaction-name">
          <div class="transaction-icon">
            <i data-lucide="${transactionIcon(item.category)}"></i>
          </div>
          ${escapeHTML(item.name)}
        </div>
      </td>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHTML(item.category)}</td>
      ${
        showStatus
          ? `<td><span class="status">Completed</span></td>`
          : `<td>${income ? "Income" : "Expense"}</td>`
      }
      <td class="${income ? "amount-income" : "amount-expense"}">
        ${income ? "+" : "-"}${money(item.amount)}
      </td>
    </tr>
  `;
}

function renderAllTransactions() {
  const search = $("#transactionSearch").value.toLowerCase();
  const type = $("#typeFilter").value;

  const filtered = [...transactions]
    .filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search);

      const matchesType = type === "all" || item.type === type;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  $("#allTransactions").innerHTML = filtered.length
    ? filtered.map(item => transactionRow(item)).join("")
    : `<tr><td colspan="5">No matching transactions found.</td></tr>`;

  refreshIcons();
}

function renderTransactions() {
  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  $("#recentTransactions").innerHTML = recent.length
    ? recent.map(item => transactionRow(item, true)).join("")
    : `<tr><td colspan="5">No transactions yet.</td></tr>`;

  calculateTotals();
  renderAllTransactions();
}

$("#transactionSearch").addEventListener("input", renderAllTransactions);
$("#typeFilter").addEventListener("change", renderAllTransactions);

// -------------------------------
// TRANSACTION MODAL
// -------------------------------

const transactionModal = $("#transactionModal");

function openTransactionModal() {
  transactionModal.classList.add("show");
  $("#transactionDate").value = today;
}

function closeTransactionModal() {
  transactionModal.classList.remove("show");
  $("#transactionForm").reset();
}

$("#addTransactionBtn").addEventListener("click", openTransactionModal);
$("#addTransactionBtn2").addEventListener("click", openTransactionModal);
$("#closeModal").addEventListener("click", closeTransactionModal);
$("#cancelModal").addEventListener("click", closeTransactionModal);

transactionModal.addEventListener("click", event => {
  if (event.target === transactionModal) {
    closeTransactionModal();
  }
});

$("#transactionForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#transactionName").value.trim();
  const amount = Number($("#transactionAmount").value);
  const type = $("#transactionType").value;
  const category = $("#transactionCategory").value;
  const date = $("#transactionDate").value;

  if (!name || !date || !Number.isFinite(amount) || amount <= 0) {
    showToast("Please enter valid transaction details.");
    return;
  }

  transactions.push({ name, amount, type, category, date });

  saveData();
  renderTransactions();
  drawRevenueChart();
  closeTransactionModal();

  showToast("Transaction added successfully!");
});

// -------------------------------
// CUSTOMERS
// -------------------------------

function renderCustomers() {
  $("#customerCount").textContent =
    (baseCustomers + customers.length).toLocaleString("en-NG");

  $("#newCustomerCount").textContent =
    customers.length.toLocaleString("en-NG");

  $("#customerTable").innerHTML = customers.length
    ? customers.map(customer => `
      <tr>
        <td>
          <div class="transaction-name">
            <div class="profile-avatar">
              ${escapeHTML(customer.name.slice(0, 1).toUpperCase())}
            </div>
            ${escapeHTML(customer.name)}
          </div>
        </td>
        <td>${escapeHTML(customer.email)}</td>
        <td>${formatDate(customer.joined)}</td>
        <td><span class="status">Active</span></td>
      </tr>
    `).join("")
    : `<tr><td colspan="4">No customers added yet.</td></tr>`;
}

const customerModal = $("#customerModal");

function closeCustomerModal() {
  customerModal.classList.remove("show");
  $("#customerForm").reset();
}

$("#addCustomerBtn").addEventListener("click", () => {
  customerModal.classList.add("show");
});

$("#closeCustomerModal").addEventListener("click", closeCustomerModal);
$("#cancelCustomer").addEventListener("click", closeCustomerModal);

customerModal.addEventListener("click", event => {
  if (event.target === customerModal) closeCustomerModal();
});

$("#customerForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#customerName").value.trim();
  const email = $("#customerEmail").value.trim();

  if (!name || !email) return;

  if (customers.some(c => c.email.toLowerCase() === email.toLowerCase())) {
    showToast("This customer email already exists.");
    return;
  }

  customers.push({ name, email, joined: today });

  saveData();
  renderCustomers();
  closeCustomerModal();

  showToast("Customer added successfully!");
});

// -------------------------------
// CHART DATA
// -------------------------------

const chartData = {
  week: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [1.2, 2.1, 1.8, 3.5, 2.9, 4.4, 5.1]
  },
  month: {
    labels: ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31"],
    values: [2.1, 3.2, 2.8, 4.3, 3.7, 5.5, 4.8, 6.3, 5.9, 8.1, 8.4]
  },
  year: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    values: [2.5, 3.1, 2.8, 4.2, 3.9, 5.1, 4.8, 6.2, 5.8, 7.1, 8.4, 8.8]
  }
};

// -------------------------------
// CANVAS CHART
// -------------------------------

function drawChart(canvas, labels, values) {
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();

  if (!rect.width || !rect.height) return;

  const dpr = window.devicePixelRatio || 1;
  const width = rect.width;
  const height = rect.height;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const left = 8;
  const right = 8;
  const top = 12;
  const bottom = 25;

  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = 10;

  ctx.clearRect(0, 0, width, height);

  // Horizontal grid lines
  ctx.strokeStyle = "#edf0f4";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = top + (chartHeight / 4) * i;

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(width - right, y);
    ctx.stroke();
  }

  const points = values.map((value, index) => ({
    x: left + (chartWidth / Math.max(values.length - 1, 1)) * index,
    y: top + chartHeight - (value / maxValue) * chartHeight
  }));

  // Gradient area
  const gradient = ctx.createLinearGradient(0, top, 0, height);

  gradient.addColorStop(0, "rgba(198, 156, 84, 0.24)");
  gradient.addColorStop(1, "rgba(198, 156, 84, 0)");

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  points.forEach(point => ctx.lineTo(point.x, point.y));

  ctx.lineTo(points[points.length - 1].x, top + chartHeight);
  ctx.lineTo(points[0].x, top + chartHeight);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  // Chart line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  points.forEach(point => ctx.lineTo(point.x, point.y));

  ctx.strokeStyle = "#bc914d";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  // Points
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#bc914d";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // X axis labels
  ctx.fillStyle = "#929baa";
  ctx.font = "10px Arial";
  ctx.textAlign = "center";

  labels.forEach((label, index) => {
    const x = left + (chartWidth / Math.max(labels.length - 1, 1)) * index;
    ctx.fillText(label, x, height - 6);
  });
}

function drawRevenueChart() {
  const period = $("#chartPeriod").value;
  const data = chartData[period];

  drawChart($("#revenueChart"), data.labels, data.values);
}

function drawAnalyticsChart() {
  drawChart(
    $("#analyticsChart"),
    chartData.year.labels,
    chartData.year.values
  );
}

$("#chartPeriod").addEventListener("change", drawRevenueChart);

// -------------------------------
// SETTINGS
// -------------------------------

$("#settingsForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("#businessName").value.trim();

  if (!name) {
    showToast("Please enter a business name.");
    return;
  }

  $(".workspace strong").textContent = name;

  localStorage.setItem("nexusBusinessName", name);

  showToast("Workspace settings saved!");
});

const savedBusinessName = localStorage.getItem("nexusBusinessName");

if (savedBusinessName) {
  $("#businessName").value = savedBusinessName;
  $(".workspace strong").textContent = savedBusinessName;
}

// -------------------------------
// KEYBOARD MODAL SUPPORT
// -------------------------------

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeTransactionModal();
    closeCustomerModal();
    $("#sidebar").classList.remove("open");
  }
});

// -------------------------------
// INITIALIZE DASHBOARD
// -------------------------------

function initializeDashboard() {
  renderTransactions();
  renderCustomers();
  drawRevenueChart();
  refreshIcons();
}

initializeDashboard();

window.addEventListener("resize", () => {
  drawRevenueChart();

  if ($("#analytics").classList.contains("active")) {
    drawAnalyticsChart();
  }
});
