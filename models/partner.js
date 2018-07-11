var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PartnerSchema = new Schema({
  customerCode: {
    type: String,
    required: true
  },
  retailerName: {
    type: String,
    required: true
  },
  registeredName: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  suburb: {
    type: String,
    required: true
  },
  branchName: {
    type: String,
    required: true
  },
  branchPin: {
    type: String,
    required: true
  },
  partnerZoneEmail: {
    type: String,
    required: true
  },
  salesEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('Partner', PartnerSchema);