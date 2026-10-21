import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFmtpZA4ueTihgr2CfwrJ5Ww2E8Qm6_OY",
  authDomain: "admin-fikra.firebaseapp.com",
  projectId: "admin-fikra",
  storageBucket: "admin-fikra.firebasestorage.app",
  messagingSenderId: "671871265133",
  appId: "1:671871265133:web:e5e7350bc119b455151264",
  measurementId: "G-SBHDJJPER0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Persistence error:", err);
});

// --------------------------------------------------------
// 1. Admin functions
// --------------------------------------------------------
window.loginAdmin = async function () {
  console.log("[FIKRA Admin] loginAdmin called");

  const emailEl = document.getElementById("adminEmail");
  const passEl = document.getElementById("adminPassword");
  const loginBtn = document.getElementById("adminLoginBtn");

  if (!emailEl || !passEl) {
    alert("عناصر الفورم مش موجودة. رفرش الصفحة.");
    return;
  }

  const email = emailEl.value.trim();
  const pass = passEl.value.trim();

  if (!email || !pass) {
    alert("يرجى كتابة البريد الإلكتروني وكلمة المرور!");
    return;
  }

  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.style.opacity = "0.7";
    loginBtn.innerText = "جاري الدخول...";
  }

  try {
    console.log("[FIKRA Admin] Calling signInWithEmailAndPassword...");

    const loginPromise = signInWithEmailAndPassword(auth, email, pass);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), 15000);
    });

    await Promise.race([loginPromise, timeoutPromise]);

    console.log("[FIKRA Admin] Login success");
    setTimeout(() => {
      alert("تم تسجيل الدخول بنجاح كـ Admin!");
    }, 300);
  } catch (err) {
    console.error("[FIKRA Admin] Login Error:", err);

    let msg = "حدث خطأ أثناء الدخول. حاول مرة أخرى.";

    if (err.message === "TIMEOUT") {
      msg = "انتهت مهلة الاتصال (15 ثانية).\n\nتأكد من الإنترنت.\nلو بتشتغل من دولة بتحجب Google → جرب VPN.";
    } else if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(err.code)) {
      msg = "بيانات الدخول غير صحيحة. تأكد من الإيميل والباسورد.";
    } else if (err.code === "auth/too-many-requests") {
      msg = "تم حظر المحاولات مؤقتاً. استنى دقيقة وجرب تاني.";
    } else if (err.code === "auth/network-request-failed") {
      msg = "مشكلة في الشبكة أو Firebase محجوب. جرب VPN.";
    } else if (err.code === "auth/operation-not-allowed") {
      msg = "تسجيل الدخول بالإيميل مش مفعل في Firebase Console.";
    } else if (err.message) {
      msg = "خطأ: " + err.message;
    }

    alert(msg);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.style.opacity = "1";
      loginBtn.innerText = "تسجيل الدخول";
    }
  }
};

window.logoutAdmin = async function () {
  try {
    await signOut(auth);
    const modal = document.getElementById("adminModal");
    if (modal) modal.style.display = "none";
    alert("تم تسجيل الخروج بنجاح");
  } catch (err) {
    console.error("Logout Error:", err);
    alert("حصل خطأ أثناء الخروج");
  }
};

// --------------------------------------------------------
// 2. Safe button binding
// --------------------------------------------------------
window.forceBindButtons = function forceBindButtons() {
  console.log("[FIKRA Admin] forceBindButtons running");

  const loginBtn = document.getElementById("adminLoginBtn");
  if (loginBtn) {
    const newLoginBtn = loginBtn.cloneNode(true);
    loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
    newLoginBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("[FIKRA Admin] Login button clicked");
      window.loginAdmin();
    });
  }

  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    newLogoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.logoutAdmin();
    });
  }

  const bindClick = (id, fn) => {
    const el = document.getElementById(id);
    if (el && typeof fn === "function") {
      el.onclick = null;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        fn();
      });
    }
  };

  bindClick("saveLinkBtn", window.saveProjectUrl);
  bindClick("savePricesBtn", window.savePrices);
  bindClick("addTickerBtn", window.addTickerItem);
  bindClick("addCardBtn", window.addNewPortfolioCard);

  const projectSelect = document.getElementById("projectSelect");
  if (projectSelect) {
    projectSelect.onchange = null;
    projectSelect.addEventListener("change", window.loadCurrentProjectUrl);
  }

  document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.onclick = null;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = e.currentTarget.getAttribute("data-tab");
      if (tabId) window.showAdminTab(tabId);
    });
  });
};

// --------------------------------------------------------
// 3. Data & UI
// --------------------------------------------------------
window.siteData = {
  projectUrls: {
    project1: "https://fikra2website.github.io/menu-fikra/",
    project2: "https://example.com/project2",
    project3: "https://example.com/project3",
    project4: "https://example.com/project4",
    project5: "https://personal-university-dashboad.vercel.app/"
  },
  prices: { price1: "", price2: "", price3: "" },
  tickerItems: ["موبايل أولاً", "UI / UX", "من الفكرة للصفحة", "FIKRA", "ويب ديزاين", "فرونت إند", "صفحات هبوط"],
  customCards: []
};

async function loadSiteData() {
  try {
    const docRef = doc(db, "settings", "site_content");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      window.siteData = { ...window.siteData, ...docSnap.data() };
    }
  } catch (err) {
    console.log("Using default data", err);
  }
  renderAllData();
}

window.showAdminTab = function (tabId) {
  document.querySelectorAll(".admin-tab-content").forEach((el) => el.style.display = "none");
  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.style.display = "block";
};

window.loadCurrentProjectUrl = function () {
  const select = document.getElementById("projectSelect");
  const input = document.getElementById("newProjectUrl");
  if (select && input && window.siteData.projectUrls) {
    input.value = window.siteData.projectUrls[select.value] || "";
  }
};

window.saveProjectUrl = async function () {
  const select = document.getElementById("projectSelect");
  const input = document.getElementById("newProjectUrl");
  if (!select || !input) return;
  window.siteData.projectUrls[select.value] = input.value.trim();
  await saveDataToFirestore("تم حفظ التعديل للرابط بنجاح!");
};

window.savePrices = async function () {
  window.siteData.prices = {
    price1: (document.getElementById("price1Input") || {}).value?.trim() || "",
    price2: (document.getElementById("price2Input") || {}).value?.trim() || "",
    price3: (document.getElementById("price3Input") || {}).value?.trim() || ""
  };
  await saveDataToFirestore("تم تحديث الأسعار بنجاح!");
};

window.addTickerItem = async function () {
  const input = document.getElementById("newTickerInput");
  const text = input ? input.value.trim() : "";
  if (!text) return;
  if (!window.siteData.tickerItems) window.siteData.tickerItems = [];
  window.siteData.tickerItems.push(text);
  if (input) input.value = "";
  await saveDataToFirestore("تمت إضافة العبارة للشريط بنجاح!");
};

window.addNewPortfolioCard = async function () {
  const title = (document.getElementById("newCardTitle") || {}).value?.trim() || "";
  const desc = (document.getElementById("newCardDesc") || {}).value?.trim() || "";
  const url = (document.getElementById("newCardUrl") || {}).value?.trim() || "";
  const icon = (document.getElementById("newCardIcon") || {}).value?.trim() || "";

  if (!title || !url) {
    alert("يرجى إدخال العنوان والرابط على الأقل");
    return;
  }

  if (!window.siteData.customCards) window.siteData.customCards = [];
  window.siteData.customCards.push({
    id: Date.now(),
    title, desc, url,
    icon: icon || "fa-solid fa-globe"
  });

  ["newCardTitle", "newCardDesc", "newCardUrl", "newCardIcon"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  await saveDataToFirestore("تمت إضافة المشروع الجديد بنجاح!");
};

async function saveDataToFirestore(msg) {
  try {
    await setDoc(doc(db, "settings", "site_content"), window.siteData, { merge: true });
    renderAllData();
    alert(msg);
  } catch (err) {
    console.error("Save Error:", err);
    alert("حدث خطأ أثناء الحفظ");
  }
}

function renderAllData() {
  ["price1", "price2", "price3"].forEach((key, index) => {
    const el = document.getElementById(`price-tag-${index + 1}`);
    const val = window.siteData.prices ? window.siteData.prices[key] : "";
    if (el) {
      if (val && val.trim() !== "") {
        el.innerText = val;
        el.style.display = "block";
      } else {
        el.style.display = "none";
      }
    }
  });

  const container = document.getElementById("tickerContainer");
  if (container && window.siteData.tickerItems) {
    const items = window.siteData.tickerItems;
    let html = "";
    [...items, ...items].forEach((item) => {
      html += `<div class="ticker-item">${item}</div>`;
    });
    container.innerHTML = html;
  }

  const grid = document.getElementById("portfolioGrid");
  if (grid && window.siteData.customCards) {
    window.siteData.customCards.forEach((card) => {
      if (!document.getElementById(`custom-card-${card.id}`)) {
        const cardDiv = document.createElement("div");
        cardDiv.className = "portfolio-card";
        cardDiv.id = `custom-card-${card.id}`;
        cardDiv.onclick = () => {
          document.getElementById("modalTitle").innerHTML = card.title;
          document.getElementById("modalDesc").innerHTML = card.desc;
          document.getElementById("modalLink").href = card.url;
          document.getElementById("projectModal").style.display = "flex";
        };
        cardDiv.innerHTML = `
          <div class="portfolio-img"><i class="${card.icon || "fa-solid fa-globe"}"></i></div>
          <div class="portfolio-info"><h3>${card.title}</h3><p>${card.desc}</p></div>
        `;
        grid.appendChild(cardDiv);
      }
    });
  }
}

onAuthStateChanged(auth, (user) => {
  console.log("[FIKRA Admin] Auth state:", user ? user.email : "none");

  const loginForm = document.getElementById("adminLoginForm");
  const dashboard = document.getElementById("adminDashboard");
  const badge = document.getElementById("adminLogoBadge");
  const quickBtn = document.getElementById("adminQuickBtn");
  const emailText = document.getElementById("adminUserEmail");
  
  const welcomeMsg = document.getElementById("adminWelcomeMsg");
  const adminFirstNameEl = document.getElementById("adminFirstName");

  if (user) {
    if (loginForm) loginForm.style.display = "none";
    if (dashboard) dashboard.style.display = "block";
    if (badge) badge.style.display = "inline-flex";
    if (quickBtn) quickBtn.style.display = "inline-block";
    if (emailText) emailText.innerText = user.email;

    if (welcomeMsg && adminFirstNameEl) {
      let emailPrefix = user.email.split('@')[0];
      let firstName = emailPrefix.split('-')[0];
      adminFirstNameEl.innerText = firstName;
      welcomeMsg.style.display = "inline-block";
    }

    window.loadCurrentProjectUrl();
    if (window.siteData?.prices) {
      ["price1", "price2", "price3"].forEach((key, i) => {
        const el = document.getElementById(`price${i+1}Input`);
        if (el) el.value = window.siteData.prices[key] || "";
      });
    }
  } else {
    if (loginForm) loginForm.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
    if (badge) badge.style.display = "none";
    if (quickBtn) quickBtn.style.display = "none";
    
    if (welcomeMsg) welcomeMsg.style.display = "none";
  }
});

function initAdmin() {
  console.log("[FIKRA Admin] initAdmin");
  window.forceBindButtons();
  loadSiteData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdmin);
} else {
  initAdmin();
}

setTimeout(window.forceBindButtons, 1000);
setTimeout(window.forceBindButtons, 2500);
