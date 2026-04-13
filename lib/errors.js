/**
 * lib/errors.js — Centralized error classes and Express error-handler middleware.
 *
 * All error classes produce a structured JSON envelope:
 *   { success: false, error: { code, message, details? } }
 *
 * Usage (Express route):
 *   throw new NotFoundError('Shop not found');
 *
 * The errorHandler middleware catches these and responds with the correct
 * HTTP status code and body.
 */

'use strict';

// ---------------------------------------------------------------------------
// Base error
// ---------------------------------------------------------------------------

class AppError extends Error {
    /**
     * @param {string}  message
     * @param {number}  [statusCode=500]
     * @param {string}  [code='INTERNAL_ERROR']
     */
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: { code: this.code, message: this.message },
        };
    }
}

// ---------------------------------------------------------------------------
// Concrete subclasses
// ---------------------------------------------------------------------------

class ValidationError extends AppError {
    /**
     * @param {string}  message
     * @param {object}  [details]  Optional field-level error details
     */
    constructor(message = 'Validation failed', details) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }

    toJSON() {
        const base = super.toJSON();
        if (this.details) base.error.details = this.details;
        return base;
    }
}

class AuthError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTH_ERROR');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

class RateLimitError extends AppError {
    /**
     * @param {string}  message
     * @param {number}  [retryAfter]  Seconds until the client may retry
     */
    constructor(message = 'Too many requests', retryAfter) {
        super(message, 429, 'RATE_LIMITED');
        this.retryAfter = retryAfter;
    }
}

// ---------------------------------------------------------------------------
// Express error-handler middleware  (must have 4 parameters)
// ---------------------------------------------------------------------------

/**
 * Centralized Express error handler.
 * Mount as the **last** middleware: `app.use(errorHandler);`
 */
function errorHandler(err, _req, res, _next) {   // eslint-disable-line no-unused-vars
    // ── Known AppError subclass ────────────────────────────────────────────
    if (err instanceof AppError) {
        if (err instanceof RateLimitError && err.retryAfter) {
            res.set('Retry-After', String(err.retryAfter));
        }
        return res.status(err.statusCode).json(err.toJSON());
    }

    // ── Body-parser errors ─────────────────────────────────────────────────
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body' },
        });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds size limit' },
        });
    }

    // ── Unknown / unexpected errors ────────────────────────────────────────
    const isProd = process.env.NODE_ENV === 'production';
    console.error('[errorHandler]', err);
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: isProd ? 'An unexpected error occurred' : (err.message || 'Internal server error'),
        },
    });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    AppError,
    ValidationError,
    AuthError,
    ForbiddenError,
    NotFoundError,
    RateLimitError,
    errorHandler,
};
