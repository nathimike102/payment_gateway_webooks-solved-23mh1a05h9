const sendError = (res, error) => {
    const statusCode = error.statusCode || 500;
    const code = error.code || 'SERVER_ERROR';
    const description = error.description || error.message || 'Internal server error';

    return res.status(statusCode).json({
        error: {
            code,
            description,
        },
    });
};

const sendSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json(data);
};

module.exports = {
    sendError,
    sendSuccess,
};
