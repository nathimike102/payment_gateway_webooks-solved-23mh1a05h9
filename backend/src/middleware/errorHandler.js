const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.statusCode) {
        return sendError(res, err);
    }

    return sendError(res, {
        statusCode: 500,
        code: 'SERVER_ERROR',
        description: 'Internal server error'
    });
};

module.exports = errorHandler;
