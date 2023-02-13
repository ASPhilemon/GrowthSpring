const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const withdrawalsSchema = new Schema({
    name: String,
    date: Date,
    amount: Number,
    charge: Number,
    status: String,
    transID: String,
    method: String,
})

const Withdrawals = mongoose.model('Withdrawal', withdrawalsSchema);
module.exports = Withdrawals;