const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const depositSchema = new Schema({
    name: String,
    date: Date,
    transID: String,
    status: String,
    method: String,
    amount: Number
})

const Deposit = mongoose.model('Deposit', depositSchema);
module.exports = Deposit;