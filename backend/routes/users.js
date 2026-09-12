const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SearchHistory = require('../models/SearchHistory');
const { verifyTeam, verifyAdmin } = require('../middleware/auth');

const publicUserFields = '-password -__v';

// Teams and admins can view all users.
router.get('/', verifyTeam, async (req, res) => {
  try {
    const users = await User.find().select(publicUserFields).sort({ createdAt: -1 });
    res.json(users.map((user) => ({ ...user.toObject(), role: user.getRole() })));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Teams and admins can view prediction/search activity.
router.get('/activity', verifyTeam, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const filter = req.query.userId ? { user: req.query.userId } : {};
    const activity = await SearchHistory.find(filter)
      .populate('user', 'name email role isAdmin')
      .sort({ searchedAt: -1 })
      .limit(limit)
      .select('-__v');
    res.json(activity.map((entry) => {
      const entryResponse = entry.toObject();
      if (entry.user) {
        entryResponse.user = {
          ...entryResponse.user,
          role: entry.user.getRole()
        };
      }
      return entryResponse;
    }));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/activity', verifyTeam, async (req, res) => {
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

// Only an admin can create a team account. /admins remains as a compatibility path.
router.post(['/teams', '/admins'], verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const team = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      contactNumber: contactNumber || 'N/A',
      role: 'team',
      isAdmin: true
    });

    const teamResponse = team.toObject();
    delete teamResponse.password;
    const response = {
      message: req.path === '/admins' ? 'Admin created' : 'Team created',
      team: { ...teamResponse, role: team.getRole() }
    };
    if (req.path === '/admins') response.admin = response.team;
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Only an admin can remove a team. /admins remains as a compatibility path.
router.delete(['/teams/:id', '/admins/:id'], verifyAdmin, async (req, res) => {
  try {
    const team = await User.findById(req.params.id);
    if (!team || team.getRole() !== 'team') {
      return res.status(404).json({ message: 'Team not found' });
    }
    await Promise.all([
      User.deleteOne({ _id: team._id }),
      SearchHistory.deleteMany({ user: team._id })
    ]);
    res.json({ message: req.path.startsWith('/admins/') ? 'Admin removed' : 'Team removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Only an admin can delete regular users and their activity.
router.delete('/:id', verifyAdmin, async (req, res) => {
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
