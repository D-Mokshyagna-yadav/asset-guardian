import express from 'express';
import { Configuration } from '../models';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get all configuration
router.get('/', auth, async (req, res) => {
  try {
    const configurations = await Configuration.find();
    res.json(configurations);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Get configuration by key
router.get('/:key', auth, async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ key: req.params.key });
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(configuration);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Get user roles
router.get('/enum/user-roles', async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ key: 'USER_ROLES' });
    if (!configuration || !configuration.userRoles) {
      return res.status(404).json({ error: 'User roles configuration not found' });
    }
    res.json(configuration.userRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

// Get status styles
router.get('/enum/status-styles', async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ key: 'STATUS_STYLES' });
    if (!configuration || !configuration.statusStyles) {
      return res.status(404).json({ error: 'Status styles configuration not found' });
    }
    res.json(configuration.statusStyles);
  } catch (error) {
    console.error('Error fetching status styles:', error);
    res.status(500).json({ error: 'Failed to fetch status styles' });
  }
});

// Get role colors
router.get('/enum/role-colors', async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ key: 'ROLE_COLORS' });
    if (!configuration || !configuration.roleColors) {
      return res.status(404).json({ error: 'Role colors configuration not found' });
    }
    res.json(configuration.roleColors);
  } catch (error) {
    console.error('Error fetching role colors:', error);
    res.status(500).json({ error: 'Failed to fetch role colors' });
  }
});

// Update configuration (admin only)
router.put('/:key', auth, async (req, res) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can update configuration' });
    }

    const configuration = await Configuration.findOneAndUpdate(
      { key: req.params.key },
      req.body,
      { new: true, runValidators: true }
    );
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(configuration);
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
