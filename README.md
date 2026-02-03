Tech stack used:
Node.js
Express.js
MongoDB (Mongoose)
Joi for request-level validation
Mongoose schema validation 
express-rate-limit for rate limiting

The API supports note creation, retrieval, updates, and search with proper validation,
partial updates with no-op detection, case-insensitive partial search across title and
content, sorting by most recently updated notes, and rate limiting on note creation as specified.
