const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AdminSchema = new Schema({
    discountRate: Number,
    MMCharges: [{
            limit: Number,
            charge: Number
    }]
})

const AdminData = mongoose.model('AdminData', AdminSchema);
module.exports = AdminData;