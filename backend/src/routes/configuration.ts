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

// Get configuration by key
router.get('/:key', async (req, res) => {
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
    res.json(configuration);
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
