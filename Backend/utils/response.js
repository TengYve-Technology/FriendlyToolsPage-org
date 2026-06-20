function successResponse(res, data) {
    res.json({
        success: true,
        data: data
    });
}

function errorResponse(res, error, errorCode = 10001, statusCode = 400) {
    res.status(statusCode).json({
        success: false,
        error: error,
        errorCode: errorCode
    });
}

module.exports = {
    successResponse,
    errorResponse
};