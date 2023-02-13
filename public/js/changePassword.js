const currentPassError = document.querySelector('.error.current-password');
const newPassError = document.querySelector('.error.new-password');
const reqStatus = document.querySelector('.status');
const btnChangePassword = document.querySelector('.btnChangePassword');
const passwordChange = document.querySelector('#change-password-form');
passwordChange.addEventListener('submit', async (e) => {
  console.log('In password change handler');
  e.preventDefault();
  //disable input fields and submit button
  passwordChange.currentPassword.setAttribute("disabled", true);
  passwordChange.newPassword.setAttribute("disabled", true);
  passwordChange.comfirmPassword.setAttribute("disabled", true);
  btnChangePassword.setAttribute("disabled", true);
  //Updating your password ...
  reqStatus.innerHTML = 
  `<div class="d-flex"> 
    <p class="me-3">Updating your password</p>
    <p class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
    </p>
  </div>`
  // Reset errors
  currentPassError.textContent = '';
  newPassError.textContent = '';
  reqStatus.classList.remove("error");
  reqStatus.classList.remove("text-success");
  reqStatus.classList.add("text-primary");

  // get values
  const currentPassword = passwordChange.currentPassword.value;
  const newPassword = passwordChange.newPassword.value;
  const comfirmPassword = passwordChange.comfirmPassword.value;
  try {
    const res = await fetch('/auth/change-password', { 
      method: 'POST', 
      body: JSON.stringify({ currentPassword, newPassword, comfirmPassword }),
      headers: {'Content-Type': 'application/json'}
    });
    const data = await res.json();
      //Enable input fields and submit button
      passwordChange.currentPassword.removeAttribute("disabled");
      passwordChange.newPassword.removeAttribute("disabled");
      passwordChange.comfirmPassword.removeAttribute("disabled");
      btnChangePassword.removeAttribute("disabled");
    console.log(data);
    if (data.error ==="incorrect password") {
      currentPassError.textContent = "Incorrect password";
      reqStatus.innerHTML = "";
      reqStatus.classList.remove("text-success")
    }
    if (data.error ==="passwords do not match") {
        newPassError.textContent = "Passwords do not match";
        reqStatus.innerHTML = "";
        reqStatus.classList.remove("text-success")
      }
      if (data.error ==="Minimum password length is 6 characters") {
        newPassError.textContent = "Minimum password length is 6 characters";
        reqStatus.innerHTML = "";
        reqStatus.classList.remove("text-success")
      }
    if (data.success) {
      reqStatus.classList.add("text-success")
      reqStatus.innerHTML = "Your password has been successfully updated. Use your new password next time you log in"
  
    }
  }
  catch (err) {
    console.log(err);
    reqStatus.classList.remove("text-primary");
    reqStatus.classList.remove("text-success")
    reqStatus.classList.add("error");
    reqStatus.textContent = "An error occured updating your password. Try again later";
    //Enable input fields and submit button
    passwordChange.currentPassword.removeAttribute("disabled");
    passwordChange.newPassword.removeAttribute("disabled");
    passwordChange.comfirmPassword.removeAttribute("disabled");
    btnChangePassword.removeAttribute("disabled");
  }
});

//reset form on closing modal
const closeModal = document.querySelector(".closeModal");
closeModal.addEventListener("click", function () {
    console.log("modal closed");
    // Reset errors
    currentPassError.textContent = '';
    newPassError.textContent = '';
    //Reset status
    reqStatus.innerHTML = "";
    reqStatus.classList.remove("text-success")
    reqStatus.classList.remove("error");
    reqStatus.classList.add("text-primary");
    //Reset form inputs
    passwordChange.currentPassword.value = "";
    const newPassword = passwordChange.newPassword.value = "";
    const comfirmPassword = passwordChange.comfirmPassword.value = "";

});