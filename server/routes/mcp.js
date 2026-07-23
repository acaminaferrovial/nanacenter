import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../mcp/index.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('Error en el servidor MCP:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error interno del servidor MCP' });
    }
  }
});

router.get('/', (req, res) => {
  res.status(405).json({ error: 'Método no permitido, usa POST' });
});

router.delete('/', (req, res) => {
  res.status(405).json({ error: 'Método no permitido' });
});

export default router;
