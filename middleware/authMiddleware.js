const jwt = require('jsonwebtoken');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
      if (err) {
        res.redirect('/auth/login');
      } else {
        next();
      }
    });
  } else {
    res.redirect('/auth/login');
  }
};

// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        //Get user from user collection
        let user = await User.findById(decodedToken.id);
        res.locals.user = user;
        req.user = user;
        next();
      }
    });
  } else {
    req.user = null;
    res.locals.user = null;
    next();
  }
};

function checkAdmin(req, res, next){
  const admins = ["633ff81c48bd1d1328d91bde", "633ffba848bd1d1328d91be0", "634102b4f97ffe9c4ea30a88"];
  const user_id = req.user._id.toString();

  //check if user is in the list of admins
  if (admins.includes(user_id)) {
    res.locals.admin = true;
    next();
  } else{
    res.locals.admin = false;
    next();
  }
}

module.exports = { requireAuth, checkUser , checkAdmin};