import express from 'express';
import { Configuration } from '../models';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all configuration
router.get('/', async (req, res) => {
  try {
    const configurations = await Configuration.find();
    res.json(configurations);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
});

// Get status styles — must be defined BEFORE /:key to avoid being caught by the param route
router.get('/enum/status-styles', async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ key: 'STATUS_STYLES' });
    if (!configuration || !configuration.statusStyles) {
      return res.status(404).json({ error: 'Status styles configuration not found' });
    }
    return res.json({ success: true, data: configuration.statusStyles });
  } catch (error) {
    console.error('Error fetching status styles:', error);
    return res.status(500).json({ error: 'Failed to fetch status styles' });
  }
});

// Get role colors — must be defined BEFORE /:key to avoid being caught by the param route
router.get('/enum/role-colors', async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ key: 'ROLE_COLORS' });
    if (!configuration || !configuration.roleColors) {
      return res.status(404).json({ error: 'Role colors configuration not found' });
    }
    return res.json({ success: true, data: configuration.roleColors });
  } catch (error) {
    console.error('Error fetching role colors:', error);
    return res.status(500).json({ error: 'Failed to fetch role colors' });
  }
});

// Get configuration by key
router.get('/:key', async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ key: req.params.key });
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    return res.json(configuration);
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update configuration (admin only)
router.put('/:key', authorize('ADMIN'), async (req, res) => {
  try {
    const configuration = await Configuration.findOneAndUpdate(
      { key: req.params.key },
      req.body,
      { new: true, runValidators: true }
    );
    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    return res.json(configuration);
  } catch (error) {
    console.error('Error updating configuration:', error);
    return res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
