const crypto = require('crypto');
const QRCode = require('qrcode');
const { Jimp } = require('jimp');
const jsQR = require('jsqr');
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

    app.post('/api/security/qrcode-generate', (req, res) => {
        const { data, options } = req.body;
        const text = (data && data.text !== undefined) ? data.text : req.body.text;
        const size = (options && options.size) ? options.size : (req.body.size || 256);
        const margin = (options && options.margin !== undefined) ? options.margin : (req.body.margin !== undefined ? req.body.margin : 2);
        const fgColor = (options && options.fgColor) ? options.fgColor : (req.body.fgColor || '#000000');
        const bgColor = (options && options.bgColor) ? options.bgColor : (req.body.bgColor || '#ffffff');

        if (text === undefined || text === null || text === '') {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const qrSize = parseInt(size) || 256;
            const qrMargin = parseInt(margin) || 2;

            if (qrSize < 64 || qrSize > 2048) {
                return errorResponse(res, '二维码大小必须在64-2048像素之间', 10002);
            }

            QRCode.toDataURL(String(text), {
                width: qrSize,
                margin: qrMargin,
                color: {
                    dark: fgColor,
                    light: bgColor
                }
            }, (err, url) => {
                if (err) {
                    console.error('❌ 二维码生成失败:', err);
                    return errorResponse(res, '二维码生成失败: ' + err.message, 10000, 500);
                }
                successResponse(res, {
                    imageBase64: url,
                    size: qrSize,
                    text: String(text)
                });
            });
        } catch (error) {
            console.error('❌ 二维码生成失败:', error);
            errorResponse(res, '二维码生成失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/security/qrcode-parse', async (req, res) => {
        const { data } = req.body;
        const imageBase64 = (data && data.imageBase64 !== undefined) ? data.imageBase64 : req.body.imageBase64;

        if (!imageBase64) {
            return errorResponse(res, '缺少必要参数: imageBase64', 10001);
        }

        try {
            const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const image = await Jimp.read(buffer);
            const width = image.bitmap.width;
            const height = image.bitmap.height;
            
            const imageData = new Uint8ClampedArray(image.bitmap.data);

            const code = jsQR(imageData, width, height);

            if (code) {
                successResponse(res, {
                    text: code.data,
                    format: 'QR_CODE'
                });
            } else {
                errorResponse(res, '未检测到二维码', 10012);
            }
        } catch (error) {
            console.error('❌ 二维码解析失败:', error);
            if (error.message && error.message.includes('MIME')) {
                errorResponse(res, '无效的图片格式', 10013);
            } else {
                errorResponse(res, '二维码解析失败: ' + error.message, 10000, 500);
            }
        }
    });

    app.post('/api/security/file-hash', (req, res) => {
        const { data } = req.body;
        const fileBase64 = (data && data.fileBase64 !== undefined) ? data.fileBase64 : req.body.fileBase64;
        const fileName = (data && data.fileName !== undefined) ? data.fileName : req.body.fileName;

        if (!fileBase64) {
            return errorResponse(res, '缺少必要参数: fileBase64', 10001);
        }

        try {
            const base64Data = String(fileBase64).replace(/^data:.*?;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            const md5 = crypto.createHash('md5').update(buffer).digest('hex');
            const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
            const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

            successResponse(res, {
                md5,
                sha1,
                sha256,
                fileName: fileName || 'unknown',
                fileSize: buffer.length
            });
        } catch (error) {
            console.error('❌ 文件哈希计算失败:', error);
            errorResponse(res, '文件哈希计算失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/security/jwt-parse', (req, res) => {
        const { data } = req.body;
        const token = (data && data.token !== undefined) ? data.token : req.body.token;

        if (token === undefined || token === null || token === '') {
            return errorResponse(res, '缺少必要参数: token', 10001);
        }

        try {
            const tokenStr = String(token).trim();
            const parts = tokenStr.split('.');

            if (parts.length !== 3) {
                return errorResponse(res, '无效的 JWT 格式：Token 必须包含三部分（Header.Payload.Signature），用 . 分隔', 10014);
            }

            const [headerRaw, payloadRaw, signatureRaw] = parts;

            function base64UrlDecode(str) {
                let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                const padLength = (4 - (base64.length % 4)) % 4;
                base64 += '='.repeat(padLength);
                return Buffer.from(base64, 'base64').toString('utf8');
            }

            let header, payload;
            try {
                const headerJson = base64UrlDecode(headerRaw);
                header = JSON.parse(headerJson);
            } catch (e) {
                return errorResponse(res, 'Header 解析失败：无效的 Base64Url 或 JSON 格式', 10015);
            }

            try {
                const payloadJson = base64UrlDecode(payloadRaw);
                payload = JSON.parse(payloadJson);
            } catch (e) {
                return errorResponse(res, 'Payload 解析失败：无效的 Base64Url 或 JSON 格式', 10016);
            }

            function formatDate(timestamp) {
                if (timestamp === undefined || timestamp === null) return null;
                const date = new Date(timestamp * 1000);
                return date.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }

            const now = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp !== undefined ? now > payload.exp : false;
            const expiresAt = formatDate(payload.exp);
            const issuedAt = formatDate(payload.iat);

            successResponse(res, {
                header,
                payload,
                signature: signatureRaw,
                headerRaw,
                payloadRaw,
                signatureRaw,
                isExpired,
                expiresAt,
                issuedAt,
                tokenValid: true
            });
        } catch (error) {
            console.error('❌ JWT 解析失败:', error);
            errorResponse(res, 'JWT 解析失败: ' + error.message, 10000, 500);
        }
    });

    return app;
};