const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contributionsSchema = new Schema({
    name: String,
    contributions: [{
        businessName: String,
        amount: Number,
        principleLeft: Number,
        profit: Number,
        status: String
        }]       
})

const Contributions = mongoose.model('contribution', contributionsSchema);
module.exports = Contributions;