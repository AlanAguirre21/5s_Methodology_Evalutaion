export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'La información enviada es demasiado grande' });
    }
    const status = err.status || 500;
    if (status === 500) console.error(err);

    res.status(status).json({
        error: status === 500 ? 'Internal Server Error' : err.message || 'Unknown error'
    });
}