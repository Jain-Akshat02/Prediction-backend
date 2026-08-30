const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    default: null
  },
  searchedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

searchHistorySchema.index({ user: 1, searchedAt: -1 });
searchHistorySchema.index({ user: 1, latitude: 1, longitude: 1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
