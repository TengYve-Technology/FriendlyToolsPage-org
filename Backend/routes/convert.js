const { successResponse, errorResponse } = require('../utils/response');
const { extractParams } = require('../utils/params');

// 进制转换字符集
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function(app, dependencies) {
    const { errorMap, dbPath } = dependencies;

    // 纯 Node.js 实现的进制转换
    function convertBase(numStr, fromBase, toBase) {
        // 将任意进制转换为十进制
        let decimal = 0;
        for (let i = 0; i < numStr.length; i++) {
            const char = numStr[i].toUpperCase();
            const digit = CHARSET.indexOf(char);
            if (digit === -1 || digit >= fromBase) {
                throw new Error(`无效的字符 '${char}' for base ${fromBase}`);
            }
            decimal = decimal * fromBase + digit;
        }

        // 将十进制转换为目标进制
        if (decimal === 0) return '0';
        let result = '';
        while (decimal > 0) {
            result = CHARSET[decimal % toBase] + result;
            decimal = Math.floor(decimal / toBase);
        }
        return result;
    }

    app.post('/api/convert/base', (req, res) => {
        const { params } = extractParams(req, ['number', 'fromBase', 'toBase']);
        const { number, fromBase, toBase } = params;

        if (number === undefined || fromBase === undefined || toBase === undefined) {
            return errorResponse(res, '缺少必要参数: number, fromBase, toBase', 10001);
        }

        const numStr = String(number).trim();
        const from = parseInt(fromBase);
        const to = parseInt(toBase);

        if (numStr === '') {
            return errorResponse(res, '数字不能为空', 10002);
        }

        if (isNaN(from) || isNaN(to) || from < 2 || from > 36 || to < 2 || to > 36) {
            return errorResponse(res, '进制必须为 2~36', 10003);
        }

        try {
            const result = convertBase(numStr, from, to);
            console.log(`✅ 进制转换: ${numStr} (${from}进制) → ${result} (${to}进制)`);
            successResponse(res, {
                original: numStr,
                fromBase: from,
                toBase: to,
                result: result
            });
        } catch (error) {
            console.error(`❌ 进制转换错误: ${error.message}`);
            return errorResponse(res, error.message, 10002);
        }
    });

    app.post('/api/convert/exchange', async (req, res) => {
        const { params } = extractParams(req, ['amount', 'from', 'to']);
        const { amount, from, to } = params;

        if (amount === undefined || !from || !to) {
            return errorResponse(res, '缺少必要参数: amount, from, to', 10001);
        }

        if (isNaN(amount) || amount <= 0) {
            return errorResponse(res, '金额必须为正数', 10002);
        }

        const fromCode = from.toUpperCase();
        const toCode = to.toUpperCase();

        try {
            const apiUrl = `https://api.frankfurter.app/latest?base=${fromCode}`;
            console.log(`📥 请求 Frankfurter API: ${apiUrl}`);

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                console.error('❌ Frankfurter API 返回错误:', data.error);
                return errorResponse(res, `Frankfurter API 错误: ${data.error}`, 10004);
            }

            if (!data.rates) {
                console.error('❌ Frankfurter API 返回数据异常:', data);
                return errorResponse(res, 'Frankfurter API 返回数据异常', 10004);
            }

            const rate = data.rates[toCode];
            if (!rate) {
                return errorResponse(res, `不支持货币: ${toCode}，Frankfurter 支持: ${Object.keys(data.rates).join(', ')}`, 10005);
            }

            const result = amount * rate;

            successResponse(res, {
                from: fromCode,
                to: toCode,
                amount: amount,
                rate: rate,
                result: parseFloat(result.toFixed(4)),
                updated: data.date || new Date().toISOString().split('T')[0],
                source: 'Frankfurter API (ECB)'
            });

        } catch (error) {
            console.error('❌ Frankfurter API 请求失败:', error.message);
            errorResponse(res, '获取汇率失败，请检查网络连接或稍后重试', 10000, 500);
        }
    });

    app.post('/api/convert/unit', (req, res) => {
        const { params } = extractParams(req, ['category', 'from', 'to', 'value']);
        const { category, from, to, value } = params;

        if (!category || !from || !to || value === undefined) {
            return errorResponse(res, '缺少必要参数: category, from, to, value', 10001);
        }

        if (isNaN(value) || value < 0) {
            return errorResponse(res, '数值必须为正数', 10002);
        }

        const unitFactors = {
            length: {
                mm: { name: '毫米', factor: 0.001 },
                cm: { name: '厘米', factor: 0.01 },
                m: { name: '米', factor: 1 },
                km: { name: '千米', factor: 1000 },
                inch: { name: '英寸', factor: 0.0254 },
                ft: { name: '英尺', factor: 0.3048 },
                yd: { name: '码', factor: 0.9144 },
                mile: { name: '英里', factor: 1609.344 }
            },
            weight: {
                mg: { name: '毫克', factor: 0.000001 },
                g: { name: '克', factor: 0.001 },
                kg: { name: '千克', factor: 1 },
                t: { name: '吨', factor: 1000 },
                oz: { name: '盎司', factor: 0.0283495 },
                lb: { name: '磅', factor: 0.453592 },
                jin: { name: '斤', factor: 0.5 },
                liang: { name: '两', factor: 0.05 }
            },
            area: {
                mm2: { name: '平方毫米', factor: 0.000001 },
                cm2: { name: '平方厘米', factor: 0.0001 },
                m2: { name: '平方米', factor: 1 },
                km2: { name: '平方公里', factor: 1000000 },
                ha: { name: '公顷', factor: 10000 },
                acre: { name: '英亩', factor: 4046.856 },
                sqft: { name: '平方英尺', factor: 0.092903 }
            },
            speed: {
                mps: { name: '米/秒', factor: 1 },
                kmh: { name: '千米/小时', factor: 0.277778 },
                mph: { name: '英里/小时', factor: 0.44704 },
                knot: { name: '节', factor: 0.514444 },
                fps: { name: '英尺/秒', factor: 0.3048 }
            },
            storage: {
                b: { name: '字节 (B)', factor: 1 },
                kb: { name: '千字节 (KB)', factor: 1024 },
                mb: { name: '兆字节 (MB)', factor: 1048576 },
                gb: { name: '吉字节 (GB)', factor: 1073741824 },
                tb: { name: '太字节 (TB)', factor: 1099511627776 }
            }
        };

        function convertTemperature(value, from, to) {
            let celsius;
            switch (from) {
                case 'celsius': celsius = value; break;
                case 'fahrenheit': celsius = (value - 32) * 5 / 9; break;
                case 'kelvin': celsius = value - 273.15; break;
                default: celsius = value;
            }
            switch (to) {
                case 'celsius': return celsius;
                case 'fahrenheit': return celsius * 9 / 5 + 32;
                case 'kelvin': return celsius + 273.15;
                default: return celsius;
            }
        }

        try {
            if (category === 'temperature') {
                const fromName = from;
                const toName = to;
                const result = convertTemperature(value, from, to);

                return successResponse(res, {
                    fromUnitName: fromName,
                    toUnitName: toName,
                    result: result,
                    rate: null
                });
            }

            const categoryData = unitFactors[category];
            if (!categoryData) {
                return errorResponse(res, `不支持的单位分类: ${category}`, 10006);
            }

            const fromData = categoryData[from];
            const toData = categoryData[to];
            if (!fromData) {
                return errorResponse(res, `不支持的单位: ${from}`, 10007);
            }
            if (!toData) {
                return errorResponse(res, `不支持的单位: ${to}`, 10007);
            }

            const fromFactor = fromData.factor;
            const toFactor = toData.factor;
            const result = (value * fromFactor) / toFactor;

            successResponse(res, {
                fromUnitName: fromData.name,
                toUnitName: toData.name,
                result: result,
                rate: fromFactor / toFactor
            });
            console.log(`✅ 单位转换成功: ${value} ${fromData.name} → ${result} ${toData.name}`);

        } catch (error) {
            console.error('❌ 单位转换失败:', error);
            errorResponse(res, '单位转换失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/time', (req, res) => {
        const { params } = extractParams(req, ['mode', 'value', 'from', 'to']);
        const { mode, value, from, to } = params;

        if (!mode) {
            return errorResponse(res, '缺少必要参数: mode', 10001);
        }

        try {
            if (mode === 'timestamp') {
                const ts = parseInt(value);
                if (isNaN(ts) || ts < 0) {
                    return errorResponse(res, '无效的时间戳', 10002);
                }

                const date = new Date(ts * 1000);
                const datetime = date.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                const utc = date.toUTCString();

                console.log(`🕒 时间戳 ${ts} → ${datetime}`);

                return successResponse(res, { datetime, utc });
            }

            if (mode === 'datetime') {
                if (!value) {
                    return errorResponse(res, '缺少日期时间值', 10001);
                }

                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return errorResponse(res, '无效的日期时间格式', 10002);
                }

                const timestamp = Math.floor(date.getTime() / 1000);
                const timestampMs = date.getTime();

                console.log(`🕒 日期时间 ${value} → 时间戳 ${timestamp}`);

                return successResponse(res, { timestamp, timestampMs });
            }

            if (mode === 'timezone') {
                if (!from || !to || !value) {
                    return errorResponse(res, '缺少参数: from, to, value', 10001);
                }

                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return errorResponse(res, '无效的日期时间格式', 10002);
                }

                const formatter = new Intl.DateTimeFormat('zh-CN', {
                    timeZone: to,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });

                const result = formatter.format(date);

                console.log(`🕒 时区转换: ${from} → ${to}, ${value} → ${result}`);

                return successResponse(res, { result });
            }

            return errorResponse(res, `不支持的转换模式: ${mode}`, 10008);

        } catch (error) {
            console.error('❌ 时间转换失败:', error);
            errorResponse(res, '时间转换失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/text-case', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { type: 'camel' });
        const { text } = params;
        const { type } = options;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        const str = String(text);
        let result = str;

        try {
            switch (type) {
                case 'camel':
                    result = str.replace(/[-_\s]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '')
                               .replace(/^(.)/, (match, chr) => chr.toLowerCase());
                    break;
                case 'pascal':
                    result = str.replace(/[-_\s]+(.)?/g, (match, chr) => chr ? chr.toUpperCase() : '')
                               .replace(/^(.)/, (match, chr) => chr.toUpperCase());
                    break;
                case 'kebab':
                    result = str.replace(/([a-z])([A-Z])/g, '$1-$2')
                               .replace(/[_\s]+/g, '-')
                               .toLowerCase();
                    break;
                case 'snake':
                    result = str.replace(/([a-z])([A-Z])/g, '$1_$2')
                               .replace(/[-\s]+/g, '_')
                               .toLowerCase();
                    break;
                case 'upper':
                    result = str.toUpperCase();
                    break;
                case 'lower':
                    result = str.toLowerCase();
                    break;
                case 'capitalize':
                    result = str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
                    break;
                default:
                    return errorResponse(res, `不支持的转换类型: ${type}`, 10009);
            }

            successResponse(res, { result, original: str, type });
        } catch (error) {
            console.error('❌ 文本大小写转换失败:', error);
            errorResponse(res, '文本转换失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/ascii', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { mode: 'encode' });
        const { text } = params;
        const { mode } = options;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            let result;
            if (mode === 'encode') {
                const asciiCodes = [];
                for (let i = 0; i < String(text).length; i++) {
                    asciiCodes.push(String(text).charCodeAt(i));
                }
                result = asciiCodes.join(' ');
            } else if (mode === 'decode') {
                const codes = String(text).trim().split(/\s+/).map(Number);
                result = codes.map(code => String.fromCharCode(code)).join('');
            } else {
                return errorResponse(res, `不支持的模式: ${mode}`, 10009);
            }

            successResponse(res, { result, mode, original: text });
        } catch (error) {
            console.error('❌ ASCII转换失败:', error);
            errorResponse(res, 'ASCII转换失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/text-stats', (req, res) => {
        const { params } = extractParams(req, ['text']);
        const { text } = params;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const str = String(text);
            const charCount = str.length;
            const byteCount = Buffer.byteLength(str, 'utf8');
            const lineCount = str.split('\n').length;
            const wordCount = str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
            const chineseCount = (str.match(/[\u4e00-\u9fa5]/g) || []).length;
            const englishCount = (str.match(/[a-zA-Z]/g) || []).length;
            const digitCount = (str.match(/\d/g) || []).length;
            const spaceCount = (str.match(/\s/g) || []).length;

            successResponse(res, {
                charCount,
                byteCount,
                lineCount,
                wordCount,
                chineseCount,
                englishCount,
                digitCount,
                spaceCount
            });
        } catch (error) {
            console.error('❌ 文本统计失败:', error);
            errorResponse(res, '文本统计失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/text-dedup', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { separator: '\n', ignoreCase: false });
        const { text } = params;
        const { separator, ignoreCase } = options;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const str = String(text);
            const lines = str.split(separator);
            const seen = new Set();
            const result = [];

            for (const line of lines) {
                const key = ignoreCase ? line.toLowerCase() : line;
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push(line);
                }
            }

            const dedupedText = result.join(separator);
            const removedCount = lines.length - result.length;

            successResponse(res, {
                result: dedupedText,
                originalCount: lines.length,
                resultCount: result.length,
                removedCount
            });
        } catch (error) {
            console.error('❌ 文本去重失败:', error);
            errorResponse(res, '文本去重失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/json-format', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { indent: 2 });
        const { text } = params;
        const { indent } = options;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const obj = JSON.parse(String(text));
            const result = JSON.stringify(obj, null, parseInt(indent) || 2);

            successResponse(res, {
                result,
                isMinified: false,
                indent: parseInt(indent) || 2
            });
        } catch (error) {
            console.error('❌ JSON格式化失败:', error);
            errorResponse(res, 'JSON格式错误: ' + error.message, 10010);
        }
    });

    app.post('/api/convert/color', (req, res) => {
        const { params, options } = extractParams(req, ['color'], { from: 'hex', to: 'rgb' });
        const { color } = params;
        const { from, to } = options;

        if (color === undefined || color === null) {
            return errorResponse(res, '缺少必要参数: color', 10001);
        }

        try {
            let r, g, b, a = 1;

            if (from === 'hex') {
                let hex = String(color).replace('#', '');
                if (hex.length === 3) {
                    hex = hex.split('').map(c => c + c).join('');
                }
                if (hex.length === 8) {
                    a = parseInt(hex.substr(6, 2), 16) / 255;
                    hex = hex.substr(0, 6);
                }
                r = parseInt(hex.substr(0, 2), 16);
                g = parseInt(hex.substr(2, 2), 16);
                b = parseInt(hex.substr(4, 2), 16);
            } else if (from === 'rgb') {
                const match = String(color).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
                if (!match) {
                    return errorResponse(res, '无效的RGB格式', 10012);
                }
                r = parseInt(match[1]);
                g = parseInt(match[2]);
                b = parseInt(match[3]);
                a = match[4] !== undefined ? parseFloat(match[4]) : 1;
            } else if (from === 'hsl') {
                const match = String(color).match(/hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)/i);
                if (!match) {
                    return errorResponse(res, '无效的HSL格式', 10012);
                }
                const h = parseInt(match[1]) / 360;
                const s = parseFloat(match[2]) / 100;
                const l = parseFloat(match[3]) / 100;
                a = match[4] !== undefined ? parseFloat(match[4]) : 1;

                if (s === 0) {
                    r = g = b = Math.round(l * 255);
                } else {
                    const hue2rgb = (p, q, t) => {
                        if (t < 0) t += 1;
                        if (t > 1) t -= 1;
                        if (t < 1/6) return p + (q - p) * 6 * t;
                        if (t < 1/2) return q;
                        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                        return p;
                    };
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                    const p = 2 * l - q;
                    r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
                    g = Math.round(hue2rgb(p, q, h) * 255);
                    b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
                }
            } else {
                return errorResponse(res, `不支持的源格式: ${from}`, 10009);
            }

            let result;
            if (to === 'hex') {
                const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
                result = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                if (a < 1) result += toHex(Math.round(a * 255));
            } else if (to === 'rgb') {
                result = a < 1 
                    ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})` 
                    : `rgb(${r}, ${g}, ${b})`;
            } else if (to === 'hsl') {
                const rNorm = r / 255;
                const gNorm = g / 255;
                const bNorm = b / 255;
                const max = Math.max(rNorm, gNorm, bNorm);
                const min = Math.min(rNorm, gNorm, bNorm);
                let h, s, l = (max + min) / 2;

                if (max === min) {
                    h = s = 0;
                } else {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
                        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
                        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
                    }
                }

                result = a < 1
                    ? `hsla(${Math.round(h * 360)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%, ${a.toFixed(2)})`
                    : `hsl(${Math.round(h * 360)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`;
            } else {
                return errorResponse(res, `不支持的目标格式: ${to}`, 10009);
            }

            successResponse(res, {
                result,
                from,
                to,
                rgb: { r, g, b, a },
                original: color
            });
        } catch (error) {
            console.error('❌ 颜色转换失败:', error);
            errorResponse(res, '颜色转换失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/csv-to-json', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { delimiter: ',', hasHeader: true });
        const { text: csv } = params;
        const { delimiter, hasHeader } = options;

        if (csv === undefined || csv === null) {
            return errorResponse(res, '缺少必要参数: text (CSV内容)', 10001);
        }

        try {
            const lines = String(csv).trim().split('\n');
            if (lines.length === 0) {
                return successResponse(res, { result: [], rowCount: 0 });
            }

            const headers = hasHeader ? lines[0].split(delimiter).map(h => h.trim()) : null;
            const dataLines = hasHeader ? lines.slice(1) : lines;

            const result = dataLines.map((line, idx) => {
                const values = line.split(delimiter).map(v => v.trim());
                if (headers) {
                    const obj = {};
                    headers.forEach((header, i) => {
                        obj[header] = values[i] || '';
                    });
                    return obj;
                } else {
                    return { index: idx, values };
                }
            });

            successResponse(res, {
                result,
                rowCount: result.length,
                hasHeader,
                headers
            });
        } catch (error) {
            console.error('❌ CSV转JSON失败:', error);
            errorResponse(res, 'CSV转JSON失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/json-to-csv', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { delimiter: ',' });
        const { text: jsonText } = params;
        const { delimiter } = options;

        if (jsonText === undefined || jsonText === null) {
            return errorResponse(res, '缺少必要参数: text (JSON内容)', 10001);
        }

        try {
            let jsonData;
            try {
                jsonData = JSON.parse(String(jsonText));
            } catch (e) {
                return errorResponse(res, 'JSON格式错误: ' + e.message, 10010);
            }

            if (!Array.isArray(jsonData)) {
                jsonData = [jsonData];
            }

            if (jsonData.length === 0) {
                return successResponse(res, { result: '', rowCount: 0 });
            }

            const headers = Object.keys(jsonData[0]);
            const csvLines = [headers.join(delimiter)];

            jsonData.forEach(row => {
                const values = headers.map(header => {
                    let val = row[header];
                    if (val === null || val === undefined) val = '';
                    val = String(val);
                    if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
                        val = '"' + val.replace(/"/g, '""') + '"';
                    }
                    return val;
                });
                csvLines.push(values.join(delimiter));
            });

            const result = csvLines.join('\n');

            successResponse(res, {
                result,
                rowCount: jsonData.length,
                headers
            });
        } catch (error) {
            console.error('❌ JSON转CSV失败:', error);
            errorResponse(res, 'JSON转CSV失败: ' + error.message, 10000, 500);
        }
    });

    // URL 编码/解码
    app.post('/api/convert/url-encode', (req, res) => {
        const { params } = extractParams(req, ['text']);
        const { text } = params;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const result = encodeURIComponent(String(text));
            console.log(`✅ URL 编码成功: "${text.substring(0, 20)}..." → "${result.substring(0, 20)}..."`);
            successResponse(res, {
                result,
                original: text,
                mode: 'encode'
            });
        } catch (error) {
            console.error('❌ URL 编码失败:', error);
            errorResponse(res, 'URL 编码失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/convert/url-decode', (req, res) => {
        const { params } = extractParams(req, ['text']);
        const { text } = params;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const result = decodeURIComponent(String(text));
            console.log(`✅ URL 解码成功`);
            successResponse(res, {
                result,
                original: text,
                mode: 'decode'
            });
        } catch (error) {
            console.error('❌ URL 解码失败:', error);
            return errorResponse(res, 'URL 解码失败: 无效的编码字符串', 10002);
        }
    });

    // Base64 编码/解码
    app.post('/api/convert/base64', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { mode: 'encode' });
        const { text } = params;
        const { mode } = options;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            let result;
            if (mode === 'encode') {
                result = Buffer.from(String(text), 'utf8').toString('base64');
            } else if (mode === 'decode') {
                result = Buffer.from(String(text), 'base64').toString('utf8');
            } else {
                return errorResponse(res, `不支持的模式: ${mode}，请使用 encode 或 decode`, 10009);
            }
            console.log(`✅ Base64 ${mode === 'encode' ? '编码' : '解码'}成功`);
            successResponse(res, {
                result,
                original: text,
                mode: mode
            });
        } catch (error) {
            console.error('❌ Base64 处理失败:', error);
            return errorResponse(res, 'Base64 处理失败: 无效的编码字符串', 10002);
        }
    });

    // HTML 实体编码/解码
    app.post('/api/convert/html-entity', (req, res) => {
        const { params, options } = extractParams(req, ['text'], { mode: 'encode' });
        const { text } = params;
        const { mode } = options;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            let result;
            if (mode === 'encode') {
                // HTML 实体编码
                result = String(text)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
            } else if (mode === 'decode') {
                // HTML 实体解码
                result = String(text)
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
                    .replace(/&x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
                    .replace(/&amp;/g, '&'); // 最后解码 &amp;
            } else {
                return errorResponse(res, `不支持的模式: ${mode}，请使用 encode 或 decode`, 10009);
            }

            console.log(`✅ HTML 实体 ${mode === 'encode' ? '编码' : '解码'}成功`);
            successResponse(res, {
                result,
                original: text,
                mode: mode
            });
        } catch (error) {
            console.error('❌ HTML 实体处理失败:', error);
            return errorResponse(res, 'HTML 实体处理失败: ' + error.message, 10002);
        }
    });

    // JSON 校验
    app.post('/api/convert/json-validate', (req, res) => {
        const { params } = extractParams(req, ['text']);
        const { text } = params;

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            const obj = JSON.parse(String(text));
            successResponse(res, {
                valid: true,
                result: obj,
                message: 'JSON 格式正确'
            });
        } catch (error) {
            // 尝试提取错误位置信息
            const errorMsg = error.message;
            const match = errorMsg.match(/position (\d+)/i);
            let errorPosition = null;
            let errorLine = null;
            let errorColumn = null;

            if (match) {
                errorPosition = parseInt(match[1]);
                const textStr = String(text);
                let line = 1;
                let column = 1;
                for (let i = 0; i < errorPosition && i < textStr.length; i++) {
                    if (textStr[i] === '\n') {
                        line++;
                        column = 1;
                    } else {
                        column++;
                    }
                }
                errorLine = line;
                errorColumn = column;
            }

            console.log(`❌ JSON 校验失败: ${errorMsg}`);
            return errorResponse(res, {
                valid: false,
                error: errorMsg,
                errorPosition,
                errorLine,
                errorColumn,
                message: 'JSON 格式错误'
            }, 10010);
        }
    });

    // 日期计算器
    app.post('/api/convert/date-calc', (req, res) => {
        const { params, options } = extractParams(req, ['date1', 'date2'], { mode: 'diff', count: 0, unit: 'day' });
        const { date1, date2 } = params;
        const { mode, count, unit } = options;

        try {
            let result;

            if (mode === 'diff') {
                // 计算日期差
                if (!date1 || !date2) {
                    return errorResponse(res, '缺少必要参数: date1, date2', 10001);
                }

                const d1 = new Date(date1);
                const d2 = new Date(date2);

                if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                    return errorResponse(res, '无效的日期格式', 10002);
                }

                const diffMs = Math.abs(d2 - d1);
                const diffSecs = Math.floor(diffMs / 1000);
                const diffMins = Math.floor(diffSecs / 60);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                const diffWeeks = Math.floor(diffDays / 7);
                const diffMonths = Math.floor(diffDays / 30);
                const diffYears = Math.floor(diffDays / 365);

                result = {
                    days: diffDays,
                    hours: diffHours,
                    minutes: diffMins,
                    seconds: diffSecs,
                    weeks: diffWeeks,
                    months: diffMonths,
                    years: diffYears,
                    date1: date1,
                    date2: date2
                };

                console.log(`✅ 日期差计算: ${date1} ↔ ${date2} = ${diffDays} 天`);
            } else if (mode === 'add') {
                // 日期加减
                if (!date1) {
                    return errorResponse(res, '缺少必要参数: date1', 10001);
                }

                const d = new Date(date1);
                if (isNaN(d.getTime())) {
                    return errorResponse(res, '无效的日期格式', 10002);
                }

                let addMs = 0;
                const n = parseInt(count) || 0;

                switch (unit) {
                    case 'day':
                        addMs = n * 24 * 60 * 60 * 1000;
                        break;
                    case 'hour':
                        addMs = n * 60 * 60 * 1000;
                        break;
                    case 'minute':
                        addMs = n * 60 * 1000;
                        break;
                    case 'second':
                        addMs = n * 1000;
                        break;
                    case 'week':
                        addMs = n * 7 * 24 * 60 * 60 * 1000;
                        break;
                    case 'month':
                        d.setMonth(d.getMonth() + n);
                        result = {
                            original: date1,
                            result: d.toISOString().split('T')[0],
                            added: n,
                            unit: unit
                        };
                        console.log(`✅ 日期计算: ${date1} + ${n} ${unit} = ${d.toISOString().split('T')[0]}`);
                        return successResponse(res, result);
                    case 'year':
                        d.setFullYear(d.getFullYear() + n);
                        result = {
                            original: date1,
                            result: d.toISOString().split('T')[0],
                            added: n,
                            unit: unit
                        };
                        console.log(`✅ 日期计算: ${date1} + ${n} ${unit} = ${d.toISOString().split('T')[0]}`);
                        return successResponse(res, result);
                    default:
                        return errorResponse(res, `不支持的单位: ${unit}`, 10009);
                }

                const newDate = new Date(d.getTime() + addMs);
                result = {
                    original: date1,
                    result: newDate.toISOString().split('T')[0],
                    added: n,
                    unit: unit
                };

                console.log(`✅ 日期计算: ${date1} + ${n} ${unit} = ${newDate.toISOString().split('T')[0]}`);
            } else if (mode === 'workday') {
                // 计算工作日（排除周末）
                if (!date1 || !date2) {
                    return errorResponse(res, '缺少必要参数: date1, date2', 10001);
                }

                const d1 = new Date(date1);
                const d2 = new Date(date2);

                if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                    return errorResponse(res, '无效的日期格式', 10002);
                }

                let workDays = 0;
                const start = d1 < d2 ? d1 : d2;
                const end = d1 < d2 ? d2 : d1;
                const current = new Date(start);

                while (current <= end) {
                    const dayOfWeek = current.getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                        workDays++;
                    }
                    current.setDate(current.getDate() + 1);
                }

                result = {
                    workdays: workDays,
                    totalDays: Math.floor(Math.abs(d2 - d1) / (24 * 60 * 60 * 1000)) + 1,
                    date1: date1,
                    date2: date2
                };

                console.log(`✅ 工作日计算: ${date1} ↔ ${date2} = ${workDays} 个工作日`);
            } else {
                return errorResponse(res, `不支持的模式: ${mode}，支持: diff, add, workday`, 10009);
            }

            successResponse(res, result);
        } catch (error) {
            console.error('❌ 日期计算失败:', error);
            errorResponse(res, '日期计算失败: ' + error.message, 10000, 500);
        }
    });

    return app;
};