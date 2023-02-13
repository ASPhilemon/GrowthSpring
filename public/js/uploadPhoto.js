const photoForm = document.querySelector("#upload-photo-form");
const reqPhotoStatus = document.querySelector(".reqPhotoStatus");

photoForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  //reset reqPhotoStatus
  reqPhotoStatus.innerHTML = 
  `<div class="d-flex"> 
    <p class="me-3">Uploading picture </p>
    <p class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
    </p>
  </div>`
  reqPhotoStatus.classList.remove("text-primary");
  // Create payload as new FormData object:
  const formData = new FormData(photoForm);
  const payload = new URLSearchParams(formData);
  // Post the payload using Fetch:
  fetch('/profile-photo', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => responseHandler(data))
  });

function responseHandler(data){
  
  //sucecss handler
  if (data.success){
    console.log("in success handler");
    reqPhotoStatus.innerHTML = "Upload successful";
    reqPhotoStatus.classList.remove("text-danger");
    reqPhotoStatus.classList.add("text-success");
    setTimeout(()=>{
      location.assign('/home');
    }, 2000)
  }
  //error handler
  if (data.error){
    reqPhotoStatus.innerHTML = data.error;
    reqPhotoStatus.classList.add("text-danger")
  }
  
}