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
  role: {
    type: String,
    // super_admin and the old admin value are retained so existing records can
    // be read safely during the nomenclature migration. New records use the
    // canonical user/team/admin values.
    enum: ['user', 'team', 'admin', 'super_admin'],
    default: 'user'
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

userSchema.methods.getRole = function getRole() {
  if (this.role === 'super_admin') return 'admin';
  if (this.role === 'admin') return 'admin';
  if (this.role === 'team' || this.isAdmin) return 'team';
  return 'user';
};

module.exports = mongoose.model('User', userSchema); 
