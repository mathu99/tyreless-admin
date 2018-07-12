var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var InclusionSchema = new Schema({
  description: {
    type: String,
    required: true
  },
});

module.exports = mongoose.model('Inclusion', InclusionSchema);