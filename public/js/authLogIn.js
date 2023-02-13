  const emailError = document.querySelector('.email.error');
  const passwordError = document.querySelector('.password.error');
  const logIn = document.querySelector('#login_form');
  logIn.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('In Log in handler');
    // reset errors
    emailError.textContent = '';
    passwordError.textContent = '';
    // get values
    const email = logIn.email.value;
    const password = logIn.password.value;
    console.log(
      email, password
    );
    try {
      const res = await fetch('/auth/login', { 
        method: 'POST', 
        body: JSON.stringify({ email, password}),
        headers: {'Content-Type': 'application/json'}
      });
      const data = await res.json();
      console.log(data);
      if (data.errors) {
        emailError.textContent = data.errors.email;
        passwordError.textContent = data.errors.password;
      }
      if (data.user) {
        location.assign('/home');
      }
    }
    catch (err) {
      console.log(err);
    }
  });