import ApiError from '../utils/ApiError.js';

/**
 * Joi validation middleware factory
 * @param {Object} schema - Joi schema with body, params, query keys
 */
const validate = (schema) => (req, res, next) => {
  const validationErrors = [];

  ['params', 'query', 'body'].forEach((key) => {
    if (schema[key]) {
      const { error, value } = schema[key].validate(req[key], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
        validationErrors.push(...errors);
      } else {
        // Replace with validated (and stripped) values
        req[key] = value;
      }
    }
  });

  if (validationErrors.length > 0) {
    return next(ApiError.badRequest('Validation failed', validationErrors));
  }

  next();
};

export default validate;
