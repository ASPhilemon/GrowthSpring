const emailError = document.querySelector('.error.email');
const passwordError = document.querySelector('.error.password');

const passwordReset = document.querySelector('#password_reset_form');
passwordReset.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('In password reset handler');
  // reset error
  emailError.textContent = '';
  passwordError.textContent = "";
  // get values
  const email = passwordReset.email.value;
  const password1 = passwordReset.password1.value;
  const password2 = passwordReset.password2.value;
  try {
    const res = await fetch('/auth/forgot-password', { 
      method: 'POST', 
      body: JSON.stringify({ email, password1, password2 }),
      headers: {'Content-Type': 'application/json'}
    });
    const data = await res.json();
    console.log(data);
    if (data.error ==="passwords do not match") {
      passwordError.textContent = "passwords do not match";
    }
    if (data.error ==="User Not Found !!!") {
        emailError.textContent = "User Not Found !!!";
      }
      if (data.error ==="Minimum password length is 6 characters") {
        passwordError.textContent = "Minimum password length is 6 characters";
      }
    if (data.user) {
      location.assign('/auth/password_reset_sent');
    }
  }
  catch (err) {
    console.log(err);
  }
});

