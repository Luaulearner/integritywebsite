const formTitle = document.getElementById("form-title");
const toggleLink = document.getElementById("toggle-link");
const extraField = document.getElementById("extra-field");
const submitBtn = document.getElementById("submit-btn");
const form = document.getElementById("auth-form");

let isLogin = true;

toggleLink.onclick = () => {
  isLogin = !isLogin;
  formTitle.textContent = isLogin ? "Log In" : "Sign Up";
  submitBtn.textContent = isLogin ? "Log In" : "Sign Up";
  toggleLink.textContent = isLogin ? "Sign Up" : "Log In";
  document.querySelector(".toggle-text").childNodes[0].textContent = isLogin
    ? "Don't have an account? "
    : "Already have an account? ";
  extraField.classList.toggle("hidden", isLogin);
};

form.onsubmit = (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const email = document.getElementById("email").value;

  if (isLogin) {
    alert(`Logging in as ${username}...`);
  } else {
    alert(`Signing up ${username} (${email})...`);
  }
};