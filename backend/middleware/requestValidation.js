const { validationResult } = require('express-validator');

const validate = (rules) => {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Validation failed',
        requestId: req.id,
        details: errors.array().map(e => ({
          field: e.path,
          message: e.msg,
          value: e.value
        }))
      });
    }
  ];
};

module.exports = { validate };
