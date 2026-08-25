export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Autenticación requerida",
    });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Formato de autenticación inválido",
    });
  }

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({
      error: "No autorizado",
    });
  }

  next();
}