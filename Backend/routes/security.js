const crypto = require('crypto');
const { successResponse, errorResponse } = require('../utils/response');

module.exports = function(app, dependencies) {
    app.post('/api/security/password-strength', (req, res) => {
        const { data, options } = req.body;
        const password = (data && data.password !== undefined) ? data.password : req.body.password;

        if (password === undefined || password === null) {
            return errorResponse(res, '缺少必要参数: password', 10001);
        }

        try {
            const pwd = String(password);
            let score = 0;
            const checks = {
                length: pwd.length >= 8,
                lowercase: /[a-z]/.test(pwd),
                uppercase: /[A-Z]/.test(pwd),
                digits: /\d/.test(pwd),
                special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
            };

            if (pwd.length >= 6) score += 10;
            if (pwd.length >= 8) score += 15;
            if (pwd.length >= 12) score += 15;
            if (checks.lowercase) score += 15;
            if (checks.uppercase) score += 15;
            if (checks.digits) score += 15;
            if (checks.special) score += 15;

            let level, levelText;
            if (score < 30) {
                level = 'weak';
                levelText = '弱';
            } else if (score < 60) {
                level = 'medium';
                levelText = '中等';
            } else if (score < 80) {
                level = 'strong';
                levelText = '强';
            } else {
                level = 'very_strong';
                levelText = '非常强';
            }

            const suggestions = [];
            if (!checks.length) suggestions.push('密码长度至少8位');
            if (!checks.lowercase) suggestions.push('包含小写字母');
            if (!checks.uppercase) suggestions.push('包含大写字母');
            if (!checks.digits) suggestions.push('包含数字');
            if (!checks.special) suggestions.push('包含特殊字符');

            successResponse(res, {
                score,
                level,
                levelText,
                checks,
                suggestions
            });
        } catch (error) {
            console.error('❌ 密码强度检测失败:', error);
            errorResponse(res, '密码强度检测失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/security/password-generate', (req, res) => {
        const { data, options } = req.body;
        const length = (options && options.length) ? options.length : (req.body.length || 16);
        const includeLowercase = (options && options.includeLowercase) !== undefined ? options.includeLowercase : (req.body.includeLowercase !== false);
        const includeUppercase = (options && options.includeUppercase) !== undefined ? options.includeUppercase : (req.body.includeUppercase !== false);
        const includeNumbers = (options && options.includeNumbers) !== undefined ? options.includeNumbers : (req.body.includeNumbers !== false);
        const includeSymbols = (options && options.includeSymbols) !== undefined ? options.includeSymbols : (req.body.includeSymbols !== false);
        const count = (options && options.count) ? options.count : (req.body.count || 1);

        try {
            const len = parseInt(length) || 16;
            const num = parseInt(count) || 1;

            if (len < 4 || len > 128) {
                return errorResponse(res, '密码长度必须在4-128之间', 10002);
            }

            let charset = '';
            if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
            if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (includeNumbers) charset += '0123456789';
            if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            if (charset === '') {
                return errorResponse(res, '至少选择一种字符类型', 10002);
            }

            const passwords = [];
            for (let i = 0; i < num; i++) {
                let password = '';
                const array = new Uint32Array(len);
                crypto.getRandomValues(array);
                for (let j = 0; j < len; j++) {
                    password += charset[array[j] % charset.length];
                }
                passwords.push(password);
            }

            successResponse(res, {
                passwords,
                length: len,
                count: num
            });
        } catch (error) {
            console.error('❌ 随机密码生成失败:', error);
            errorResponse(res, '随机密码生成失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/security/sha256', (req, res) => {
        const { data, options } = req.body;
        const text = (data && data.text !== undefined) ? data.text : req.body.text;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const hash = crypto.createHash('sha256').update(String(text)).digest('hex');
            successResponse(res, {
                result: hash,
                algorithm: 'SHA-256',
                original: text
            });
        } catch (error) {
            console.error('❌ SHA256哈希失败:', error);
            errorResponse(res, 'SHA256哈希失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/security/aes', (req, res) => {
        const { data, options } = req.body;
        const text = (data && data.text !== undefined) ? data.text : req.body.text;
        const key = (data && data.key !== undefined) ? data.key : req.body.key;
        const mode = (options && options.mode) ? options.mode : (req.body.mode || 'encrypt');

        if (text === undefined || text === null || !key) {
            return errorResponse(res, '缺少必要参数: text, key', 10001);
        }

        try {
            const algorithm = 'aes-256-cbc';
            const keyHash = crypto.createHash('sha256').update(String(key)).digest();
            let result;

            if (mode === 'encrypt') {
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv(algorithm, keyHash, iv);
                let encrypted = cipher.update(String(text), 'utf8', 'hex');
                encrypted += cipher.final('hex');
                result = iv.toString('hex') + ':' + encrypted;
            } else if (mode === 'decrypt') {
                const parts = String(text).split(':');
                if (parts.length !== 2) {
                    return errorResponse(res, '无效的加密文本格式', 10011);
                }
                const iv = Buffer.from(parts[0], 'hex');
                const encrypted = parts[1];
                const decipher = crypto.createDecipheriv(algorithm, keyHash, iv);
                let decrypted = decipher.update(encrypted, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                result = decrypted;
            } else {
                return errorResponse(res, `不支持的模式: ${mode}`, 10009);
            }

            successResponse(res, {
                result,
                mode,
                algorithm
            });
        } catch (error) {
            console.error('❌ AES加解密失败:', error);
            errorResponse(res, 'AES加解密失败: ' + error.message, 10000, 500);
        }
    });

    return app;
};