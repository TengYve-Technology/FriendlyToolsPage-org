function extractParams(req, dataFields, optionFields = {}) {
    const { data, options } = req.body;
    const params = {};

    dataFields.forEach(field => {
        if (data && typeof data === 'object' && data[field] !== undefined) {
            params[field] = data[field];
        } else if (req.body[field] !== undefined) {
            params[field] = req.body[field];
        }
    });

    const extractedOptions = {};
    Object.entries(optionFields).forEach(([field, defaultValue]) => {
        if (options && options[field] !== undefined) {
            extractedOptions[field] = options[field];
        } else if (req.body[field] !== undefined) {
            extractedOptions[field] = req.body[field];
        } else {
            extractedOptions[field] = defaultValue;
        }
    });

    return { params, options: extractedOptions };
}

module.exports = { extractParams };