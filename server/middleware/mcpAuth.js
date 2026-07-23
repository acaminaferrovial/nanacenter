export function requireMcpAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = headerToken || req.params.token || null;

  if (!token || !process.env.MCP_ACCESS_TOKEN || token !== process.env.MCP_ACCESS_TOKEN) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  next();
}
