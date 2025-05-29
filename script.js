// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyBjA2O3QDuKsAGLzq008VEDug69WDroulI",
  authDomain: "supercoollogin999.firebaseapp.com",
  databaseURL: "https://supercoollogin999-default-rtdb.firebaseio.com/",
  projectId: "supercoollogin999",
};
firebase.initializeApp(firebaseConfig);

const db = firebase.database();

function showNotification(text) {
  const notif = document.getElementById("notif");
  notif.textContent = text;
  notif.style.color = "lime";
  setTimeout(() => notif.textContent = "", 3000);
}

function signUp() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  db.ref("users/" + user).get().then((snap) => {
    if (snap.exists()) {
      showNotification("Username already exists!");
    } else {
      firebase.auth().createUserWithEmailAndPassword(`${user}@fake.com`, pass)
        .then(() => {
          db.ref("users/" + user).set({
            logcash: 2,
            style: "default"
          });
          showMainUI(user);
        });
    }
  });
}

function logIn() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(`${user}@fake.com`, pass)
    .then(() => {
      showMainUI(user);
    }).catch(() => {
      showNotification("Wrong credentials!");
    });
}

function showMainUI(username) {
  document.getElementById("auth-ui").style.display = "none";
  document.getElementById("main-ui").style.display = "block";
  document.getElementById("user-name").textContent = username;

  db.ref("users/" + username + "/logcash").get().then(snap => {
    document.getElementById("logcash").textContent = snap.val();
  });
}

function buyStyle() {
  const username = document.getElementById("user-name").textContent;
  const logcashRef = db.ref("users/" + username + "/logcash");

  logcashRef.get().then(snap => {
    let current = snap.val();
    if (current >= 4) {
      logcashRef.set(current - 4);
      db.ref("users/" + username + "/style").set("cool-style");
      document.body.style.background = "linear-gradient(to right, #000046, #1CB5E0)";
      alert("New UI Style Applied!");
      document.getElementById("logcash").textContent = current - 4;
    } else {
      alert("Not enough LogCash!");
    }
  });
}