const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const registerRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const frontPath = path.join(__dirname, '..', 'Fronts');
app.use(express.static(frontPath));

const errorMapPath = path.join(__dirname, 'DataBase', 'ErrorMapping.json');
let errorMap = {};

function loadErrorMap() {
    try {
        const data = fs.readFileSync(errorMapPath, 'utf-8');
        errorMap = JSON.parse(data);
        console.log('✅ 错误码映射已加载');
    } catch (err) {
        console.error('❌ 加载错误码映射失败:', err.message);
        errorMap = {};
    }
}
loadErrorMap();

const dbPath = path.join(__dirname, 'DataBase', 'tools.json');

function readDatabase() {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ 读取数据库失败:', error);
        return { tools: [] };
    }
}

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

app.get('/api/tools', (req, res) => {
    const db = readDatabase();
    successResponse(res, db.tools);
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器健康，接口正常！'
    });
});

registerRoutes(app, { errorMap, dbPath });

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: '接口不存在',
            errorCode: 10404
        });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`✅ 服务器已启动: http://localhost:${PORT}`);
    console.log(`📡 前端页面: http://localhost:${PORT}/index.html`);
    console.log(`🗄️ 数据库文件: ${dbPath}`);
    console.log(`总之，服务器启动成功！`);
});

module.exports = app;