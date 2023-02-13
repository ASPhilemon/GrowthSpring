const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const earningsSchema = new Schema({
    name: String,
    availableForWithdraw: Number,
    list: [{
        date: Date,
        source: String,
        amount: Number,
    }]
})

const Earning = mongoose.model('earning', earningsSchema);
module.exports = Earning;