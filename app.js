// --- INITIAL THEME LOAD ---
(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    } else {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    }
})();

// --- STATE MANAGEMENT ---
let state = {
    isDemo: true,
    isRegistering: false,
    user: null,
    family: {
        id: 'demo-family',
        name: 'Oila Guruhi'
    },
    members: [],
    transactions: [],
    budgets: [],
    goals: [],
    currency: 'UZS',
    activeSection: 'dashboard',
    searchQuery: ''
};

// UI DOM references
const dom = {
    appContainer: document.getElementById('app-container'),
    authModal: document.getElementById('auth-modal'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    
    // Auth inputs
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    demoForm: document.getElementById('demo-form'),
    familyChoice: document.getElementById('family-choice'),
    groupNameWrapper: document.getElementById('group-name-wrapper'),
    inviteCodeWrapper: document.getElementById('invite-code-wrapper'),
    
    // Display elements
    displayUserName: document.getElementById('display-user-name'),
    displayFamilyName: document.getElementById('display-family-name'),
    userAvatarChar: document.getElementById('user-avatar-char'),
    shareInviteCode: document.getElementById('share-invite-code'),
    appDemoBadge: document.getElementById('app-demo-badge'),
    currentDateText: document.getElementById('current-date-text'),
    
    // KPI
    kpiTotalBalance: document.getElementById('kpi-total-balance'),
    kpiTotalIncome: document.getElementById('kpi-total-income'),
    kpiTotalExpense: document.getElementById('kpi-total-expense'),
    kpiActiveMembers: document.getElementById('kpi-active-members'),
    
    // Modals
    transactionModal: document.getElementById('transaction-modal'),
    familyMemberModal: document.getElementById('family-member-modal'),
    budgetModal: document.getElementById('budget-modal'),
    goalModal: document.getElementById('goal-modal')
};

// Constants
const CATEGORIES = {
    expense: ['Oziq-ovqat', 'Transport', 'Ijara / Kommunal', 'Sog\'liq', 'Ta\'lim', 'Ko\'ngilochar', 'Kiyim-kechak', 'Boshqa'],
    income: ['Maosh', 'Biznes / Savdo', 'Keshbek / Bonus', 'Sotuv', 'Boshqa']
};

const CATEGORY_COLORS = {
    'Oziq-ovqat': '#f59e0b',
    'Transport': '#3b82f6',
    'Ijara / Kommunal': '#ef4444',
    'Sog\'liq': '#10b981',
    'Ta\'lim': '#8b5cf6',
    'Ko\'ngilochar': '#ec4899',
    'Kiyim-kechak': '#6366f1',
    'Boshqa': '#64748b',
    'Maosh': '#10b981',
    'Biznes / Savdo': '#06b6d4',
    'Keshbek / Bonus': '#f59e0b',
    'Sotuv': '#14b8a6'
};

// Firebase Instances
let firebaseApp = null;
let db = null;
let auth = null;
let firebaseConfig = null;
let unsubscribeList = []; // list of firebase listeners to clear on logout

const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyD2gRY6Xe26vFUBZO_MDujWD19LLzeY8GI",
    authDomain: "oilamoliya.firebaseapp.com",
    projectId: "oilamoliya",
    storageBucket: "oilamoliya.firebasestorage.app",
    messagingSenderId: "56325289237",
    appId: "1:56325289237:web:2022e9a59097aca308251c",
    measurementId: "G-DK54X782EF"
};

// --- SEED / DEMO DATA ---
const DEMO_MEMBERS = [
    { id: 'm1', name: 'Joxad', role: 'Ota', avatar: 'J' },
    { id: 'm2', name: 'Ona', role: 'Ona', avatar: 'O' },
    { id: 'm3', name: 'O\'g\'il', role: 'O\'g\'il', avatar: 'O\'' }
];

const DEMO_TRANSACTIONS = [
    { id: 't1', amount: 12000000, category: 'Maosh', wallet: 'Plastik Karta', memberId: 'm1', date: '2026-05-20', description: 'Oylik maosh (Ota)', type: 'income' },
    { id: 't2', amount: 450000, category: 'Sog\'liq', wallet: 'Plastik Karta', memberId: 'm2', date: '2026-05-22', description: 'Klinika tahlillari va dori', type: 'expense' },
    { id: 't3', amount: 850000, category: 'Oziq-ovqat', wallet: 'Naqd Pul', memberId: 'm1', date: '2026-05-23', description: 'Haftalik oziq-ovqat bozori', type: 'expense' },
    { id: 't4', amount: 240000, category: 'Transport', wallet: 'Plastik Karta', memberId: 'm1', date: '2026-05-24', description: 'Mashinaga benzin', type: 'expense' },
    { id: 't5', amount: 300000, category: 'Ta\'lim', wallet: 'Plastik Karta', memberId: 'm3', date: '2026-05-25', description: 'O\'quv markazi kitoblari', type: 'expense' },
    { id: 't6', amount: 650000, category: 'Oziq-ovqat', wallet: 'Naqd Pul', memberId: 'm2', date: '2026-05-26', description: 'Go\'sht va ko\'katlar', type: 'expense' },
    { id: 't7', amount: 1500000, category: 'Biznes / Savdo', wallet: 'Naqd Pul', memberId: 'm2', date: '2026-05-25', description: 'Hunarmandchilik mahsulotlari sotuvi', type: 'income' }
];

const DEMO_BUDGETS = [
    { id: 'b1', category: 'Oziq-ovqat', limit: 3000000 },
    { id: 'b2', category: 'Transport', limit: 1000000 },
    { id: 'b3', category: 'Sog\'liq', limit: 1500000 }
];

const DEMO_GOALS = [
    { id: 'g1', name: 'Yozgi oilaviy dam olish (Turkiya)', target: 30000000, saved: 8000000 },
    { id: 'g2', name: 'Farzand uchun yangi noutbuk', target: 12000000, saved: 3000000 }
];

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase configurations exist in localStorage, or fallback to default hardcoded config
    const savedConfig = localStorage.getItem('firebase_config');
    if (savedConfig) {
        try {
            firebaseConfig = JSON.parse(savedConfig);
            document.getElementById('settings-firebase-config').value = JSON.stringify(firebaseConfig, null, 2);
            initFirebase(firebaseConfig);
        } catch (e) {
            console.error("Firebase load error, starting local state:", e);
            startLocalState();
        }
    } else if (DEFAULT_FIREBASE_CONFIG && DEFAULT_FIREBASE_CONFIG.apiKey) {
        firebaseConfig = DEFAULT_FIREBASE_CONFIG;
        document.getElementById('settings-firebase-config').value = JSON.stringify(firebaseConfig, null, 2);
        initFirebase(firebaseConfig);
    } else {
        startLocalState();
    }
    
    // Set Current Date in Header
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    dom.currentDateText.innerText = new Date().toLocaleDateString('uz-UZ', dateOptions);
    
    // Setup listeners
    setupFormListeners();
    
    // Run Router on load to direct to correct URL page
    handleRouting();
    
    window.updateThemeToggleIcon();
    lucide.createIcons();
});

// --- FIREBASE INTEGRATION ---
async function initFirebase(config) {
    try {
        const { initializeApp: fbInitializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getAuth: fbGetAuth, onAuthStateChanged: fbOnAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const { getFirestore: fbGetFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

        firebaseApp = fbInitializeApp(config);
        db = fbGetFirestore(firebaseApp);
        auth = fbGetAuth(firebaseApp);
        
        state.isDemo = false;
        
        // Listen to Auth State
        fbOnAuthStateChanged(auth, async (user) => {
            if (user) {
                state.user = user;
                if (state.isRegistering) return; // Wait for registration to complete writing to Firestore
                await loadFirebaseUserData(user);
            } else {
                state.user = null;
                showAuthScreen();
            }
        });
        
        updateFirebaseUIStatus(true);
    } catch (err) {
        console.error("Firebase init failed:", err);
        showToast("Firebase-ga ulanib bo'lmadi! Demo rejimga o'tildi.", "alert-triangle");
        startLocalState();
    }
}

async function loadFirebaseUserData(user) {
    try {
        const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        
        // Fetch user profile to get family ID
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (snapExists(userSnap)) {
            const userData = userSnap.data();
            state.family.id = userData.familyId;
            state.family.name = userData.familyName;
            
            // Fetch family configuration (like currency)
            const familySnap = await getDoc(doc(db, 'families', userData.familyId));
            if (snapExists(familySnap)) {
                const familyData = familySnap.data();
                state.currency = familyData.currency || 'UZS';
                const curSelect = document.getElementById('currency-select');
                if (curSelect) curSelect.value = state.currency;
            }
            
            // Save user details
            state.user.name = userData.name;
            state.user.role = userData.role || 'Oila A\'zosi';
            
            // Automatically sync local demo data to Firebase if Firestore is empty
            await syncLocalDataToFirebase(userData.familyId, user.uid);
            
            // Start live listeners
            setupFirebaseListeners();
            
            // Show app UI
            showMainApp();
        } else {
            // If user document not created yet but authenticated, we ask to create/join family
            showAuthScreen();
            switchAuthTab('register'); // Send to registration completion
            showToast("Iltimos, oila guruhingizni sozlang.", "info");
        }
    } catch (err) {
        console.error("Error loading user data:", err);
        showToast("Ma'lumotlarni yuklashda xatolik! Bazani tekshiring.", "alert-triangle");
        showAuthScreen();
    }
}

async function syncLocalDataToFirebase(familyId, userId) {
    const storedMembers = localStorage.getItem('demo_members');
    const storedTransactions = localStorage.getItem('demo_transactions');
    const storedBudgets = localStorage.getItem('demo_budgets');
    const storedGoals = localStorage.getItem('demo_goals');

    if (!storedTransactions && !storedMembers) return; // Nothing to sync

    try {
        const { doc, setDoc, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const familyRef = `families/${familyId}`;

        // 1. Check if Firestore transactions list is empty
        const tSnap = await getDocs(collection(db, `${familyRef}/transactions`));
        if (!tSnap.empty) {
            // Firestore already has data, do not overwrite automatically to prevent duplicates
            return;
        }

        showToast("Lokal ma'lumotlar Firebase-ga avtomatik yuklanmoqda...", "loader");

        // 2. Import members
        const localMembers = storedMembers ? JSON.parse(storedMembers) : DEMO_MEMBERS;
        const memberIdMap = {};
        for (const m of localMembers) {
            const mData = { name: m.name, role: m.role, avatar: m.avatar || m.name.charAt(0).toUpperCase() };
            // Map original member to current user if names or IDs match
            const mId = (m.id === 'm1' || m.name.toLowerCase() === state.user.name.toLowerCase()) ? userId : m.id;
            await setDoc(doc(db, `${familyRef}/members`, mId), mData);
            memberIdMap[m.id] = mId;
        }

        // 3. Import budgets
        const localBudgets = storedBudgets ? JSON.parse(storedBudgets) : DEMO_BUDGETS;
        for (const b of localBudgets) {
            await setDoc(doc(db, `${familyRef}/budgets`, b.id), { category: b.category, limit: Number(b.limit) });
        }

        // 4. Import goals
        const localGoals = storedGoals ? JSON.parse(storedGoals) : DEMO_GOALS;
        for (const g of localGoals) {
            await setDoc(doc(db, `${familyRef}/goals`, g.id), { name: g.name, target: Number(g.target), saved: Number(g.saved) });
        }

        // 5. Import transactions
        const localTransactions = storedTransactions ? JSON.parse(storedTransactions) : DEMO_TRANSACTIONS;
        for (const t of localTransactions) {
            const mappedMemberId = memberIdMap[t.memberId] || t.memberId;
            const tData = {
                amount: Number(t.amount),
                category: t.category,
                wallet: t.wallet,
                memberId: mappedMemberId,
                date: t.date,
                description: t.description,
                type: t.type
            };
            await setDoc(doc(db, `${familyRef}/transactions`, t.id), tData);
        }

        // Clear local storage after successful sync so it doesn't run again
        localStorage.removeItem('demo_members');
        localStorage.removeItem('demo_transactions');
        localStorage.removeItem('demo_budgets');
        localStorage.removeItem('demo_goals');

        showToast("Barcha mahalliy ma'lumotlar Firebase-ga to'liq yuklandi!", "check");
    } catch (e) {
        console.error("Auto sync to Firebase failed:", e);
    }
}

function snapExists(snap) {
    return snap && typeof snap.exists === 'function' && snap.exists();
}

async function setupFirebaseListeners() {
    // Clear old listeners
    unsubscribeList.forEach(unsub => unsub());
    unsubscribeList = [];
    
    const { collection, doc, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    
    const familyRef = `families/${state.family.id}`;
    
    // 0. Family config & name listener (Syncs currency and family name in real-time!)
    const famUnsub = onSnapshot(doc(db, 'families', state.family.id), (snapshot) => {
        if (snapExists(snapshot)) {
            const famData = snapshot.data();
            state.family.name = famData.name;
            state.currency = famData.currency || 'UZS';
            
            const curSelect = document.getElementById('currency-select');
            if (curSelect) curSelect.value = state.currency;
            dom.displayFamilyName.innerText = state.family.name;
            renderUI();
        }
    });
    unsubscribeList.push(famUnsub);
    
    // 1. Members
    const mUnsub = onSnapshot(collection(db, `${familyRef}/members`), (snapshot) => {
        state.members = [];
        snapshot.forEach(doc => {
            state.members.push({ id: doc.id, ...doc.data() });
        });
        renderUI();
    });
    unsubscribeList.push(mUnsub);

    // 2. Transactions
    const tQuery = query(collection(db, `${familyRef}/transactions`), orderBy('date', 'desc'));
    const tUnsub = onSnapshot(tQuery, (snapshot) => {
        state.transactions = [];
        snapshot.forEach(doc => {
            state.transactions.push({ id: doc.id, ...doc.data() });
        });
        renderUI();
        renderLiveActivityFeed(snapshot.docChanges());
    });
    unsubscribeList.push(tUnsub);

    // 3. Budgets
    const bUnsub = onSnapshot(collection(db, `${familyRef}/budgets`), (snapshot) => {
        state.budgets = [];
        snapshot.forEach(doc => {
            state.budgets.push({ id: doc.id, ...doc.data() });
        });
        renderUI();
    });
    unsubscribeList.push(bUnsub);

    // 4. Goals
    const gUnsub = onSnapshot(collection(db, `${familyRef}/goals`), (snapshot) => {
        state.goals = [];
        snapshot.forEach(doc => {
            state.goals.push({ id: doc.id, ...doc.data() });
        });
        renderUI();
    });
    unsubscribeList.push(gUnsub);
}

// --- LOCAL / DEMO STATE ---
function startLocalState() {
    state.isDemo = true;
    state.family = { id: 'demo-family', name: 'Joxadlar Oilasi' };
    
    // Load from local storage or pre-populate
    const storedMembers = localStorage.getItem('demo_members');
    const storedTransactions = localStorage.getItem('demo_transactions');
    const storedBudgets = localStorage.getItem('demo_budgets');
    const storedGoals = localStorage.getItem('demo_goals');
    
    if (storedMembers) {
        state.members = JSON.parse(storedMembers);
        state.transactions = JSON.parse(storedTransactions);
        state.budgets = JSON.parse(storedBudgets);
        state.goals = JSON.parse(storedGoals);
    } else {
        state.members = [...DEMO_MEMBERS];
        state.transactions = [...DEMO_TRANSACTIONS];
        state.budgets = [...DEMO_BUDGETS];
        state.goals = [...DEMO_GOALS];
        saveLocalData();
    }
    
    state.user = {
        name: 'Joxad',
        role: 'Ota'
    };
    
    updateFirebaseUIStatus(false);
    showMainApp();
}

function saveLocalData() {
    if (!state.isDemo) return;
    localStorage.setItem('demo_members', JSON.stringify(state.members));
    localStorage.setItem('demo_transactions', JSON.stringify(state.transactions));
    localStorage.setItem('demo_budgets', JSON.stringify(state.budgets));
    localStorage.setItem('demo_goals', JSON.stringify(state.goals));
}

// --- AUTH ACTIONS ---
function showAuthScreen() {
    let currentRoute = window.location.hash.substring(1);
    if (currentRoute !== 'login' && currentRoute !== 'register') {
        window.location.hash = '#login';
    } else {
        handleRouting();
    }
}

function showMainApp() {
    // Set Header/Sidebar values
    dom.displayUserName.innerText = state.user.name;
    dom.displayFamilyName.innerText = state.family.name;
    dom.userAvatarChar.innerText = state.user.name.charAt(0).toUpperCase();
    dom.shareInviteCode.innerText = state.family.id;
    
    if (state.isDemo) {
        dom.appDemoBadge.classList.remove('hidden');
        dom.shareInviteCode.innerText = "DEMO-REJIM";
    } else {
        dom.appDemoBadge.classList.add('hidden');
    }
    
    // Populate form selects
    populateSelectOptions();
    
    // Switch route to dashboard if they are on a login/register route
    let currentRoute = window.location.hash.substring(1);
    if (currentRoute === 'login' || currentRoute === 'register' || !currentRoute) {
        window.location.hash = '#dashboard';
    } else {
        renderUI();
    }
}

window.switchAuthTab = function(tab) {
    // Switch route hash, which triggers handleRouting
    window.location.hash = `#${tab}`;
};

function switchAuthTabInternally(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        if (document.querySelectorAll('.tab-btn')[0]) document.querySelectorAll('.tab-btn')[0].classList.add('active');
        dom.loginForm.classList.add('active');
        document.getElementById('auth-subtitle').innerText = "Hisobingizga kiring va moliya boshqaruvini boshlang";
    } else if (tab === 'register') {
        if (document.querySelectorAll('.tab-btn')[1]) document.querySelectorAll('.tab-btn')[1].classList.add('active');
        dom.registerForm.classList.add('active');
        document.getElementById('auth-subtitle').innerText = "Yangi oilaviy byudjet guruhini yarating yoki guruhga qo'shiling";
    }
}

window.toggleFamilyInput = function() {
    const choice = dom.familyChoice.value;
    if (choice === 'create') {
        dom.groupNameWrapper.classList.remove('hidden');
        dom.inviteCodeWrapper.classList.add('hidden');
    } else {
        dom.groupNameWrapper.classList.add('hidden');
        dom.inviteCodeWrapper.classList.remove('hidden');
    }
};

window.startDemoMode = function() {
    const username = document.getElementById('demo-username').value.trim() || 'Joxad';
    startLocalState();
    state.user.name = username;
    dom.displayUserName.innerText = username;
    dom.userAvatarChar.innerText = username.charAt(0).toUpperCase();
    showToast("Demo rejim ishga tushirildi!", "play");
};

window.handleLogout = async function() {
    if (state.isDemo) {
        if (confirm("Demo rejimdan chiqasizmi? Ma'lumotlaringiz shu brauzerda saqlanib qoladi.")) {
            showAuthScreen();
            showToast("Tizimdan chiqildi.", "info");
        }
    } else {
        try {
            const { signOut: fbSignOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            await fbSignOut(auth);
            unsubscribeList.forEach(unsub => unsub());
            unsubscribeList = [];
            state.user = null;
            showAuthScreen();
            showToast("Tizimdan chiqildi.", "info");
        } catch (e) {
            console.error("Logout error", e);
        }
    }
};

function setupFormListeners() {
    // 1. Login Form Submit
    dom.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!auth) {
            showToast("Firebase sozlanmagan! Iltimos, Demo rejimdan foydalaning.", "alert-triangle");
            return;
        }
        
        try {
            const { signInWithEmailAndPassword: fbSignIn } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            showToast("Kirilmoqda...", "loader");
            await fbSignIn(auth, email, password);
            showToast("Muvaffaqiyatli kirdingiz!", "check");
        } catch (err) {
            showToast("Xatolik: E-mail yoki parol xato!", "x");
            console.error(err);
        }
    });

    // 2. Register Form Submit
    dom.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const choice = dom.familyChoice.value;
        
        if (!auth) {
            showToast("Firebase sozlanmagan! Iltimos, Demo rejimdan foydalaning.", "alert-triangle");
            return;
        }

        try {
            state.isRegistering = true; // Block onAuthStateChanged check during registration
            const { createUserWithEmailAndPassword: fbCreateUser } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
            const { doc, setDoc, collection, addDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            
            showToast("Ro'yxatdan o'tilmoqda...", "loader");
            
            // Create user auth or use existing session
            let user = auth.currentUser;
            if (!user) {
                const cred = await fbCreateUser(auth, email, password);
                user = cred.user;
            }
            
            let familyId = "";
            let familyName = "";
            let memberRole = "Boshliq";
            
            if (choice === 'create') {
                familyName = document.getElementById('create-group-name').value.trim() || `${name} Oilasi`;
                // Generate a random family group ID
                familyId = 'fam-' + Math.random().toString(36).substr(2, 9);
                
                // Create family doc
                await setDoc(doc(db, 'families', familyId), {
                    name: familyName,
                    createdBy: user.uid,
                    createdAt: new Date().toISOString()
                });
                
                // Add first member (Creator)
                await setDoc(doc(db, `families/${familyId}/members/${user.uid}`), {
                    name: name,
                    role: 'Ota (Boshliq)',
                    avatar: name.charAt(0).toUpperCase()
                });

                // Auto-Seed Welcome Data so the Dashboard is instantly alive and gorgeous!
                // 1. Welcome Transaction (Boshlang'ich Balans)
                await addDoc(collection(db, `families/${familyId}/transactions`), {
                    amount: 5000000,
                    category: 'Maosh',
                    wallet: 'Plastik Karta',
                    memberId: user.uid,
                    date: new Date().toISOString().split('T')[0],
                    description: 'Boshlang\'ich Oila Balansi',
                    type: 'income'
                });

                // 2. Default Budget Limit (Oziq-ovqat uchun)
                await addDoc(collection(db, `families/${familyId}/budgets`), {
                    category: 'Oziq-ovqat',
                    limit: 3000000
                });

                // 3. Default Savings Goal (Oila sayohati)
                await addDoc(collection(db, `families/${familyId}/goals`), {
                    name: 'Yozgi oilaviy ta\'til',
                    target: 20000000,
                    saved: 1000000
                });
            } else {
                familyId = document.getElementById('join-invite-code').value.trim();
                memberRole = "A'zo";
                
                // Verify family group exists
                const familySnap = await getDoc(doc(db, 'families', familyId));
                if (!familySnap.exists()) {
                    throw new Error("Oila kodi topilmadi!");
                }
                
                familyName = familySnap.data().name;
                
                // Add member to family
                await setDoc(doc(db, `families/${familyId}/members/${user.uid}`), {
                    name: name,
                    role: 'A\'zo',
                    avatar: name.charAt(0).toUpperCase()
                });
            }
            
            // Save main User document linked to family
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                familyId: familyId,
                familyName: familyName,
                role: memberRole
            });
            
            state.isRegistering = false; // Reset flag
            showToast("Muvaffaqiyatli ro'yxatdan o'tdingiz!", "check");
            
            // Explicitly transition to logged in dashboard now that database profile exists
            await loadFirebaseUserData(user);
        } catch (err) {
            state.isRegistering = false; // Reset flag on error
            showToast("Xatolik: " + err.message, "x");
            console.error(err);
        }
    });
}

// --- RENDER DYNAMIC UI ---
function renderUI() {
    // 1. Recalculate balances
    const totals = calculateBalances();
    
    // Render KPIs
    dom.kpiTotalBalance.innerText = formatMoney(totals.balance);
    dom.kpiTotalIncome.innerText = formatMoney(totals.income);
    dom.kpiTotalExpense.innerText = formatMoney(totals.expense);
    dom.kpiActiveMembers.innerText = `${state.members.length} ta`;
    
    // 2. Render Charts
    renderCharts();
    
    // 3. Render list sections
    renderRecentTransactions(state.transactions.slice(0, 5));
    renderBudgets();
    renderGoals();
    renderFamilyMembers();
    populateSelectOptions();
    
    // Automatically update/render main transactions table with active filters
    if (window.applyFilters) {
        window.applyFilters();
    }
    
    // Update active section visibility
    switchSectionInternally(state.activeSection);
    lucide.createIcons();
}

function calculateBalances() {
    let income = 0;
    let expense = 0;
    
    state.transactions.forEach(t => {
        if (t.type === 'income') {
            income += Number(t.amount);
        } else {
            expense += Number(t.amount);
        }
    });
    
    return {
        income: income,
        expense: expense,
        balance: income - expense
    };
}

function formatMoney(amount) {
    if (state.currency === 'USD') {
        const val = state.isDemo ? (amount / 12600) : amount; // Simple conversion factor in demo
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);
    }
    return new Intl.NumberFormat('uz-UZ', { style: 'decimal' }).format(amount) + " UZS";
}

window.changeCurrency = async function(currency) {
    state.currency = currency;
    renderUI();
    
    if (!state.isDemo && db) {
        try {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            await updateDoc(doc(db, 'families', state.family.id), {
                currency: currency
            });
            showToast("Oila valyutasi bulutda yangilandi!", "check");
        } catch (e) {
            console.error("Error updating currency in Firestore:", e);
        }
    }
};

// Navigation switcher & Routing
window.switchSection = function(sectionId) {
    // Simply change the hash in URL, which triggers window hashchange listener!
    window.location.hash = `#${sectionId}`;
};

function switchSectionInternally(sectionId) {
    state.activeSection = sectionId;
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-item').forEach(btn => btn.classList.remove('active'));
    
    const activeSec = document.getElementById(`section-${sectionId}`);
    if (activeSec) activeSec.classList.add('active');
    
    // Highlight correct sidebar button
    const navButtons = document.querySelectorAll('.nav-item');
    const mapping = { dashboard: 0, transactions: 1, family: 2, budgets: 3, settings: 4 };
    const index = mapping[sectionId];
    if (index !== undefined && navButtons[index]) {
        navButtons[index].classList.add('active');
    }

    // Highlight correct mobile bottom nav button
    const mobileNavButtons = document.querySelectorAll('.mobile-nav-item');
    if (index !== undefined && mobileNavButtons[index]) {
        mobileNavButtons[index].classList.add('active');
    }
}

// Router logic with Auth Guards
function handleRouting() {
    let route = window.location.hash.substring(1);
    
    const validRoutes = ['login', 'register', 'dashboard', 'transactions', 'family', 'budgets', 'settings'];
    
    // If not a valid route, fallback based on auth state
    if (!validRoutes.includes(route)) {
        window.location.hash = state.user ? '#dashboard' : '#login';
        return;
    }
    
    if (!state.user) {
        // NOT AUTHENTICATED
        if (route !== 'login' && route !== 'register') {
            window.location.hash = '#login';
            return;
        }
        
        // Show Auth Modal, Hide Main Container
        dom.appContainer.classList.add('hidden');
        dom.authModal.classList.remove('hidden');
        
        switchAuthTabInternally(route);
    } else {
        // AUTHENTICATED
        if (route === 'login' || route === 'register') {
            window.location.hash = '#dashboard';
            return;
        }
        
        // Hide Auth Modal, Show Main Container
        dom.authModal.classList.add('hidden');
        dom.appContainer.classList.remove('hidden');
        
        switchSectionInternally(route);
    }
}

// Register hashchange router listener
window.addEventListener('hashchange', handleRouting);

// --- DATA LIST RENDERS ---

function renderRecentTransactions(transactions) {
    const container = document.getElementById('dashboard-recent-transactions');
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="plus-circle" class="empty-icon"></i>
                <p>Tranzaksiyalar topilmadi.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = transactions.map(t => {
        const member = state.members.find(m => m.id === t.memberId) || { name: 'Noma\'lum' };
        const icon = t.type === 'income' ? 'trending-up' : 'trending-down';
        const colorClass = t.type === 'income' ? 'text-success' : 'text-danger';
        const bgIcon = t.type === 'income' ? 'bg-green-glow' : 'bg-red-glow';
        const prefix = t.type === 'income' ? '+' : '-';
        
        return `
            <div class="transaction-item">
                <div class="trans-item-left">
                    <div class="trans-icon-bg ${bgIcon}">
                        <i data-lucide="${icon}" style="width:18px;height:18px;"></i>
                    </div>
                    <div class="trans-details">
                        <span class="trans-desc">${t.description}</span>
                        <span class="trans-meta">${t.category} • ${t.date}</span>
                    </div>
                </div>
                <div class="trans-item-right">
                    <span class="trans-amount ${colorClass}">${prefix}${formatMoney(t.amount)}</span>
                    <span class="trans-user-badge">${member.name}</span>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function renderBudgets() {
    // 1. Dashboard summary budgets
    const dbContainer = document.getElementById('dashboard-budgets-list');
    // 2. Full Budgets page
    const fullContainer = document.getElementById('budgets-full-list');
    
    if (state.budgets.length === 0) {
        const emptyHtml = `
            <div class="empty-state">
                <i data-lucide="pie-chart" class="empty-icon"></i>
                <p>Hozircha byudjet limitlari o'rnatilmagan.</p>
            </div>
        `;
        if (dbContainer) dbContainer.innerHTML = emptyHtml;
        if (fullContainer) fullContainer.innerHTML = emptyHtml;
        return;
    }
    
    // Calculate spent sum for each budget category in current month
    const categoryExpenses = {};
    state.transactions.forEach(t => {
        if (t.type === 'expense') {
            categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + Number(t.amount);
        }
    });
    
    // Render Dashboard list (max 3 item)
    dbContainer.innerHTML = state.budgets.slice(0, 3).map(b => {
        const spent = categoryExpenses[b.category] || 0;
        const percentage = Math.min(100, Math.round((spent / b.limit) * 100));
        const colorClass = percentage >= 100 ? 'bg-gradient-red' : 'bg-gradient-purple';
        
        return `
            <div class="budget-status-item">
                <div class="budget-item-meta">
                    <span class="budget-cat-name">${b.category}</span>
                    <span class="text-secondary">${formatMoney(spent)} / ${formatMoney(b.limit)}</span>
                </div>
                <div class="budget-progress-track">
                    <div class="budget-progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    // Render Budgets Section full list
    fullContainer.innerHTML = state.budgets.map(b => {
        const spent = categoryExpenses[b.category] || 0;
        const percentage = Math.min(100, Math.round((spent / b.limit) * 100));
        const colorClass = percentage >= 100 ? 'bg-gradient-red' : 'bg-gradient-purple';
        const warningAlert = percentage >= 100 ? `<span class="badge-trans expense"><i data-lucide="alert-triangle" style="width:12px;"></i> Limit Oshdi!</span>` : '';
        
        return `
            <div class="budget-item-card">
                <div class="budget-card-meta">
                    <div>
                        <h4 style="display:flex;align-items:center;gap:0.5rem;">${b.category} ${warningAlert}</h4>
                        <span class="text-secondary small">Kategoriya xarajatlari limiti</span>
                    </div>
                    <div class="budget-actions">
                        <button class="btn-icon delete" onclick="deleteBudget('${b.id}')"><i data-lucide="trash-2" style="width:16px;"></i></button>
                    </div>
                </div>
                <div class="budget-item-meta margin-top" style="margin-bottom: 0.5rem;">
                    <span>Sarflandi: <strong>${formatMoney(spent)}</strong></span>
                    <span class="text-secondary">Limit: ${formatMoney(b.limit)}</span>
                </div>
                <div class="budget-progress-track">
                    <div class="budget-progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                </div>
                <span class="goal-percentage">${percentage}% Sarflandi</span>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function renderGoals() {
    const container = document.getElementById('goals-full-list');
    if (state.goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="target" class="empty-icon"></i>
                <p>Hozircha jamg'arma maqsadlari yo'q.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.goals.map(g => {
        const percentage = Math.min(100, Math.round((g.saved / g.target) * 100));
        
        return `
            <div class="goal-item-card">
                <div class="goal-item-header">
                    <div class="goal-name-wrap">
                        <h4>${g.name}</h4>
                        <span class="text-secondary small">Moliyaviy Jamg'arma Maqsadi</span>
                    </div>
                    <div class="goal-progress-numbers">
                        <span class="goal-saved">${formatMoney(g.saved)}</span>
                        <div class="goal-total">Kerak: ${formatMoney(g.target)}</div>
                    </div>
                </div>
                
                <div class="goal-progress-wrap">
                    <div class="budget-progress-track">
                        <div class="budget-progress-bar bg-gradient-purple" style="width: ${percentage}%"></div>
                    </div>
                    <span class="goal-percentage">${percentage}% bajarildi</span>
                </div>
                
                <div class="goal-card-actions">
                    <button class="btn btn-outline small" onclick="openContributeGoalModal('${g.id}')"><i data-lucide="plus" style="width:14px;"></i> Jamg'arish</button>
                    <button class="btn btn-outline-danger small" onclick="deleteGoal('${g.id}')"><i data-lucide="trash-2" style="width:14px;"></i></button>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function renderFamilyMembers() {
    const grid = document.getElementById('family-members-grid');
    if (state.members.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i data-lucide="users" class="empty-icon"></i>
                <p>Oila a'zolari kiritilmagan.</p>
            </div>
        `;
        return;
    }
    
    // Compute total contributed expenses/income for each family member
    const memberIncome = {};
    const memberExpense = {};
    
    state.transactions.forEach(t => {
        if (t.type === 'income') {
            memberIncome[t.memberId] = (memberIncome[t.memberId] || 0) + Number(t.amount);
        } else {
            memberExpense[t.memberId] = (memberExpense[t.memberId] || 0) + Number(t.amount);
        }
    });
    
    grid.innerHTML = state.members.map(m => {
        const inc = memberIncome[m.id] || 0;
        const exp = memberExpense[m.id] || 0;
        
        return `
            <div class="family-member-card glass">
                <button class="btn-icon delete btn-remove-member" onclick="deleteFamilyMember('${m.id}')" title="O'chirish"><i data-lucide="user-x" style="width:16px;"></i></button>
                <div class="avatar member-avatar">${m.avatar || m.name.charAt(0).toUpperCase()}</div>
                <h3>${m.name}</h3>
                <span class="member-tag">${m.role}</span>
                
                <div class="member-stats">
                    <div class="member-stat-box">
                        <span class="member-stat-title">Daromad (+)</span>
                        <span class="member-stat-val text-success">${formatMoney(inc)}</span>
                    </div>
                    <div class="member-stat-box">
                        <span class="member-stat-title">Xarajat (-)</span>
                        <span class="member-stat-val text-danger">${formatMoney(exp)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

// Setup input selects options
function populateSelectOptions() {
    // 1. Transaction member select
    const memberSelect = document.getElementById('trans-member');
    if (memberSelect) {
        if (state.members.length === 0) {
            // Robust fallback if members list hasn't loaded from Firestore yet
            const defaultId = state.user?.uid || 'm1';
            const defaultName = state.user?.name || 'Foydalanuvchi';
            const defaultRole = state.user?.role || 'A\'zo';
            memberSelect.innerHTML = `<option value="${defaultId}">${defaultName} (${defaultRole})</option>`;
        } else {
            memberSelect.innerHTML = state.members.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('');
        }
    }
    
    // 2. Transaction Category select is populated in openTransactionModal() based on income/expense
    
    // 3. Budgets Category select
    const budgetCatSelect = document.getElementById('budget-category');
    if (budgetCatSelect) {
        budgetCatSelect.innerHTML = CATEGORIES.expense.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    
    // 4. Filters Member select
    const filterMember = document.getElementById('filter-member');
    if (filterMember) {
        filterMember.innerHTML = `<option value="all">Barcha a'zolar</option>` + 
            state.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    }
    
    // 5. Filters Category select
    const filterCategory = document.getElementById('filter-category');
    if (filterCategory) {
        const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
        filterCategory.innerHTML = `<option value="all">Barcha toifalar</option>` + 
            allCats.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

// --- CHARTS GENERATION (CHART.JS) ---
let flowChart = null;
let categoriesChart = null;
let contributionsChart = null;

function renderCharts() {
    // Destroy existing charts to prevent rendering glitches
    if (flowChart) flowChart.destroy();
    if (categoriesChart) categoriesChart.destroy();
    if (contributionsChart) contributionsChart.destroy();
    
    const flowCtx = document.getElementById('flowChart');
    const catCtx = document.getElementById('categoriesChart');
    const famCtx = document.getElementById('familyContributionsChart');
    
    if (!flowCtx || !catCtx) return;
    
    // Dynamic theme colors
    const isLight = document.body.classList.contains('light-mode');
    const textColor = isLight ? '#52525b' : '#a1a1aa'; // Zinc-600 vs Zinc-400
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
    const emptyPieColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    
    // 1. Weekly Flow Chart Data (Income vs Expenses trend)
    // Gather last 7 days starting from today backward
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const displayLabel = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
        
        labels.push(displayLabel);
        
        // Sum transactions on this date
        let dayInc = 0;
        let dayExp = 0;
        state.transactions.forEach(t => {
            if (t.date === dateStr) {
                if (t.type === 'income') dayInc += Number(t.amount);
                else dayExp += Number(t.amount);
            }
        });
        incomeData.push(dayInc);
        expenseData.push(dayExp);
    }
    
    flowChart = new Chart(flowCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Daromad (+)',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: 'Xarajat (-)',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Outfit' } } }
            },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor } },
                y: { grid: { color: gridColor }, ticks: { color: textColor } }
            }
        }
    });
    
    // 2. Expense Categories Doughnut Chart Data
    const expenseCategoriesCount = {};
    let hasExpenses = false;
    
    state.transactions.forEach(t => {
        if (t.type === 'expense') {
            expenseCategoriesCount[t.category] = (expenseCategoriesCount[t.category] || 0) + Number(t.amount);
            hasExpenses = true;
        }
    });
    
    const catLabels = Object.keys(expenseCategoriesCount);
    const catData = Object.values(expenseCategoriesCount);
    const catColors = catLabels.map(l => CATEGORY_COLORS[l] || '#64748b');
    
    categoriesChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
            labels: hasExpenses ? catLabels : ['Xarajatlar yo\'q'],
            datasets: [{
                data: hasExpenses ? catData : [1],
                backgroundColor: hasExpenses ? catColors : [emptyPieColor],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor, font: { family: 'Outfit', size: 11 } }
                }
            },
            cutout: '70%'
        }
    });
    
    // 3. Family contributions chart (Family Page)
    if (famCtx) {
        const familyExpensesCount = {};
        let hasFamExpenses = false;
        
        state.transactions.forEach(t => {
            if (t.type === 'expense') {
                const member = state.members.find(m => m.id === t.memberId) || { name: 'Boshqalar' };
                familyExpensesCount[member.name] = (familyExpensesCount[member.name] || 0) + Number(t.amount);
                hasFamExpenses = true;
            }
        });
        
        const famLabels = Object.keys(familyExpensesCount);
        const famData = Object.values(familyExpensesCount);
        const famColors = ['#2e66ff', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4'];
        
        contributionsChart = new Chart(famCtx, {
            type: 'doughnut',
            data: {
                labels: hasFamExpenses ? famLabels : ['Ma\'lumotlar yo\'q'],
                datasets: [{
                    data: hasFamExpenses ? famData : [1],
                    backgroundColor: hasFamExpenses ? famColors.slice(0, famLabels.length) : [emptyPieColor],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, font: { family: 'Outfit' } }
                    }
                },
                cutout: '60%'
            }
        });
    }
}

// --- CLOUD LIVE ACTIVITY STREAM FEED ---
function renderLiveActivityFeed(changes) {
    const feed = document.getElementById('family-activity-feed');
    if (!feed) return;
    
    if (state.isDemo) {
        // Feed static demo items once
        feed.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon expense"><i data-lucide="trending-down" style="width:14px;"></i></div>
                <div>
                    <p><strong>Ona</strong> oziq-ovqat uchun <strong>650,000 UZS</strong> xarajat kiritdi.</p>
                    <span class="activity-time">5 daqiqa oldin (Demo)</span>
                </div>
            </div>
            <div class="activity-item">
                <div class="activity-icon income"><i data-lucide="trending-up" style="width:14px;"></i></div>
                <div>
                    <p><strong>Joxad</strong> maosh uchun <strong>12,000,000 UZS</strong> daromad qo'shdi.</p>
                    <span class="activity-time">Kecha (Demo)</span>
                </div>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    // Dynamic Firebase snapshot feed
    changes.forEach(change => {
        if (change.type === "added") {
            const t = change.doc.data();
            const member = state.members.find(m => m.id === t.memberId) || { name: 'Kimdir' };
            const typeStr = t.type === 'income' ? 'daromad qo\'shdi' : 'xarajat kiritdi';
            const valStr = formatMoney(t.amount);
            const badgeClass = t.type === 'income' ? 'income' : 'expense';
            const icon = t.type === 'income' ? 'trending-up' : 'trending-down';
            
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon ${badgeClass}"><i data-lucide="${icon}" style="width:14px;"></i></div>
                <div>
                    <p><strong>${member.name}</strong> ${t.category} toifasida <strong>${valStr}</strong> ${typeStr}.</p>
                    <span class="activity-time">Hozirgina</span>
                </div>
            `;
            feed.prepend(item);
            // Limit feed to last 6 items
            while (feed.children.length > 6) {
                feed.removeChild(feed.lastChild);
            }
            lucide.createIcons();
        }
    });
}

// --- MODALS ACTIONS & FORMS SUBMITS ---

// 1. Transaction Modal
window.openTransactionModal = function(type) {
    dom.transactionModal.classList.remove('hidden');
    document.getElementById('trans-id').value = '';
    document.getElementById('trans-type').value = type;
    
    // Date default to today
    document.getElementById('trans-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('trans-amount').value = '';
    document.getElementById('trans-description').value = '';
    
    // Select styling & heading
    const title = document.getElementById('transaction-modal-title');
    const submitBtn = document.getElementById('trans-btn-submit');
    const catSelect = document.getElementById('trans-category');
    
    if (type === 'income') {
        title.innerText = "Yangi Daromad Qo'shish";
        submitBtn.className = "btn btn-accent";
        submitBtn.innerText = "Daromadni Saqlash";
        catSelect.innerHTML = CATEGORIES.income.map(c => `<option value="${c}">${c}</option>`).join('');
    } else {
        title.innerText = "Yangi Xarajat Kiritish";
        submitBtn.className = "btn btn-primary";
        submitBtn.innerText = "Xarajatni Saqlash";
        catSelect.innerHTML = CATEGORIES.expense.map(c => `<option value="${c}">${c}</option>`).join('');
    }
};

window.closeTransactionModal = function() {
    dom.transactionModal.classList.add('hidden');
};

window.handleTransactionSubmit = async function(event) {
    event.preventDefault();
    const id = document.getElementById('trans-id').value;
    const type = document.getElementById('trans-type').value;
    const amount = Number(document.getElementById('trans-amount').value);
    const category = document.getElementById('trans-category').value;
    const wallet = document.getElementById('trans-wallet').value;
    const memberId = document.getElementById('trans-member').value;
    const date = document.getElementById('trans-date').value;
    const description = document.getElementById('trans-description').value.trim();
    
    const transactionData = {
        amount, category, wallet, memberId, date, description, type
    };
    
    // Check Budget Limit warnings before saving
    if (type === 'expense') {
        const budget = state.budgets.find(b => b.category === category);
        if (budget) {
            // Calculate current spent + new expense
            const spent = state.transactions
                .filter(t => t.type === 'expense' && t.category === category && t.id !== id)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            
            if (spent + amount > budget.limit) {
                showToast(`Ogohlantirish: "${category}" byudjet limiti oshib ketdi!`, "alert-triangle");
            }
        }
    }
    
    if (state.isDemo) {
        if (id) {
            // Edit
            const idx = state.transactions.findIndex(t => t.id === id);
            state.transactions[idx] = { id, ...transactionData };
            showToast("Tranzaksiya tahrirlandi!", "check");
        } else {
            // Create
            const newId = 't-' + Math.random().toString(36).substr(2, 9);
            state.transactions.unshift({ id: newId, ...transactionData });
            showToast("Tranzaksiya muvaffaqiyatli kiritildi!", "check");
        }
        saveLocalData();
        renderUI();
    } else {
        // Firebase Cloud Write
        try {
            const { collection, addDoc, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            const path = `families/${state.family.id}/transactions`;
            if (id) {
                await setDoc(doc(db, path, id), transactionData);
                showToast("Tranzaksiya yangilandi!", "check");
            } else {
                await addDoc(collection(db, path), transactionData);
                showToast("Bulutga tranzaksiya yuklandi!", "check");
            }
        } catch (e) {
            showToast("Xatolik yuz berdi!", "x");
            console.error(e);
        }
    }
    closeTransactionModal();
};

window.deleteTransaction = async function(id) {
    if (!confirm("Ushbu tranzaksiyani o'chirmoqchimisiz?")) return;
    
    if (state.isDemo) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        saveLocalData();
        renderUI();
        showToast("Tranzaksiya o'chirildi.", "trash-2");
    } else {
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            await deleteDoc(doc(db, `families/${state.family.id}/transactions`, id));
            showToast("Tranzaksiya bulutdan o'chirildi.", "trash-2");
        } catch (e) {
            showToast("Xatolik yuz berdi!", "x");
        }
    }
};

window.editTransaction = function(id) {
    const t = state.transactions.find(trans => trans.id === id);
    if (!t) return;
    
    openTransactionModal(t.type);
    document.getElementById('trans-id').value = t.id;
    document.getElementById('trans-amount').value = t.amount;
    document.getElementById('trans-category').value = t.category;
    document.getElementById('trans-wallet').value = t.wallet;
    document.getElementById('trans-member').value = t.memberId;
    document.getElementById('trans-date').value = t.date;
    document.getElementById('trans-description').value = t.description;
    
    document.getElementById('transaction-modal-title').innerText = "Tranzaksiyani Tahrirlash";
};

// 2. Family Member Modal
window.openFamilyMemberModal = function() {
    dom.familyMemberModal.classList.remove('hidden');
    document.getElementById('member-name').value = '';
};

window.closeFamilyMemberModal = function() {
    dom.familyMemberModal.classList.add('hidden');
};

window.handleFamilyMemberSubmit = async function(event) {
    event.preventDefault();
    const name = document.getElementById('member-name').value.trim();
    const role = document.getElementById('member-role').value;
    
    const memberData = {
        name, role, avatar: name.charAt(0).toUpperCase()
    };
    
    if (state.isDemo) {
        const newId = 'm-' + Math.random().toString(36).substr(2, 9);
        state.members.push({ id: newId, ...memberData });
        saveLocalData();
        renderUI();
        showToast(`${name} oila a'zosi bo'lib qo'shildi!`, "user-plus");
    } else {
        try {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            await addDoc(collection(db, `families/${state.family.id}/members`), memberData);
            showToast("Yangi a'zo bulutga qo'shildi!", "user-plus");
        } catch (e) {
            showToast("Xatolik!", "x");
        }
    }
    closeFamilyMemberModal();
};

window.deleteFamilyMember = async function(id) {
    if (state.members.length <= 1) {
        alert("Oxirgi oila a'zosini o'chirib bo'lmaydi!");
        return;
    }
    if (!confirm("Ushbu oila a'zosini o'chirishni tasdiqlaysizmi?")) return;
    
    if (state.isDemo) {
        state.members = state.members.filter(m => m.id !== id);
        // Clean up transactions of this member
        state.transactions = state.transactions.filter(t => t.memberId !== id);
        saveLocalData();
        renderUI();
        showToast("Oila a'zosi o'chirildi.", "user-x");
    } else {
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            await deleteDoc(doc(db, `families/${state.family.id}/members`, id));
            showToast("A'zo o'chirildi.", "user-x");
        } catch (e) {
            showToast("Xatolik!", "x");
        }
    }
};

// 3. Budgets Modal
window.openBudgetModal = function() {
    dom.budgetModal.classList.remove('hidden');
    document.getElementById('budget-limit').value = '';
};

window.closeBudgetModal = function() {
    dom.budgetModal.classList.add('hidden');
};

window.handleBudgetSubmit = async function(event) {
    event.preventDefault();
    const category = document.getElementById('budget-category').value;
    const limit = Number(document.getElementById('budget-limit').value);
    
    const budgetData = { category, limit };
    
    if (state.isDemo) {
        // If already exists, overwrite
        const idx = state.budgets.findIndex(b => b.category === category);
        if (idx !== -1) {
            state.budgets[idx].limit = limit;
        } else {
            const newId = 'b-' + Math.random().toString(36).substr(2, 9);
            state.budgets.push({ id: newId, ...budgetData });
        }
        saveLocalData();
        renderUI();
        showToast(`"${category}" limiti belgilandi!`, "gauge");
    } else {
        try {
            const { collection, addDoc, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            // Check if already exists in local list to update
            const existing = state.budgets.find(b => b.category === category);
            if (existing) {
                await setDoc(doc(db, `families/${state.family.id}/budgets`, existing.id), budgetData);
            } else {
                await addDoc(collection(db, `families/${state.family.id}/budgets`), budgetData);
            }
            showToast("Byudjet bulutga yuklandi!", "gauge");
        } catch (e) {
            showToast("Xatolik!", "x");
        }
    }
    closeBudgetModal();
};

window.deleteBudget = async function(id) {
    if (!confirm("Ushbu byudjet limitini o'chirmoqchimisiz?")) return;
    
    if (state.isDemo) {
        state.budgets = state.budgets.filter(b => b.id !== id);
        saveLocalData();
        renderUI();
        showToast("Byudjet limiti o'chirildi.", "trash-2");
    } else {
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            await deleteDoc(doc(db, `families/${state.family.id}/budgets`, id));
            showToast("Byudjet o'chirildi.", "trash-2");
        } catch (e) {
            showToast("Xatolik!", "x");
        }
    }
};

// 4. Goals Modal
window.openGoalModal = function() {
    dom.goalModal.classList.remove('hidden');
    document.getElementById('goal-modal-title').innerText = "Yangi Jamg'arma Maqsadi";
    document.getElementById('goal-mode').value = 'create';
    document.getElementById('goal-btn-submit').innerText = "Maqsadni Yaratish";
    
    document.getElementById('goal-create-fields').classList.remove('hidden');
    document.getElementById('goal-contribute-fields').classList.add('hidden');
    
    document.getElementById('goal-name').value = '';
    document.getElementById('goal-target').value = '';
    document.getElementById('goal-initial').value = '0';
};

window.openContributeGoalModal = function(id) {
    dom.goalModal.classList.remove('hidden');
    document.getElementById('goal-modal-title').innerText = "Jamg'armaga Pul Qo'shish";
    document.getElementById('goal-mode').value = 'contribute';
    document.getElementById('goal-id').value = id;
    document.getElementById('goal-btn-submit').innerText = "Jamg'arish";
    
    document.getElementById('goal-create-fields').classList.add('hidden');
    document.getElementById('goal-contribute-fields').classList.remove('hidden');
    document.getElementById('goal-contribute-amount').value = '';
};

window.closeGoalModal = function() {
    dom.goalModal.classList.add('hidden');
};

window.handleGoalSubmit = async function(event) {
    event.preventDefault();
    const mode = document.getElementById('goal-mode').value;
    const id = document.getElementById('goal-id').value;
    
    if (mode === 'create') {
        const name = document.getElementById('goal-name').value.trim();
        const target = Number(document.getElementById('goal-target').value);
        const saved = Number(document.getElementById('goal-initial').value) || 0;
        
        if (!name || target <= 0) return;
        
        const goalData = { name, target, saved };
        
        if (state.isDemo) {
            const newId = 'g-' + Math.random().toString(36).substr(2, 9);
            state.goals.push({ id: newId, ...goalData });
            saveLocalData();
            renderUI();
            showToast("Yangi jamg'arma maqsadi yaratildi!", "target");
        } else {
            try {
                const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                await addDoc(collection(db, `families/${state.family.id}/goals`), goalData);
                showToast("Maqsad bulutga qo'shildi!", "target");
            } catch (e) {
                showToast("Xatolik!", "x");
            }
        }
    } else {
        // Contribute funds to existing goal
        const amount = Number(document.getElementById('goal-contribute-amount').value);
        const wallet = document.getElementById('goal-contribute-wallet').value;
        if (amount <= 0) return;
        
        const goal = state.goals.find(g => g.id === id);
        if (!goal) return;
        
        const newSaved = Number(goal.saved) + amount;
        
        // Add a micro-transaction record for this savings contribution as an expense type
        const newTrans = {
            amount: amount,
            category: 'Boshqa',
            wallet: wallet,
            memberId: state.members[0]?.id || 'm1',
            date: new Date().toISOString().split('T')[0],
            description: `Jamg'arma: "${goal.name}" uchun`,
            type: 'expense'
        };
        
        if (state.isDemo) {
            goal.saved = newSaved;
            
            const newId = 't-' + Math.random().toString(36).substr(2, 9);
            state.transactions.unshift({ id: newId, ...newTrans });
            
            saveLocalData();
            renderUI();
            showToast(`Jamg'armaga ${formatMoney(amount)} qo'shildi!`, "check");
        } else {
            try {
                const { doc, updateDoc, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                await updateDoc(doc(db, `families/${state.family.id}/goals`, id), { saved: newSaved });
                await addDoc(collection(db, `families/${state.family.id}/transactions`), newTrans);
                showToast("Pul jamg'arildi va xabarlar sinxronlandi!", "check");
            } catch (e) {
                showToast("Xatolik!", "x");
            }
        }
    }
    closeGoalModal();
};

window.deleteGoal = async function(id) {
    if (!confirm("Ushbu maqsadni o'chirmoqchimisiz?")) return;
    
    if (state.isDemo) {
        state.goals = state.goals.filter(g => g.id !== id);
        saveLocalData();
        renderUI();
        showToast("Jamg'arma maqsadi o'chirildi.", "trash-2");
    } else {
        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            await deleteDoc(doc(db, `families/${state.family.id}/goals`, id));
            showToast("Maqsad bulutdan o'chirildi.", "trash-2");
        } catch (e) {
            showToast("Xatolik!", "x");
        }
    }
};

// --- TRANSACTIONS HISTORY & FILTERS PANEL ---

window.applyFilters = function() {
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;
    const memberId = document.getElementById('filter-member').value;
    const sort = document.getElementById('filter-sort').value;
    
    let filtered = [...state.transactions];
    
    // Global Search filter
    if (state.searchQuery.trim() !== '') {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(query) || 
            t.category.toLowerCase().includes(query) ||
            t.wallet.toLowerCase().includes(query)
        );
    }
    
    // Type Filter
    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }
    
    // Category Filter
    if (category !== 'all') {
        filtered = filtered.filter(t => t.category === category);
    }
    
    // Member Filter
    if (memberId !== 'all') {
        filtered = filtered.filter(t => t.memberId === memberId);
    }
    
    // Sort
    if (sort === 'date-desc') {
        filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
    } else if (sort === 'date-asc') {
        filtered.sort((a,b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'amount-desc') {
        filtered.sort((a,b) => Number(b.amount) - Number(a.amount));
    } else if (sort === 'amount-asc') {
        filtered.sort((a,b) => Number(a.amount) - Number(b.amount));
    }
    
    renderTransactionsTable(filtered);
};

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-table-body');
    const emptyMsg = document.getElementById('transactions-empty');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }
    
    emptyMsg.classList.add('hidden');
    tbody.innerHTML = transactions.map(t => {
        const member = state.members.find(m => m.id === t.memberId) || { name: 'Noma\'lum' };
        const typeBadgeClass = t.type === 'income' ? 'income' : 'expense';
        const typeText = t.type === 'income' ? 'Daromad' : 'Xarajat';
        const amountColorClass = t.type === 'income' ? 'text-success' : 'text-danger';
        const sign = t.type === 'income' ? '+' : '-';
        
        return `
            <tr>
                <td>${t.date}</td>
                <td>
                    <div style="font-weight:600;">${t.description}</div>
                    <span class="text-secondary small">${t.category}</span>
                </td>
                <td><span class="trans-user-badge">${member.name}</span></td>
                <td>${t.wallet}</td>
                <td><span class="badge-trans ${typeBadgeClass}">${typeText}</span></td>
                <td><strong class="${amountColorClass}">${sign}${formatMoney(t.amount)}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="editTransaction('${t.id}')" title="Tahrirlash"><i data-lucide="edit-3" style="width:16px;"></i></button>
                        <button class="btn-icon delete" onclick="deleteTransaction('${t.id}')" title="O'chirish"><i data-lucide="trash-2" style="width:16px;"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    lucide.createIcons();
}

window.handleGlobalSearch = function(value) {
    state.searchQuery = value;
    // Auto switch to transactions section if they are searching and not already there
    if (state.activeSection !== 'transactions' && value.trim() !== '') {
        switchSection('transactions');
    }
    applyFilters();
};

// --- SETTINGS: FIREBASE INTEGRATION & BACKUPS ---

window.saveFirebaseConfig = function() {
    const configText = document.getElementById('settings-firebase-config').value.trim();
    if (!configText) {
        showToast("Iltimos, JSON formatidagi konfiguratsiyani kiriting!", "alert-triangle");
        return;
    }
    
    try {
        const config = JSON.parse(configText);
        
        // Save to localStorage
        localStorage.setItem('firebase_config', JSON.stringify(config));
        
        showToast("Firebase Config saqlandi! Ilova qayta yuklanmoqda...", "check");
        
        // Wait 1.5s then reload to initialize Firebase
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (e) {
        showToast("JSON sintaksisi xato! Konfiguratsiyani tekshiring.", "x");
    }
};

window.clearFirebaseConfig = function() {
    if (confirm("Firebase ulanishini o'chirmoqchimisiz? Dastur lokal demo rejimga qaytadi.")) {
        localStorage.removeItem('firebase_config');
        showToast("Firebase konfiguratsiyasi o'chirildi! Qayta yuklanmoqda...", "check");
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
};

function updateFirebaseUIStatus(isConnected) {
    const alertBox = document.getElementById('firebase-status-alert');
    if (!alertBox) return;
    
    if (isConnected) {
        alertBox.className = "alert alert-info";
        alertBox.innerHTML = `
            <i data-lucide="cloud-lightning"></i>
            <div>
                <strong>Firebase Bulutli Rejim Faol!</strong>
                <p>Ma'lumotlaringiz xavfsiz ravishda Firebase Firestore bulutli bazasida saqlanmoqda va barcha a'zolarga real-vaqtda sinxronlanmoqda.</p>
            </div>
        `;
    } else {
        alertBox.className = "alert alert-warning";
        alertBox.innerHTML = `
            <i data-lucide="alert-triangle"></i>
            <div>
                <strong>Avtonom (Lokal Demo) Rejim!</strong>
                <p>Ilova faqat ushbu qurilmada ishlaydi. Dunyo bo'ylab oila a'zolaringizni ulash uchun o'ngdagi Firebase konfiguratsiyasini kiriting.</p>
            </div>
        `;
    }
    lucide.createIcons();
}

// 1. Export Data to JSON File
window.exportDataJSON = function() {
    const backupData = {
        exportedAt: new Date().toISOString(),
        members: state.members,
        transactions: state.transactions,
        budgets: state.budgets,
        goals: state.goals
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `OilaMoliya_Zaxira_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Zaxira nusxasi yuklab olindi!", "check");
};

// 2. Import Data from JSON File
window.importDataJSON = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (!imported.members || !imported.transactions) {
                throw new Error("Fayl formati yaroqsiz!");
            }
            
            if (confirm("Diqqat! Ushbu fayldagi ma'lumotlarni tiklash hozirgi ma'lumotlarni o'chirib yuboradi. Davom etasizmi?")) {
                if (state.isDemo) {
                    state.members = imported.members;
                    state.transactions = imported.transactions;
                    state.budgets = imported.budgets || [];
                    state.goals = imported.goals || [];
                    saveLocalData();
                    renderUI();
                    showToast("Zaxira nusxasi muvaffaqiyatli tiklandi!", "check");
                } else {
                    // Restore to Firebase Firestore
                    showToast("Bulutga yuklanmoqda...", "loader");
                    const { doc, setDoc, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                    
                    const familyRef = `families/${state.family.id}`;
                    
                    // Upload members
                    for (const m of imported.members) {
                        const mData = { name: m.name, role: m.role, avatar: m.avatar || m.name.charAt(0) };
                        await setDoc(doc(db, `${familyRef}/members`, m.id), mData);
                    }
                    
                    // Upload transactions
                    for (const t of imported.transactions) {
                        const tData = {
                            amount: t.amount, category: t.category, wallet: t.wallet,
                            memberId: t.memberId, date: t.date, description: t.description, type: t.type
                        };
                        await setDoc(doc(db, `${familyRef}/transactions`, t.id), tData);
                    }
                    
                    // Upload budgets
                    if (imported.budgets) {
                        for (const b of imported.budgets) {
                            await setDoc(doc(db, `${familyRef}/budgets`, b.id), { category: b.category, limit: b.limit });
                        }
                    }
                    
                    // Upload goals
                    if (imported.goals) {
                        for (const g of imported.goals) {
                            await setDoc(doc(db, `${familyRef}/goals`, g.id), { name: g.name, target: g.target, saved: g.saved });
                        }
                    }
                    
                    showToast("Bulutli zaxira to'liq tiklandi!", "check");
                }
            }
        } catch (err) {
            showToast("Xato: Zaxira fayli yaroqsiz!", "x");
            console.error(err);
        }
    };
    reader.readAsText(file);
};

// --- UTILITY TOAST NOTIFICATIONS ---
let toastTimeout = null;
window.showToast = function(message, iconName = 'info') {
    if (toastTimeout) clearTimeout(toastTimeout);
    
    dom.toastMessage.innerText = message;
    const iconSpan = dom.toast.querySelector('.toast-icon');
    if (iconSpan) {
        iconSpan.setAttribute('data-lucide', iconName);
        lucide.createIcons();
    }
    
    dom.toast.classList.remove('hidden');
    
    toastTimeout = setTimeout(() => {
        dom.toast.classList.add('hidden');
    }, 4000);
};

// Copy invite code helper
window.copyInviteCode = function() {
    const code = dom.shareInviteCode.innerText;
    if (code.includes("FAM-XXXX") || code.includes("DEMO")) {
        showToast("Faqat bulutli rejimda oila kodi faol bo'ladi!", "alert-triangle");
        return;
    }
    navigator.clipboard.writeText(code).then(() => {
        showToast("Oila taklif kodi buferga nusxalandi!", "copy");
    }).catch(err => {
        showToast("Nusxalab bo'lmadi!", "x");
    });
};

// Theme Toggle Logic
window.toggleTheme = function() {
    const isDark = document.body.classList.contains('dark-mode') || !document.body.classList.contains('light-mode');
    if (isDark) {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
    
    window.updateThemeToggleIcon();
    renderCharts();
};

window.updateThemeToggleIcon = function() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const isLight = document.body.classList.contains('light-mode');
    btn.innerHTML = `<i data-lucide="${isLight ? 'moon' : 'sun'}" style="width: 18px; height: 18px;"></i>`;
    if (window.lucide) {
        window.lucide.createIcons();
    }
};
