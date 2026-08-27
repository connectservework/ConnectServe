/**
 * Standard JSON response helper
 */
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };
  return res.status(statusCode).json(response);
};

const sendSuccess = (res, message = 'Success', data = null, meta = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data, meta);
};

const sendError = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
};
