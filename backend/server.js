require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/predict', require('./routes/prediction'));
app.use('/api/search-history', require('./routes/searchHistory'));

// Create or update admin user on server start based on .env
const User = require('./models/User');
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Super Admin credentials not configured in .env');
      return;
    }

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'super_admin',
        isAdmin: true,
        contactNumber: 'N/A'
      });
      console.log(`Super admin user created for ${adminEmail}`);
    } else {
      let needsSave = false;

      // Update password if .env password changed
      const isMatch = await bcrypt.compare(adminPassword, adminExists.password);
      if (!isMatch) {
        adminExists.password = await bcrypt.hash(adminPassword, 10);
        needsSave = true;
        console.log(`Updated password for super admin ${adminEmail} from .env`);
      }

      if (adminExists.role !== 'super_admin' || !adminExists.isAdmin) {
        adminExists.role = 'super_admin';
        adminExists.isAdmin = true;
        needsSave = true;
        console.log(`Promoted user ${adminEmail} to super admin`);
      }

      if (!adminExists.contactNumber) {
        adminExists.contactNumber = 'N/A';
        needsSave = true;
      }

      if (needsSave) {
        await adminExists.save();
      }
    }
  } catch (error) {
    console.log('Error creating/updating admin:', error);
  }
};

createAdminUser();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
