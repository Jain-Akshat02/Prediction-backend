const router = require('express').Router();
const SavedArea = require('../models/SavedArea');
const { authenticate } = require('../middleware/auth');

// GET /api/saved-areas — list all saved areas for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const savedAreas = await SavedArea.find({ user: req.user._id })
      .sort({ savedAt: -1 })
      .select('-__v');

    res.json({ success: true, data: savedAreas });
  } catch (error) {
    console.error('Fetch saved areas error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved areas'
    });
  }
});

// GET /api/saved-areas/:id — get a specific saved area
router.get('/:id', authenticate, async (req, res) => {
  try {
    const savedArea = await SavedArea.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('-__v');

    if (!savedArea) {
      return res.status(404).json({
        success: false,
        message: 'Saved area not found'
      });
    }

    res.json({ success: true, data: savedArea });
  } catch (error) {
    console.error('Fetch single saved area error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved area details'
    });
  }
});

// POST /api/saved-areas — save a new prediction area or point
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      type,
      latitude,
      longitude,
      polygonCoordinates,
      label,
      summary,
      notes
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required for saving an area.'
      });
    }

    const areaType = type === 'point' ? 'point' : 'polygon';

    if (areaType === 'polygon' && (!polygonCoordinates || !Array.isArray(polygonCoordinates))) {
      return res.status(400).json({
        success: false,
        message: 'Polygon coordinates are required for saving a polygon area.'
      });
    }

    if (areaType === 'point' && (latitude === undefined || longitude === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for saving a point area.'
      });
    }

    const savedArea = await SavedArea.create({
      user: req.user._id,
      title: title.trim(),
      type: areaType,
      latitude: areaType === 'point' ? Number(latitude) : undefined,
      longitude: areaType === 'point' ? Number(longitude) : undefined,
      polygonCoordinates: areaType === 'polygon' ? polygonCoordinates : undefined,
      label: label || null,
      summary: summary || null,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      data: savedArea,
      message: 'Area saved successfully'
    });
  } catch (error) {
    console.error('Save area error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save area'
    });
  }
});

// PATCH /api/saved-areas/:id — update title or notes of a saved area
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { title, notes } = req.body;
    const updates = {};

    if (title && typeof title === 'string') {
      updates.title = title.trim();
    }
    if (notes !== undefined) {
      updates.notes = String(notes);
    }

    const savedArea = await SavedArea.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true }
    ).select('-__v');

    if (!savedArea) {
      return res.status(404).json({
        success: false,
        message: 'Saved area not found'
      });
    }

    res.json({
      success: true,
      data: savedArea,
      message: 'Saved area updated successfully'
    });
  } catch (error) {
    console.error('Update saved area error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update saved area'
    });
  }
});

// DELETE /api/saved-areas/:id — delete a saved area
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await SavedArea.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Saved area not found'
      });
    }

    res.json({
      success: true,
      message: 'Saved area deleted successfully'
    });
  } catch (error) {
    console.error('Delete saved area error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete saved area'
    });
  }
});

module.exports = router;
