const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  role: {
    type: String,
    enum: {
      values: ['ADMIN', 'STAFF', 'CUSTOMER'],
      message: '{VALUE} is not a valid role'
    },
    default: 'STAFF'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users',
  timestamps: true,
  versionKey: false
});

// Compare hashed password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Omit passwordHash in JSON response
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
