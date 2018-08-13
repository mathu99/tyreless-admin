var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PartnerTyreSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    userRef: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    tyreRef: {
        type: Schema.Types.ObjectId,
        ref: 'Tyre',
    },
    price: { 
        type: String,
        required: true
    },
    inlcusion: [{
        type: String
    }],
});

module.exports = mongoose.model('PartnerTyre', PartnerTyreSchema);