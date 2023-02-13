const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MembersSchema = new Schema({
    name: String,
    totalWorth: Number,
    uninvestedCash: Number,
    currentInvestments: Number,
    phoneContacts: String,
    email: String
})

const Member = mongoose.model('Member', MembersSchema);
module.exports = Member;