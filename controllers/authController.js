const User = require("../models/User");
const sendMail = require("./email");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const formidable = require('formidable');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

// Handle Errors from Log In
const handleErrors = (err) => {
  let errors = { email: '', password: '' };
  // incorrect password error from log in attempt
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // incorrect email from log in attempt
  if (err.message === 'incorrect email') {
    errors.email = 'User Not Found !!!';
  }
  return errors;
}

// create json web token
const maxAge = 3 * 24 * 60 * 60; //3 days
const createToken = (id) => {
  return jwt.sign({ id }, 'net ninja secret', {
    expiresIn: maxAge
  });
};

// controller actions
//Log In
module.exports.login_get = (req, res) => {
  res.render('auth_views/login');
}
module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } 
  catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }

}

//Log Out
module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/auth/login');
}

//Reset password
module.exports.password_reset_get = (req, res) => {
  res.render('auth_views/password_reset');
}

module.exports.password_reset_post = async (req, res) => {
  const {email, password1, password2}  = req.body;
  try{
    if (!(password1===password2)){
      throw Error('passwords do not match')
    }
    if (password1.length < 6){
      throw Error("Minimum password length is 6 characters")
    }
    const user = await User.findOne({email});
    if (user){
      //Send password reset email
      const token = createToken(user._id);
      const emailRecipient = user.email;
      const emailSubject = "Password Reset 4";
      let emailFile = ""
      emailFile = path.join(__dirname ,  "../" ,  "/views/email_views/passwordReset.html");
      ejs.renderFile(emailFile, {token, password1}, function (err, data) {
        if (err){
        } else {
          sendMail(emailRecipient, emailSubject, data);
          res.json({user});
        }
      });
    } else{
      throw Error("User Not Found !!!")
    }
  } catch(err){
    if (err.message === 'passwords do not match'){
      res.status(400).json({error: "passwords do not match"})
    }
    if (err.message === "Minimum password length is 6 characters"){
      res.status(400).json({error: "Minimum password length is 6 characters"})
    }
    if (err.message === "User Not Found !!!"){
      res.status(400).json({error: "User Not Found !!!"})
    }
  }
}

//Reset password email sent confirmation
module.exports.password_reset_sent = (req, res) => {
  res.render('auth_views/password_reset_sent');
}

//Verify token from forgot password and update user password
module.exports.password_changed = async (req, res) => {
  try{
    const id = jwt.verify(req.params['token'], 'net ninja secret').id;
    const user = await User.findById(id);
    let password = req.params['newPassword'];
    const salt = await bcrypt.genSalt();
    password = await bcrypt.hash(password, salt);
    user.password = password;
    await user.save();
    const token = createToken(user._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.redirect('/auth/password-changed');
  } catch(err) {
    res.render('auth_views/password_change_failed')
  }
  
}
//Go home
module.exports.password_changed_home = (req, res) => {
  res.render('auth_views/password_reset_sucess');
}

//report password reset 
module.exports.password_reset_report = (req, res) => {
  res.send('Thank you for reporting this issue to us. Our staff will look into it')
}

//Change password for currently logged in users
module.exports.changePassword = async (req,res)=>{
  const {currentPassword, newPassword, comfirmPassword} = req.body;
  const id = req.user._id;
  const user = await User.findById(id);
  try{
    const auth = await bcrypt.compare(currentPassword, user.password);
    if(!auth) throw Error('incorrect password');
    if(!(newPassword === comfirmPassword)) throw Error("passwords do not match");
    if(newPassword.length < 6) throw Error("Minimum password length is 6 characters");
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({success: true})
  } catch(err){
    res.status(400).json({error: err.message});
  }
 
}

//Profile Photo
module.exports.getPhoto = (req, res) => {
  const filename = req.user.photo;
  let filepath = "";
  if (filename) filepath = path.join(__dirname, "../", filename);
  else filepath = path.join(__dirname, "../", "profile_photos", "defaultProfile.jpeg");
  res.sendFile(filepath);
}
module.exports.postPhoto = (req, res) => {

  //flag for sent response
  let flag = false;

  //Create an instance of the form object
  const uploadDir = "./profile_photos";
  const maxFileSize = 5*1024*1024;
  let form = new formidable.IncomingForm({uploadDir , maxFileSize});

  //Listen for fileBegin event
  form.on('fileBegin', function(name, file){
    try{
    //check if file is empty
      if (!file.originalFilename) throw Error("file empty");
      //check file extension if valid
      const valid = ["jpeg", "jpg", "png"];
      const mimetype = file.mimetype;
      const parts = mimetype.split("/");
      const type = parts[parts.length-1];
      if (!valid.includes(type)) throw Error("invalid file type");
      
      //Add ext (original file extension) property to file object for renaming purposes later
      file.ext = type;
    } catch(err){
     if (!flag) {
      res.status(400).json({error : err.message});
      flag = true;
     }
    }
  });
  
  //Parsing
  form.parse(req,  async (err, fields, files) => {
    //if error (max file size exceeded)
    if (err) {
      try{
        throw Error("max file size exceeded");
      } catch(err){
        if (!flag) {
          res.status(400).json({error : err.message});
          flag = true;
         }
      }
    }
    //Rename saved file with user id name
    try{
      const id = req.user._id.toString();
      const oldPath = files.profilePhoto.filepath;
      var newPath = uploadDir + "/" + id + '.' + files.profilePhoto.ext;
      fs.renameSync(oldPath, newPath);
    } catch(err){
    }
    
    //Update user photo name on User database
    try{
      const user = await User.findById(req.user._id);
      user.photo = newPath;
      await user.save();
    } catch(err){
    }
    //send sucess response back to client
    if (!flag){
      res.json({success:true});
      flag = true;
    }
  });
}
