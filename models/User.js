const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: String,
  givenName : String,
  name: String,
  password: String,
  photo : String
})

// Static method to login user
userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) return user;
    else throw Error('incorrect password');
  }
  throw Error('incorrect email');
};
const User = mongoose.model('user', userSchema);
module.exports = User;