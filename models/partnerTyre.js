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
    livePrice: { 
        type: String,
        default: '0.00',
        required: true
    },
    price: { 
        type: String,
        default: '0.00',
        required: true,
    },
    inlcusion: [{
        type: String
    }],
    modified: {
        type: Boolean,
        default: false,
    }
});

module.exports = mongoose.model('PartnerTyre', PartnerTyreSchema);