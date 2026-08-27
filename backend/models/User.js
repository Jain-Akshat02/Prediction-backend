const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  sector: {
    type: String,
    enum: ['Govt', 'Private'],
    default: null
  },
  departmentName: {
    type: String,
    trim: true,
    default: null
  },
  institutionName: {
    type: String,
    trim: true,
    default: null
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 
