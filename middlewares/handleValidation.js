const {validationResult} = require('express-validator')

exports.handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return res.status(400).json({
            success: false,
            message: firstError
        })
    }
    next();
}