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

// Translation API Helper
window.autoTrans = async function(sourceId, targetId) {
    const text = document.getElementById(sourceId).value;
    if (!text) return;
    const target = document.getElementById(targetId);
    target.value = "جاري الترجمة آلياً...";
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`);
        const data = await res.json();
        if(data && data.responseData && data.responseData.translatedText) {
            target.value = data.responseData.translatedText;
        } else { target.value = text; }
    } catch(e) { target.value = text; console.error("Error: ", e); }
};

window.loginAdmin = async function () {
  const emailEl = document.getElementById("adminEmail");
  const passEl = document.getElementById("adminPassword");
  const loginBtn = document.getElementById("adminLoginBtn");
  if (!emailEl || !passEl) return;
  const email = emailEl.value.trim();
  const pass = passEl.value.trim();
  if (!email || !pass) return alert("يرجى كتابة البريد الإلكتروني وكلمة المرور!");

  if (loginBtn) { loginBtn.disabled = true; loginBtn.style.opacity = "0.7"; loginBtn.innerText = "جاري الدخول..."; }

  try {
    const loginPromise = signInWithEmailAndPassword(auth, email, pass);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 15000));
    await Promise.race([loginPromise, timeoutPromise]);
    setTimeout(() => { alert("تم تسجيل الدخول بنجاح كـ Admin!"); }, 300);
  } catch (err) {
    let msg = "حدث خطأ أثناء الدخول.";
    if (err.message === "TIMEOUT") msg = "انتهت مهلة الاتصال.";
    else if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(err.code)) msg = "بيانات غير صحيحة.";
    alert(msg);
  } finally {
    if (loginBtn) { loginBtn.disabled = false; loginBtn.style.opacity = "1"; loginBtn.innerText = "تسجيل الدخول"; }
  }
};

window.logoutAdmin = async function () {
  try {
    await signOut(auth);
    const modal = document.getElementById("adminModal");
    if (modal) modal.style.display = "none";
    alert("تم تسجيل الخروج بنجاح");
  } catch (err) { alert("حصل خطأ أثناء الخروج"); }
};

window.switchAdminMode = function(mode) {
    const createContainer = document.getElementById('create-mode-container');
    const editContainer = document.getElementById('edit-mode-container');
    const createBtn = document.getElementById('modeCreateBtn');
    const editBtn = document.getElementById('modeEditBtn');

    document.querySelectorAll(".admin-tab-content").forEach((el) => el.style.display = "none");

    if(mode === 'create') {
        createContainer.style.display = 'block';
        editContainer.style.display = 'none';
        createBtn.className = 'btn-primary'; createBtn.style.border = 'none';
        editBtn.className = 'btn-outline'; editBtn.style.border = '1px solid var(--neon-lavender)'; editBtn.style.color = 'white';
        window.showAdminTab('tab-new-card'); 
    } else {
        createContainer.style.display = 'none';
        editContainer.style.display = 'block';
        createBtn.className = 'btn-outline'; createBtn.style.border = '1px solid var(--neon-lavender)'; createBtn.style.color = 'white';
        editBtn.className = 'btn-primary'; editBtn.style.border = 'none';
        window.populateEditDropdowns();
        window.populateTickerManager();
        window.showAdminTab('tab-edit-texts'); 
    }
};

window.forceBindButtons = function () {
  const loginBtn = document.getElementById("adminLoginBtn");
  if (loginBtn) {
    const newLoginBtn = loginBtn.cloneNode(true);
    loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
    newLoginBtn.addEventListener("click", (e) => { e.preventDefault(); window.loginAdmin(); });
  }

  const logoutBtn = document.getElementById("adminLogoutBtn");
  if (logoutBtn) {
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    newLogoutBtn.addEventListener("click", (e) => { e.preventDefault(); window.logoutAdmin(); });
  }

  const bindClick = (id, fn) => {
    const el = document.getElementById(id);
    if (el && typeof fn === "function") { el.onclick = null; el.addEventListener("click", (e) => { e.preventDefault(); fn(); }); }
  };

  bindClick("saveLinkBtn", window.saveProjectUrl);
  bindClick("savePricesBtn", window.savePrices);
  bindClick("addTickerBtn", window.addTickerItem);
  bindClick("addCardBtn", window.addNewPortfolioCard);
  bindClick("addFeatureBtn", window.addCustomFeature);
  bindClick("addServiceBtn", window.addCustomService);
  bindClick("addPackageBtn", window.addCustomPackage);

  document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.onclick = null;
    btn.addEventListener("click", (e) => { e.preventDefault(); const tabId = e.currentTarget.getAttribute("data-tab"); if (tabId) window.showAdminTab(tabId); });
  });
};

window.siteData = {
  projectUrls: { project1: "", project2: "", project3: "", project4: "", project5: "" },
  prices: { price1: "", price2: "", price3: "" },
  tickerItemsArray: [], // New structured format [{id, ar, en, visible}]
  customCards: [],
  customFeatures: [],
  customServices: [],
  customPackages: [],
  siteTexts: {}, // For overriding texts like hero-title
  origProjects: {} // Overrides for orig 5 projects
};

async function loadSiteData() {
  try {
    const docRef = doc(db, "settings", "site_content");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      window.siteData = { ...window.siteData, ...docSnap.data() };
      
      // Migration for old ticker array if it exists
      if(window.siteData.tickerItems && !window.siteData.tickerItemsArray) {
          window.siteData.tickerItemsArray = window.siteData.tickerItems.map(t => ({id: Date.now()+Math.random(), ar: t, en: t, visible: true}));
      }
      if(!window.siteData.tickerItemsArray || window.siteData.tickerItemsArray.length === 0) {
          const def = ["موبايل أولاً", "UI / UX", "من الفكرة للصفحة", "FIKRA", "ويب ديزاين", "فرونت إند", "صفحات هبوط"];
          const defEn = ["Mobile First", "UI / UX", "Idea to Page", "FIKRA", "Web Design", "Front End", "Landing Pages"];
          window.siteData.tickerItemsArray = def.map((t,i) => ({id: Date.now()+i, ar: t, en: defEn[i], visible: true}));
      }
      
    }
  } catch (err) { console.log("Using default data"); }
  
  if(typeof window.reRenderTexts === 'function') window.reRenderTexts();
  renderAllData();
}

window.showAdminTab = function (tabId) {
  document.querySelectorAll(".admin-tab-content").forEach((el) => el.style.display = "none");
  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.style.display = "block";
};

// ---------------------------------------------------------------------------------
// New Editing Logic (Site Texts, Orig Projects, Custom Items toggles)
// ---------------------------------------------------------------------------------

// Edit Site Texts
window.loadEditText = function() {
    const key = document.getElementById("textKeySelect").value;
    if(!key) return;
    
    // Check if overridden, else get default from UI
    if(window.siteData.siteTexts && window.siteData.siteTexts[key]) {
        document.getElementById("textArVal").value = window.siteData.siteTexts[key].ar || "";
        document.getElementById("textEnVal").value = window.siteData.siteTexts[key].en || "";
    } else {
        if(window.translations) {
            document.getElementById("textArVal").value = window.translations.ar[key] || "";
            document.getElementById("textEnVal").value = window.translations.en[key] || "";
        }
    }
};

window.saveEditText = async function() {
    const key = document.getElementById("textKeySelect").value;
    if(!key) return alert("اختر نص أولاً!");
    
    if(!window.siteData.siteTexts) window.siteData.siteTexts = {};
    window.siteData.siteTexts[key] = {
        ar: document.getElementById("textArVal").value.trim(),
        en: document.getElementById("textEnVal").value.trim()
    };
    
    if(typeof window.reRenderTexts === 'function') window.reRenderTexts();
    await saveDataToFirestore("تم تحديث النص الأساسي بنجاح!");
};

// Edit Orig Projects (1-5)
window.loadEditOrigProject = function() {
    const pKey = document.getElementById("origProjectSelect").value;
    if(!pKey) return;
    
    if(!window.siteData.origProjects) window.siteData.origProjects = {};
    let op = window.siteData.origProjects[pKey];
    
    // Extract ID num for default translation keys
    let num = pKey.replace('project', '');
    
    document.getElementById("origProjVisible").checked = op && op.visible === false ? false : true;
    
    document.getElementById("origProjArTitle").value = op && op.arTitle ? op.arTitle : (window.translations.ar[`port-c${num}-h`]||"");
    document.getElementById("origProjEnTitle").value = op && op.enTitle ? op.enTitle : (window.translations.en[`port-c${num}-h`]||"");
    
    document.getElementById("origProjArDesc").value = op && op.arDesc ? op.arDesc : (window.translations.ar[`modal-${num}-desc`]||"");
    document.getElementById("origProjEnDesc").value = op && op.enDesc ? op.enDesc : (window.translations.en[`modal-${num}-desc`]||"");
    
    document.getElementById("origProjUrl").value = op && op.url ? op.url : (window.siteData.projectUrls[pKey]||"");
};

window.saveEditOrigProject = async function() {
    const pKey = document.getElementById("origProjectSelect").value;
    if(!pKey) return alert("اختر مشروع أولاً");
    
    if(!window.siteData.origProjects) window.siteData.origProjects = {};
    window.siteData.origProjects[pKey] = {
        visible: document.getElementById("origProjVisible").checked,
        arTitle: document.getElementById("origProjArTitle").value.trim(),
        enTitle: document.getElementById("origProjEnTitle").value.trim(),
        arDesc: document.getElementById("origProjArDesc").value.trim(),
        enDesc: document.getElementById("origProjEnDesc").value.trim(),
        url: document.getElementById("origProjUrl").value.trim()
    };
    
    if(typeof window.reRenderTexts === 'function') window.reRenderTexts();
    await saveDataToFirestore("تم تحديث إعدادات المشروع الأساسي بنجاح!");
};

// Edit Custom Items Logic
window.populateEditDropdowns = function() {
    const cardSelect = document.getElementById('editCardSelect');
    if(cardSelect) {
        cardSelect.innerHTML = '<option value="">-- اختر نموذج --</option>';
        if(window.siteData.customCards) {
            window.siteData.customCards.forEach(c => cardSelect.innerHTML += `<option value="${c.id}">${c.title}</option>`);
        }
    }
    const pkgSelect = document.getElementById('editPkgSelect');
    if(pkgSelect) {
        pkgSelect.innerHTML = '<option value="">-- اختر باقة --</option>';
        if(window.siteData.customPackages) {
            window.siteData.customPackages.forEach(p => pkgSelect.innerHTML += `<option value="${p.id}">${p.ar.title}</option>`);
        }
    }
};

window.loadEditCard = function() {
    const id = document.getElementById("editCardSelect").value;
    if(!id) return;
    const card = window.siteData.customCards.find(c => c.id == id);
    if(card) {
        document.getElementById("editCardVisible").checked = card.visible !== false;
        document.getElementById("editCardTitle").value = card.title;
        document.getElementById("editCardDesc").value = card.desc;
        document.getElementById("editCardUrl").value = card.url;
        document.getElementById("editCardIcon").value = card.icon;
    }
};

window.saveEditCard = async function() {
    const id = document.getElementById("editCardSelect").value;
    if(!id) return alert("اختر نموذج أولاً");
    const index = window.siteData.customCards.findIndex(c => c.id == id);
    if(index > -1) {
        window.siteData.customCards[index].visible = document.getElementById("editCardVisible").checked;
        window.siteData.customCards[index].title = document.getElementById("editCardTitle").value.trim();
        window.siteData.customCards[index].desc = document.getElementById("editCardDesc").value.trim();
        window.siteData.customCards[index].url = document.getElementById("editCardUrl").value.trim();
        window.siteData.customCards[index].icon = document.getElementById("editCardIcon").value.trim();
        await saveDataToFirestore("تم حفظ التعديلات للنموذج بنجاح!");
    }
};

window.deleteCustomCard = async function() {
    const id = document.getElementById("editCardSelect").value;
    if(!id) return alert("اختر نموذج أولاً");
    if(confirm("متأكد من حذف هذا النموذج نهائياً؟")) {
        window.siteData.customCards = window.siteData.customCards.filter(c => c.id != id);
        window.populateEditDropdowns();
        await saveDataToFirestore("تم حذف النموذج!");
    }
}

window.loadEditPkg = function() {
    const id = document.getElementById("editPkgSelect").value;
    if(!id) return;
    const pkg = window.siteData.customPackages.find(p => p.id == id);
    if(pkg) {
        document.getElementById("editPkgVisible").checked = pkg.visible !== false;
        document.getElementById("editPkgArTitle").value = pkg.ar.title;
        document.getElementById("editPkgEnTitle").value = pkg.en.title;
        document.getElementById("editPkgArSub").value = pkg.ar.sub;
        document.getElementById("editPkgEnSub").value = pkg.en.sub;
        document.getElementById("editPkgArDesc").value = pkg.ar.desc;
        document.getElementById("editPkgEnDesc").value = pkg.en.desc;
        document.getElementById("editPkgArFeat").value = pkg.ar.features.join(', ');
        document.getElementById("editPkgEnFeat").value = pkg.en.features.join(', ');
        document.getElementById("editPkgPrice").value = pkg.price || "";
    }
};

window.saveEditPkg = async function() {
    const id = document.getElementById("editPkgSelect").value;
    if(!id) return alert("اختر باقة أولاً");
    const index = window.siteData.customPackages.findIndex(p => p.id == id);
    if(index > -1) {
        window.siteData.customPackages[index].visible = document.getElementById("editPkgVisible").checked;
        window.siteData.customPackages[index].ar.title = document.getElementById("editPkgArTitle").value.trim();
        window.siteData.customPackages[index].en.title = document.getElementById("editPkgEnTitle").value.trim();
        window.siteData.customPackages[index].ar.sub = document.getElementById("editPkgArSub").value.trim();
        window.siteData.customPackages[index].en.sub = document.getElementById("editPkgEnSub").value.trim();
        window.siteData.customPackages[index].ar.desc = document.getElementById("editPkgArDesc").value.trim();
        window.siteData.customPackages[index].en.desc = document.getElementById("editPkgEnDesc").value.trim();
        window.siteData.customPackages[index].ar.features = document.getElementById("editPkgArFeat").value.split(',').map(f=>f.trim());
        window.siteData.customPackages[index].en.features = document.getElementById("editPkgEnFeat").value.split(',').map(f=>f.trim());
        window.siteData.customPackages[index].price = document.getElementById("editPkgPrice").value.trim();
        await saveDataToFirestore("تم حفظ التعديلات للباقة بنجاح!");
    }
};

window.deleteCustomPkg = async function() {
    const id = document.getElementById("editPkgSelect").value;
    if(!id) return alert("اختر باقة أولاً");
    if(confirm("متأكد من حذف الباقة نهائياً؟")) {
        window.siteData.customPackages = window.siteData.customPackages.filter(p => p.id != id);
        window.populateEditDropdowns();
        await saveDataToFirestore("تم حذف الباقة!");
    }
}

// ---------------------------------------------------------------------------------
// Ticker Management Logic
// ---------------------------------------------------------------------------------
window.addTickerItem = async function () {
  const ar = document.getElementById("newTickerAr").value.trim();
  const en = document.getElementById("newTickerEn").value.trim() || ar;
  if (!ar) return alert("اكتب العبارة بالعربي على الأقل!");
  
  if (!window.siteData.tickerItemsArray) window.siteData.tickerItemsArray = [];
  window.siteData.tickerItemsArray.push({ id: Date.now(), ar, en, visible: true });
  
  document.getElementById("newTickerAr").value = "";
  document.getElementById("newTickerEn").value = "";
  
  await saveDataToFirestore("تمت إضافة العبارة للشريط بنجاح!");
};

window.populateTickerManager = function() {
    const list = document.getElementById("tickerManageList");
    if(!list) return;
    list.innerHTML = "";
    if(!window.siteData.tickerItemsArray) return;
    
    window.siteData.tickerItemsArray.forEach(t => {
        let div = document.createElement("div");
        div.className = "ticker-item-manage";
        div.innerHTML = `
            <div style="flex:1;">
                <p style="margin:0; font-size:14px; font-weight:bold; color:var(--text-light);">${t.ar}</p>
                <p style="margin:0; font-size:12px; color:var(--text-muted);">${t.en}</p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <input type="checkbox" onchange="window.toggleTickerItem(${t.id}, this.checked)" ${t.visible ? 'checked' : ''}> ظاهر
                <button class="btn-outline" style="padding:4px 10px; border-color:#ef4444; color:#ef4444;" onclick="window.deleteTickerItem(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        list.appendChild(div);
    });
}

window.toggleTickerItem = async function(id, state) {
    const idx = window.siteData.tickerItemsArray.findIndex(t => t.id == id);
    if(idx > -1) {
        window.siteData.tickerItemsArray[idx].visible = state;
        await saveDataToFirestore("تم تعديل حالة الظهور للشريط");
    }
}
window.deleteTickerItem = async function(id) {
    if(confirm("حذف العبارة من الشريط؟")) {
        window.siteData.tickerItemsArray = window.siteData.tickerItemsArray.filter(t => t.id != id);
        window.populateTickerManager();
        await saveDataToFirestore("تم الحذف من الشريط");
    }
}

window.renderTicker = function() {
    const container = document.getElementById("tickerContainer");
    if (container && window.siteData.tickerItemsArray) {
        let html = "";
        const lang = document.documentElement.getAttribute("lang") || "ar";
        const visibleItems = window.siteData.tickerItemsArray.filter(t => t.visible !== false);
        
        [...visibleItems, ...visibleItems, ...visibleItems].forEach((item) => {
            let txt = lang === 'ar' ? item.ar : item.en;
            html += `<div class="ticker-item">${txt}</div>`;
        });
        container.innerHTML = html;
    }
}

// ---------------------------------------------------------------------------------
// Adding New Custom Data (Features, Services, Packages)
// ---------------------------------------------------------------------------------
window.addNewPortfolioCard = async function () {
  const title = (document.getElementById("newCardTitle") || {}).value?.trim() || "";
  const desc = (document.getElementById("newCardDesc") || {}).value?.trim() || "";
  const url = (document.getElementById("newCardUrl") || {}).value?.trim() || "";
  const icon = (document.getElementById("newCardIcon") || {}).value?.trim() || "";
  if (!title) return alert("يرجى إدخال العنوان");
  if (!window.siteData.customCards) window.siteData.customCards = [];
  window.siteData.customCards.push({ id: Date.now(), title, desc, url, icon: icon || "fa-solid fa-globe", visible: true });
  ["newCardTitle", "newCardDesc", "newCardUrl", "newCardIcon"].forEach(id => { const el = document.getElementById(id); if(el) el.value = ""; });
  await saveDataToFirestore("تمت إضافة المشروع الجديد بنجاح!");
};

window.addCustomFeature = async function () {
  const arTitle = document.getElementById("featArTitle").value.trim();
  const enTitle = document.getElementById("featEnTitle").value.trim() || arTitle;
  const arDesc = document.getElementById("featArDesc").value.trim();
  const enDesc = document.getElementById("featEnDesc").value.trim() || arDesc;
  const icon = document.getElementById("featIcon").value.trim() || "fa-solid fa-star";
  if(!arTitle || !arDesc) return alert("يرجى إدخال العنوان والوصف بالعربي على الأقل!");
  
  if (!window.siteData.customFeatures) window.siteData.customFeatures = [];
  window.siteData.customFeatures.push({ id: Date.now(), icon, visible: true, ar: { title: arTitle, desc: arDesc }, en: { title: enTitle, desc: enDesc } });
  ["featArTitle","featEnTitle","featArDesc","featEnDesc","featIcon"].forEach(id => document.getElementById(id).value = "");
  await saveDataToFirestore("تمت إضافة الميزة بنجاح!");
};

window.addCustomService = async function () {
  const arTitle = document.getElementById("srvArTitle").value.trim();
  const enTitle = document.getElementById("srvEnTitle").value.trim() || arTitle;
  const arDesc = document.getElementById("srvArDesc").value.trim();
  const enDesc = document.getElementById("srvEnDesc").value.trim() || arDesc;
  const num = document.getElementById("srvNum").value.trim() || "05";
  if(!arTitle || !arDesc) return alert("يرجى إدخال العنوان والوصف بالعربي على الأقل!");
  
  if (!window.siteData.customServices) window.siteData.customServices = [];
  window.siteData.customServices.push({ id: Date.now(), num, visible: true, ar: { title: arTitle, desc: arDesc }, en: { title: enTitle, desc: enDesc } });
  ["srvArTitle","srvEnTitle","srvArDesc","srvEnDesc","srvNum"].forEach(id => document.getElementById(id).value = "");
  await saveDataToFirestore("تمت إضافة الخدمة بنجاح!");
};

window.addCustomPackage = async function () {
  const arTitle = document.getElementById("pkgArTitle").value.trim();
  const enTitle = document.getElementById("pkgEnTitle").value.trim() || arTitle;
  const arSub = document.getElementById("pkgArSub").value.trim();
  const enSub = document.getElementById("pkgEnSub").value.trim() || arSub;
  const arDesc = document.getElementById("pkgArDesc").value.trim();
  const enDesc = document.getElementById("pkgEnDesc").value.trim() || arDesc;
  const arFeat = document.getElementById("pkgArFeat").value.trim();
  const enFeat = document.getElementById("pkgEnFeat").value.trim() || arFeat;
  const price = document.getElementById("pkgPrice").value.trim();
  
  if(!arTitle || !arDesc || !arFeat) return alert("البيانات العربية الأساسية مطلوبة!");
  
  if (!window.siteData.customPackages) window.siteData.customPackages = [];
  window.siteData.customPackages.push({
      id: Date.now(), price, visible: true,
      ar: { title: arTitle, sub: arSub, desc: arDesc, features: arFeat.split(',').map(f => f.trim()) },
      en: { title: enTitle, sub: enSub, desc: enDesc, features: enFeat.split(',').map(f => f.trim()) }
  });
  ["pkgArTitle","pkgEnTitle","pkgArSub","pkgEnSub","pkgArDesc","pkgEnDesc","pkgArFeat","pkgEnFeat","pkgPrice"].forEach(id => document.getElementById(id).value = "");
  await saveDataToFirestore("تمت إضافة الباقة بنجاح!");
};

// ---------------------------------------------------------------------------------
// Render Engine (Handles Visiblity Flags)
// ---------------------------------------------------------------------------------
async function saveDataToFirestore(msg) {
  try {
    await setDoc(doc(db, "settings", "site_content"), window.siteData, { merge: true });
    renderAllData();
    alert(msg);
  } catch (err) { console.error("Save Error:", err); alert("حدث خطأ أثناء الحفظ"); }
}

function renderAllData() {
  const currentLang = document.documentElement.getAttribute("lang") || "ar";

  // Orig Projects Visibility & Overrides
  for(let i=1; i<=5; i++) {
      let pKey = "project"+i;
      let el = document.getElementById(`orig-project${i}`);
      if(el) {
          if(window.siteData.origProjects && window.siteData.origProjects[pKey] && window.siteData.origProjects[pKey].visible === false) {
              el.style.display = 'none';
          } else { el.style.display = 'block'; }
      }
  }

  // Ticker (Calls the dedicated function)
  window.renderTicker();

  // Projects / Portfolio Setup (Custom)
  const grid = document.getElementById("portfolioGrid");
  if (grid && window.siteData.customCards) {
    document.querySelectorAll('.custom-card-injected').forEach(e => e.remove());
    window.siteData.customCards.forEach((card) => {
        if(card.visible === false) return; // Skip rendering if hidden
        
        const cardDiv = document.createElement("div");
        cardDiv.className = "portfolio-card custom-card-injected";
        cardDiv.id = `custom-card-${card.id}`;
        cardDiv.onclick = () => {
          document.getElementById("modalTitle").innerHTML = card.title;
          document.getElementById("modalDesc").innerHTML = card.desc;
          if(document.getElementById("modalLink")) {
             document.getElementById("modalLink").href = card.url;
             document.getElementById("modalLink").style.display = card.url ? 'inline-block' : 'none';
          }
          document.getElementById("projectModal").style.display = "flex";
        };
        cardDiv.innerHTML = `<div class="portfolio-img"><i class="${card.icon || "fa-solid fa-globe"}"></i></div><div class="portfolio-info"><h3>${card.title}</h3><p>${card.desc}</p></div>`;
        grid.appendChild(cardDiv);
    });
  }

  // Features Setup
  const featGrid = document.getElementById("featuresGrid");
  if(featGrid && window.siteData.customFeatures) {
      document.querySelectorAll('.custom-feature').forEach(e => e.remove());
      window.siteData.customFeatures.forEach(feat => {
          if(feat.visible === false) return;
          const div = document.createElement('div');
          div.className = 'feature-card custom-feature';
          div.innerHTML = `
              <i class="${feat.icon} feature-icon"></i>
              <h3 class="dynamic-lang" data-ar="${feat.ar.title}" data-en="${feat.en.title}">${currentLang === 'ar' ? feat.ar.title : feat.en.title}</h3>
              <p class="dynamic-lang" data-ar="${feat.ar.desc}" data-en="${feat.en.desc}">${currentLang === 'ar' ? feat.ar.desc : feat.en.desc}</p>
          `;
          featGrid.appendChild(div);
      });
  }

  // Services Setup
  const srvGrid = document.getElementById("servicesGrid");
  if(srvGrid && window.siteData.customServices) {
      document.querySelectorAll('.custom-service').forEach(e => e.remove());
      window.siteData.customServices.forEach(srv => {
          if(srv.visible === false) return;
          const div = document.createElement('div');
          div.className = 'service-card custom-service';
          div.innerHTML = `
              <div class="num">${srv.num}</div>
              <h3 class="dynamic-lang" data-ar="${srv.ar.title}" data-en="${srv.en.title}">${currentLang === 'ar' ? srv.ar.title : srv.en.title}</h3>
              <p class="dynamic-lang" data-ar="${srv.ar.desc}" data-en="${srv.en.desc}">${currentLang === 'ar' ? srv.ar.desc : srv.en.desc}</p>
          `;
          srvGrid.appendChild(div);
      });
  }

  // Packages Setup
  const pkgGrid = document.getElementById("pricingGrid");
  if(pkgGrid && window.siteData.customPackages) {
      document.querySelectorAll('.custom-pkg').forEach(e => e.remove());
      window.siteData.customPackages.forEach(pkg => {
          if(pkg.visible === false) return;
          const div = document.createElement('div');
          div.className = 'pricing-card highlight custom-pkg';
          
          let featuresHTML = pkg.ar.features.map((f, i) => {
              let enF = pkg.en.features[i] || f;
              return `<li class="dynamic-lang" data-ar="${f}" data-en="${enF}">${currentLang === 'ar' ? f : enF}</li>`;
          }).join('');

          div.innerHTML = `
              <div class="custom-arrow"><i class="fa-solid fa-arrow-down"></i></div>
              <h3 class="dynamic-lang" data-ar="${pkg.ar.title}" data-en="${pkg.en.title}">${currentLang === 'ar' ? pkg.ar.title : pkg.en.title}</h3>
              <p class="dynamic-lang" data-ar="${pkg.ar.sub}" data-en="${pkg.en.sub}">${currentLang === 'ar' ? pkg.ar.sub : pkg.en.sub}</p>
              ${pkg.price ? `<div class="price-display-tag" style="display:block;">${pkg.price}</div>` : ''}
              <ul>${featuresHTML}</ul>
              <button class="btn-block" onclick="openPricingModal('m-title-${pkg.id}', 'm-desc-${pkg.id}')" style="background-color: var(--bg-color); color: var(--text-light);">
                  <span class="dynamic-lang" data-ar="تفاصيل (About)" data-en="Details (About)">${currentLang === 'ar' ? "تفاصيل (About)" : "Details (About)"}</span>
              </button>
          `;
          if(typeof window.translations !== 'undefined') {
              window.translations['ar'][`m-title-${pkg.id}`] = pkg.ar.title;
              window.translations['ar'][`m-desc-${pkg.id}`] = pkg.ar.desc;
              window.translations['en'][`m-title-${pkg.id}`] = pkg.en.title;
              window.translations['en'][`m-desc-${pkg.id}`] = pkg.en.desc;
          }
          pkgGrid.appendChild(div);
      });
  }
}

onAuthStateChanged(auth, (user) => {
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
  } else {
    if (loginForm) loginForm.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
    if (badge) badge.style.display = "none";
    if (quickBtn) quickBtn.style.display = "none";
    if (welcomeMsg) welcomeMsg.style.display = "none";
  }
});

function initAdmin() {
  window.forceBindButtons();
  loadSiteData();
}

if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", initAdmin); } 
else { initAdmin(); }

setTimeout(window.forceBindButtons, 1000);
