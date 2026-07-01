const { successResponse, errorResponse } = require('../utils/response');
const { extractParams } = require('../utils/params');
const Diff = require('diff');

module.exports = function(app, dependencies) {
    const { errorMap, dbPath } = dependencies;

    app.post('/api/text/diff', (req, res) => {
        const { data, options } = req.body;
        const originalText = data && data.originalText !== undefined ? data.originalText : req.body.originalText;
        const modifiedText = data && data.modifiedText !== undefined ? data.modifiedText : req.body.modifiedText;
        const mode = (options && options.mode !== undefined) ? options.mode : (req.body.mode || 'lines');

        if (originalText === undefined || originalText === null) {
            return errorResponse(res, '缺少必要参数: originalText（原始文本不能为空）', 10001);
        }

        if (modifiedText === undefined || modifiedText === null) {
            return errorResponse(res, '缺少必要参数: modifiedText（修改后文本不能为空）', 10001);
        }

        if (mode !== 'lines' && mode !== 'chars') {
            return errorResponse(res, '不支持的对比模式: ' + mode + '，支持的模式: lines, chars', 10002);
        }

        try {
            let diffs;
            if (mode === 'lines') {
                diffs = Diff.diffLines(originalText, modifiedText);
            } else {
                diffs = Diff.diffChars(originalText, modifiedText);
            }

            let addedCount = 0;
            let removedCount = 0;

            diffs.forEach(part => {
                if (part.added) {
                    if (mode === 'lines') {
                        addedCount += part.value.split('\n').length;
                        if (part.value.endsWith('\n')) {
                            addedCount--;
                        }
                    } else {
                        addedCount += part.value.length;
                    }
                } else if (part.removed) {
                    if (mode === 'lines') {
                        removedCount += part.value.split('\n').length;
                        if (part.value.endsWith('\n')) {
                            removedCount--;
                        }
                    } else {
                        removedCount += part.value.length;
                    }
                }
            });

            const result = {
                diffs: diffs.map(part => ({
                    value: part.value,
                    added: !!part.added,
                    removed: !!part.removed
                })),
                mode: mode,
                originalLength: originalText.length,
                modifiedLength: modifiedText.length,
                addedCount: addedCount,
                removedCount: removedCount
            };

            successResponse(res, result);
        } catch (error) {
            console.error('❌ 文本对比失败:', error);
            errorResponse(res, '文本对比失败: ' + error.message, 10000, 500);
        }
    });

    return app;
};
