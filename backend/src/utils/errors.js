class ValidationError extends Error {
    constructor(code, description) {
        super(description);
        this.code = code;
        this.description = description;
        this.statusCode = 400;
    }
}

class AuthenticationError extends Error {
    constructor(description = 'Invalid API credentials') {
        super(description);
        this.code = 'AUTHENTICATION_ERROR';
        this.description = description;
        this.statusCode = 401;
    }
}

class NotFoundError extends Error {
    constructor(resource = 'Resource') {
        super(`${resource} not found`);
        this.code = 'NOT_FOUND_ERROR';
        this.description = `${resource} not found`;
        this.statusCode = 404;
    }
}

module.exports = {
    ValidationError,
    AuthenticationError,
    NotFoundError,
};
