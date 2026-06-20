const { successResponse, errorResponse } = require('../utils/response');

const MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.', ' ': '/'
};

const MORSE_CODE_REVERSE = Object.fromEntries(
    Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

const SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '胡', '朱', '郭', '何', '高', '林', '罗'];
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平'];
const CITIES = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '南京市', '西安市', '重庆市'];
const EMAIL_DOMAINS = ['gmail.com', 'qq.com', '163.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
    const prefixes = ['138', '139', '150', '151', '152', '158', '159', '182', '183', '188', '130', '131', '132', '155', '156', '185', '186'];
    let phone = randomItem(prefixes);
    for (let i = 0; i < 8; i++) {
        phone += Math.floor(Math.random() * 10);
    }
    return phone;
}

function randomIdCard() {
    const areaCodes = ['110101', '310101', '440103', '440303', '330102', '510104', '420102', '320102', '610102', '500103'];
    const area = randomItem(areaCodes);
    const year = 1970 + Math.floor(Math.random() * 40);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    const seq = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const check = Math.floor(Math.random() * 10);
    return `${area}${year}${month}${day}${seq}${check}`;
}

module.exports = function(app, dependencies) {
    app.post('/api/fun/morse', (req, res) => {
        const { data, options } = req.body;
        const text = (data && data.text !== undefined) ? data.text : req.body.text;
        const mode = (options && options.mode) ? options.mode : (req.body.mode || 'encode');

        if (text === undefined || text === null) {
            return errorResponse(res, '缺少必要参数: text', 10001);
        }

        try {
            let result;

            if (mode === 'encode') {
                result = String(text).toUpperCase().split('').map(char => {
                    return MORSE_CODE[char] || char;
                }).join(' ');
            } else if (mode === 'decode') {
                result = String(text).split(' / ').map(word => {
                    return word.split(' ').map(code => {
                        return MORSE_CODE_REVERSE[code] || code;
                    }).join('');
                }).join(' ');
            } else {
                return errorResponse(res, `不支持的模式: ${mode}`, 10009);
            }

            successResponse(res, {
                result,
                mode,
                original: text
            });
        } catch (error) {
            console.error('❌ 摩斯电码转换失败:', error);
            errorResponse(res, '摩斯电码转换失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/fun/random-picker', (req, res) => {
        const { data, options } = req.body;
        const items = (data && data.items !== undefined) ? data.items : req.body.items;
        const count = (options && options.count) ? options.count : (req.body.count || 1);
        const allowRepeat = (options && options.allowRepeat) !== undefined ? options.allowRepeat : (req.body.allowRepeat || false);

        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse(res, '缺少必要参数: items (数组)', 10001);
        }

        try {
            const num = parseInt(count) || 1;
            const pool = [...items];
            const result = [];

            if (allowRepeat) {
                for (let i = 0; i < num; i++) {
                    const idx = Math.floor(Math.random() * pool.length);
                    result.push(pool[idx]);
                }
            } else {
                if (num > pool.length) {
                    return errorResponse(res, `抽取数量不能超过选项数量 (${pool.length})`, 10002);
                }
                for (let i = 0; i < num; i++) {
                    const idx = Math.floor(Math.random() * pool.length);
                    result.push(pool.splice(idx, 1)[0]);
                }
            }

            successResponse(res, {
                result,
                count: num,
                total: items.length,
                allowRepeat
            });
        } catch (error) {
            console.error('❌ 随机抽取失败:', error);
            errorResponse(res, '随机抽取失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/fun/identity', (req, res) => {
        const { data, options } = req.body;
        const count = (options && options.count) ? options.count : (req.body.count || 1);
        const gender = (options && options.gender) ? options.gender : (req.body.gender || 'random');

        try {
            const num = parseInt(count) || 1;
            const identities = [];

            for (let i = 0; i < num; i++) {
                const g = gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : gender;
                const surname = randomItem(SURNAMES);
                const givenName = g === 'male' 
                    ? randomItem(['伟', '强', '磊', '军', '洋', '勇', '杰', '涛', '明', '超', '鹏', '华', '飞', '龙', '刚'])
                    : randomItem(['芳', '娜', '敏', '静', '丽', '艳', '娟', '秀英', '霞', '平', '琳', '雪', '倩', '婷', '梅']);
                const name = surname + givenName;
                const birthYear = 1980 + Math.floor(Math.random() * 30);
                const birthMonth = 1 + Math.floor(Math.random() * 12);
                const birthDay = 1 + Math.floor(Math.random() * 28);

                identities.push({
                    name,
                    gender: g === 'male' ? '男' : '女',
                    age: 2026 - birthYear,
                    birthday: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
                    phone: randomPhone(),
                    email: `${name.toLowerCase()}${Math.floor(Math.random() * 1000)}@${randomItem(EMAIL_DOMAINS)}`,
                    idCard: randomIdCard(),
                    city: randomItem(CITIES),
                    occupation: randomItem(['工程师', '设计师', '产品经理', '运营', '销售', '教师', '医生', '会计', '律师', '程序员'])
                });
            }

            successResponse(res, {
                identities,
                count: num
            });
        } catch (error) {
            console.error('❌ 虚拟身份生成失败:', error);
            errorResponse(res, '虚拟身份生成失败: ' + error.message, 10000, 500);
        }
    });

    return app;
};