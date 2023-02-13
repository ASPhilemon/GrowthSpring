const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clubDataSchema = new Schema({
    totalWorth: Number,
    totalMembers: Number,
    investments: [{
        date: Date,
        businessName: String,
        amountCollected: Number,
        amountLeft: Number,
        status: String,
        description: String
    }],
    pending: [{
        businessName: String,
        daysLeft: Number,
        requiredContribution: Number,
        description: String
    }]       
})

const clubData = mongoose.model('clubData', clubDataSchema);
module.exports = clubData;