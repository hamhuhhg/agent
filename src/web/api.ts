import express from 'express';
import WebManager from './manager.js';

const router = express.Router();

router.get('/servers', async (req, res) => {
  try {
    const servers = await WebManager.getServers();
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/servers', async (req, res) => {
  try {
    const { name, command } = req.body;
    if (!name || !command) {
      return res.status(400).json({ error: 'Name and command are required' });
    }
    await WebManager.addServer(name, command);
    res.status(201).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/servers/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await WebManager.removeServer(name);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/servers/:name/toggle', async (req, res) => {
  try {
    const { name } = req.params;
    const { enable } = req.body;
    if (typeof enable !== 'boolean') {
      return res.status(400).json({ error: 'Enable must be a boolean' });
    }
    await WebManager.toggleServer(name, enable);
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
