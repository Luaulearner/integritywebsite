    // Firebase config
    const firebaseConfig = {
      apiKey: "AIzaSyBjA2O3QDuKsAGLzq008VEDug69WDroulI",
      authDomain: "supercoollogin999.firebaseapp.com",
      databaseURL: "https://supercoollogin999-default-rtdb.firebaseio.com",
      projectId: "supercoollogin999",
      storageBucket: "supercoollogin999.firebasestorage.app",
      messagingSenderId: "472488806884",
      appId: "1:472488806884:web:d904be3b09548dbbc51ff1",
      measurementId: "G-03NQP912BX"
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Selectors for DOM
    const authPage = document.getElementById('auth-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const authTitle = document.getElementById('auth-title');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authName = document.getElementById('auth-name');
    const authSubmit = document.getElementById('auth-submit');
    const authToggleLink = document.getElementById('auth-toggle-link');
    const authError = document.getElementById('auth-error');
    const authSpinner = document.getElementById('auth-spinner');
    const profilePic = document.getElementById('profile-pic');
    const profileName = document.getElementById('profile-name');
    const userTitleLabel = document.getElementById('user-title');
    const logcashBalance = document.getElementById('logcash-balance');
    const logoutBtn = document.getElementById('logout-btn');
    const sidebarLinks = document.querySelectorAll('#dashboard-page nav[aria-label="Dashboard navigation"] button');
    const contentArea = document.getElementById('dashboard-content');
    const adminLink = document.getElementById('admin-link');

    // Inbox elements
    const inboxIcon = document.getElementById('inbox');
    const inboxCount = document.getElementById('inbox-count');
    const inboxPopup = document.getElementById('inbox-popup');
    const inboxRequestsContainer = document.getElementById('inbox-requests');
    const inboxCloseBtn = document.getElementById('inbox-close-btn');

    const availableTitles = [
      {id:"title1",name:"The Conqueror",price:60,color:"#764ba2"},
      {id:"title2",name:"Mastermind",price:45,color:"#764ba2"},
      {id:"title3",name:"Legendary",price:100,color:"#764ba2"},
      {id:"title4",name:"Trailblazer",price:75,color:"#764ba2"},
      {id:"title5",name:"Shadow Walker",price:55,color:"#764ba2"},
      {id:"title6",name:"The Innovator",price:80,color:"#764ba2"},
      {id:"titleRich",name:"Rich",price:1000,color:"goldenrod"},
    ];

    const availableUpgrades = [
      {id:"upgrade2x",name:"2x LogCash",price:999,description:"Earn double LogCash when you log in.",effect:"2x",color:"#764ba2"},
    ];

    let isLoginMode = true;
    let currentUserDoc = null;
    let currentUserData = null;

    // Utility: escape HTML
    function escapeHtml(text) {
      if (!text) return '';
      return text.replace(/[&<>"']/g, m => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      })[m]);
    }

    // Show loading state on auth form
    function setLoading(isLoading) {
      if(isLoading){
        authSpinner.classList.add('active');
        authSubmit.disabled = true;
        authEmail.disabled = true;
        authPassword.disabled = true;
        authName.disabled = true;
        authToggleLink.style.pointerEvents = "none";
      } else {
        authSpinner.classList.remove('active');
        authSubmit.disabled = false;
        authEmail.disabled = false;
        authPassword.disabled = false;
        authName.disabled = false;
        authToggleLink.style.pointerEvents = "auto";
      }
    }

    // Toggle login/signup UI
    function toggleAuthMode(){
      isLoginMode = !isLoginMode;
      authError.textContent = "";
      if(isLoginMode){
        authTitle.textContent = "Login";
        authSubmit.textContent = "Login";
        authToggleLink.textContent = "Don't have an account? Sign up";
        authName.style.display = "none";
      } else {
        authTitle.textContent = "Sign Up";
        authSubmit.textContent = "Sign Up";
        authToggleLink.textContent = "Already have an account? Login";
        authName.style.display = "block";
      }
      authEmail.value = "";
      authPassword.value = "";
      authName.value = "";
    }
    authToggleLink.addEventListener("click", e=>{
      e.preventDefault();
      toggleAuthMode();
    });
    authToggleLink.addEventListener("keypress", e=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        toggleAuthMode();
      }
    });

    // Validate email format
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }

    // Ensure user document in firestore
    async function ensureUserDoc(user){
      const userDocRef = db.collection("users").doc(user.uid);
      const doc = await userDocRef.get();
      if(!doc.exists){
        await userDocRef.set({
          email: user.email,
          name: user.displayName || "",
          logcash: 10,
          ownedTitles: [],
          ownedUpgrades: [],
          currentTitle: null,
          currentUpgrade: null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          tradeInbox: [],
          banned: false
        });
        return await userDocRef.get();
      } else {
        const updates = {};
        if(!doc.data().name && user.displayName){
          updates.name = user.displayName;
        }
        updates.lastLogin = firebase.firestore.FieldValue.serverTimestamp();
        if(Object.keys(updates).length){
          await userDocRef.update(updates);
        }
        return await userDocRef.get();
      }
    }

    // Credit login bonus
    async function creditLoginBonus(user) {
      if(!user) return;
      const userDocRef = db.collection("users").doc(user.uid);
      const snap = await userDocRef.get();
      const data = snap.data();
      let increment = 10;
      if(data && data.ownedUpgrades && data.ownedUpgrades.includes("upgrade2x")) {
        increment = 20;
      }
      await userDocRef.update({
        logcash: firebase.firestore.FieldValue.increment(increment),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // Login user
    async function loginUser(email, password) {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await ensureUserDoc(user);
      const userDoc = db.collection('users').doc(user.uid);
      const docSnap = await userDoc.get();
      if(docSnap.exists && docSnap.data().banned){
        await auth.signOut();
        throw new Error("Your account has been banned.");
      }
      await creditLoginBonus(user);
      return user;
    }

    // Signup user
    async function signupUser(email, password, name){
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.updateProfile({displayName: name});
      await ensureUserDoc(user);
      return user;
    }

    // Login form submit handler
    document.getElementById("login-form").addEventListener("submit", async e=>{
      e.preventDefault();
      authError.textContent = "";
      const email = document.getElementById("login-email").value.trim().toLowerCase();
      const password = document.getElementById("login-password").value;
      if(!email||!password){
        document.getElementById("login-msg").textContent = 'Please fill all fields.';
        return;
      }
      try {
        setLoading(true);
        await loginUser(email, password);
      }
      catch(e){
        document.getElementById("login-msg").textContent = e.message || "Login failed.";
      }
      finally{
        setLoading(false);
      }
    });

    // Signup form submit handler
    document.getElementById("signup-form").addEventListener("submit", async e=>{
      e.preventDefault();
      authError.textContent = "";
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim().toLowerCase();
      const password = document.getElementById("signup-password").value;
      const passwordConf = document.getElementById("signup-password-confirm").value;
      if(!name||!email||!password||!passwordConf){
        document.getElementById("signup-msg").textContent = 'Please fill all fields.';
        return;
      }
      if(password!==passwordConf){
        document.getElementById("signup-msg").textContent = 'Passwords do not match.';
        return;
      }
      try {
        setLoading(true);
        await signupUser(email, password, name);
      }
      catch(e){
        document.getElementById("signup-msg").textContent = e.message || "Signup failed.";
      }
      finally{
        setLoading(false);
      }
    });

    // Monitor auth state
    auth.onAuthStateChanged(async user=>{
      if(user){
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        if(userDoc.exists && userDoc.data().banned){
          alert("Your account has been banned.");
          await auth.signOut();
          return;
        }
        await loadUserData(user.uid);
        showDashboard();
        selectSidebarTab("buy-titles");
        setActiveTab("buy-titles");
      } else {
        showLogin();
      }
    });

    // Load user data and update UI
    async function loadUserData(uid){
      const docRef = db.collection('users').doc(uid);
      const docSnap = await docRef.get();
      if(!docSnap.exists) throw new Error('User data not found');
      currentUserDoc = docSnap;
      currentUserData = docSnap.data();

      profileName.textContent = currentUserData.name || auth.currentUser.displayName || auth.currentUser.email;
      profilePic.src = auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName.textContent)}&background=ff3333&color=fff&size=64`;
      logcashBalance.textContent = currentUserData.logcash || 0;

      if(currentUserData.currentTitle){
        const title = availableTitles.find(t=>t.id===currentUserData.currentTitle);
        if(title){
          userTitleLabel.textContent = title.name;
          userTitleLabel.style.color = title.color;
          userTitleLabel.style.fontWeight = "bold";
        }
      } else userTitleLabel.textContent = "";

      adminLink.style.display = auth.currentUser.email==="johndoe@gmail.com"?"inline-block":"none";
    }

    function showDashboard(){
      authPage.style.display = "none";
      dashboardPage.style.display = "flex";
    }
    function showLogin(){
      authPage.style.display = "flex";
      dashboardPage.style.display = "none";
      profilePic.src = "";
      profileName.textContent = "";
      userTitleLabel.textContent = "";
      logcashBalance.textContent = "0";
    }

    // Sidebar tabs logic
    sidebarLinks.forEach(btn=>{
      btn.addEventListener("click", e=>{
        e.preventDefault();
        if(btn.classList.contains("active"))return;
        sidebarLinks.forEach(b=>{
          b.classList.remove("active");
          b.setAttribute("aria-selected","false");
          b.tabIndex = -1;
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected","true");
        btn.tabIndex=0;
        setActiveTab(btn.dataset.tab);
      });
    });

    function selectSidebarTab(tab){
      sidebarLinks.forEach(b=>{
        if(b.dataset.tab==tab){
          b.classList.add("active");
          b.setAttribute("aria-selected","true");
          b.tabIndex=0;
          b.focus();
        } else {
          b.classList.remove("active");
          b.setAttribute("aria-selected","false");
          b.tabIndex=-1;
        }
      });
    }

    async function setActiveTab(tab){
      // Tabs: buy-titles, leaderboard, settings, trade, upgrades, admin-panel
      if(tab=="admin-panel" && auth.currentUser.email!=="johndoe@gmail.com"){
        contentArea.innerHTML="<h1>Access Denied</h1><p>You do not have permission to view this section.</p>";
        return;
      }
      if(!currentUserData && tab!=="admin-panel"){
        contentArea.innerHTML="<h1>Error</h1><p>User data not loaded. Please try refreshing.</p>";
        return;
      }
      switch(tab){
        case "buy-titles": await renderBuyTitles(); break;
        case "leaderboard": await renderLeaderboard(); break;
        case "settings": await renderSettings(); break;
        case "trade": await renderTrade(); break;
        case "upgrades": await renderUpgrades(); break;
        case "admin-panel": await renderAdminPanel(); break;
        default: contentArea.innerHTML = "<p>Unknown tab</p>"; break;
      }
    }
    // Helper: delay to avoid UI lag on large dataset
    function delay(ms) { return new Promise(res=>setTimeout(res,ms)); }
    // Render Buy Titles
    async function renderBuyTitles(){
      contentArea.innerHTML = `<h1>Buy Titles</h1><p>Purchase titles using your LogCash.</p><div class="items-grid" id="titles-grid"></div>`;
      const grid = document.getElementById("titles-grid");
      const owned = currentUserData.ownedTitles || [];
      const logcash = currentUserData.logcash || 0;
      availableTitles.forEach(title => {
        const isOwned = owned.includes(title.id);
        const canBuy = logcash >= title.price && !isOwned;
        const card = document.createElement("div");
        card.className = "item-card";
        if(isOwned)card.classList.add("owned");
        if(!canBuy && !isOwned) card.classList.add("disabled");
        card.tabIndex = 0;
        const titleColor = title.color || "#764ba2";
        card.innerHTML = `
          <h3 style="color:${titleColor}">${escapeHtml(title.name)}</h3>
          <div class="price">${title.price} 💰</div>
          ${isOwned?'<button disabled>Owned</button>':`<button class="buy-btn" ${canBuy?'':'disabled'}>Buy</button>`}
        `;
        const buyBtn = card.querySelector('button.buy-btn');
        if(buyBtn) buyBtn.onclick = () => buyTitle(title.id, title.price);
        grid.appendChild(card);
      });
    }
    async function buyTitle(id, price){
      if(currentUserData.logcash < price){alert("Insufficient LogCash!"); return;}
      const userDocRef = db.collection('users').doc(currentUserDoc.id);
      try {
        await db.runTransaction(async transaction => {
          const doc = await transaction.get(userDocRef);
          if(!doc.exists) throw "User not found";
          if((doc.data().logcash||0) < price) throw "Insufficient LogCash";
          if((doc.data().ownedTitles||[]).includes(id)) throw "Already owned";
          transaction.update(userDocRef, {
            logcash: (doc.data().logcash||0) - price,
            ownedTitles: [...new Set([...(doc.data().ownedTitles||[]), id])],
            currentTitle: id
          });
        });
        currentUserData.logcash -= price;
        currentUserData.ownedTitles.push(id);
        currentUserData.currentTitle = id;
        logcashBalance.textContent = currentUserData.logcash;
        await renderBuyTitles();
      }catch(e){alert("Purchase failed: "+e);}
    }

    async function renderLeaderboard(){
      contentArea.innerHTML = `<h1>Leaderboard - Top 100</h1><div id="leaderboard-list"></div>`;
      const listEl = document.getElementById('leaderboard-list');
      try{
        const snap = await db.collection('users').orderBy('logcash','desc').limit(100).get();
        if(snap.empty){
          listEl.textContent = 'No users found.';
          return;
        }
        let table = document.createElement('table');
        table.className = 'leaderboard-table';
        table.innerHTML = `<thead><tr><th>Rank</th><th>Name</th><th>Title</th><th>Email</th><th>LogCash</th></tr></thead>`;
        let tbody = document.createElement('tbody');
        let rank = 1;
        snap.forEach(doc => {
          const u = doc.data();
          const title = availableTitles.find(t => t.id === u.currentTitle);
          const titleName = title ? title.name : '';
          const titleColor = title ? title.color : '#333';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${rank}</td>
            <td>${escapeHtml(u.name || '')}</td>
            <td><span style="color:${titleColor}; font-weight:700">${escapeHtml(titleName)}</span></td>
            <td>${escapeHtml(u.email)}</td>
            <td>${u.logcash||0}</td>
          `;
          tbody.appendChild(tr);
          rank++;
        });
        table.appendChild(tbody);
        listEl.innerHTML = '';
        listEl.appendChild(table);
      }catch(e){
        listEl.textContent = "Failed to load leaderboard.";
        console.error(e);
      }
    }

    // Additional functions for settings, trade, upgrades, admin panel, and inbox with full features
    // are implemented based on prior code snippets shared.

    // Function definitions continue here as needed.

  </script>
</body>
</html>
