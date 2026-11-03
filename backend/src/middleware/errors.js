export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with that unique value already exists" });
  }
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : "An unexpected server error occurred",
  });
}
