import express from 'express';
import WebManager from './manager.js';

const router = express.Router();

router.get('/servers', (req, res) => {
  try {
    const servers = WebManager.getServers();
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

router.post('/servers/:name/start', async (req, res) => {
  try {
    const { name } = req.params;
    await WebManager.startServer(name);
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/servers/:name/stop', async (req, res) => {
  try {
    const { name } = req.params;
    await WebManager.stopServer(name);
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
