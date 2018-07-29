var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PartnerServiceSchema = new Schema({
  partnerId: {
    type: String,
    required: true
  },
  wheelAlignmentPrice: {
    type: String,
    required: true
  },
  wheelBalancingPrice: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('PartnerService', PartnerServiceSchema);