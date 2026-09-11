const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SearchHistory = require('../models/SearchHistory');
const { authenticate, requireRoles } = require('../middleware/auth');

const adminAccess = [authenticate, requireRoles('admin', 'super_admin')];
const superAdminAccess = [authenticate, requireRoles('super_admin')];
const publicUserFields = '-password -__v';

// Admins and super admins can view all users.
router.get('/', ...adminAccess, async (req, res) => {
  try {
    const users = await User.find().select(publicUserFields).sort({ createdAt: -1 });
    res.json(users.map((user) => ({ ...user.toObject(), role: user.getRole() })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admins and super admins can view prediction/search activity.
router.get('/activity', ...adminAccess, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const filter = req.query.userId ? { user: req.query.userId } : {};
    const activity = await SearchHistory.find(filter)
      .populate('user', 'name email role isAdmin')
      .sort({ searchedAt: -1 })
      .limit(limit)
      .select('-__v');
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/activity', ...adminAccess, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(publicUserFields);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const activity = await SearchHistory.find({ user: user._id })
      .sort({ searchedAt: -1 })
      .limit(limit)
      .select('-__v');
    res.json({ user: { ...user.toObject(), role: user.getRole() }, activity });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Only a super admin can create another admin.
router.post('/admins', ...superAdminAccess, async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;
    if (!name || !email || !password || !contactNumber) {
      return res.status(400).json({ message: 'Name, email, password, and contact number are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const admin = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      contactNumber,
      role: 'admin',
      isAdmin: true
    });

    const adminResponse = admin.toObject();
    delete adminResponse.password;
    res.status(201).json({
      message: 'Admin created',
      admin: { ...adminResponse, role: admin.getRole() }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Only a super admin can remove an admin.
router.delete('/admins/:id', ...superAdminAccess, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin || admin.getRole() !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    await Promise.all([
      User.deleteOne({ _id: admin._id }),
      SearchHistory.deleteMany({ user: admin._id })
    ]);
    res.json({ message: 'Admin removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Only a super admin can delete regular users and their activity.
router.delete('/:id', ...superAdminAccess, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.getRole() !== 'user') {
      return res.status(404).json({ message: 'User not found' });
    }
    await Promise.all([
      User.deleteOne({ _id: user._id }),
      SearchHistory.deleteMany({ user: user._id })
    ]);
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
