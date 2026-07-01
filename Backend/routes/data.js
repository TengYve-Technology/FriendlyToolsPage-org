const { successResponse, errorResponse } = require('../utils/response');
const yaml = require('js-yaml');

const DEFAULT_COLORS = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 159, 64, 0.7)',
    'rgba(214, 39, 40, 0.7)'
];

const DEFAULT_BORDER_COLORS = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(40, 159, 64, 1)',
    'rgba(214, 39, 40, 1)'
];

const VALID_CHART_TYPES = ['bar', 'line', 'pie', 'doughnut'];

module.exports = function(app, dependencies) {
    const { errorMap, dbPath } = dependencies;

    app.post('/api/data/chart-config', (req, res) => {
        const { data, options } = req.body;
        const chartType = (options && options.chartType) ? options.chartType : (req.body.chartType || 'bar');
        const labels = (data && data.labels !== undefined) ? data.labels : req.body.labels;
        const datasets = (data && data.datasets !== undefined) ? data.datasets : req.body.datasets;
        const title = (options && options.title) ? options.title : (req.body.title || '');

        if (!labels || !Array.isArray(labels) || labels.length === 0) {
            return errorResponse(res, '缺少必要参数: labels（标签数组不能为空）', 10001);
        }

        if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
            return errorResponse(res, '缺少必要参数: datasets（数据集数组不能为空）', 10001);
        }

        if (!VALID_CHART_TYPES.includes(chartType)) {
            return errorResponse(res, `不支持的图表类型: ${chartType}，支持的类型: ${VALID_CHART_TYPES.join(', ')}`, 10002);
        }

        try {
            const chartDatasets = datasets.map((ds, index) => {
                const color = ds.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                const borderColor = DEFAULT_BORDER_COLORS[index % DEFAULT_BORDER_COLORS.length];

                if (chartType === 'pie' || chartType === 'doughnut') {
                    return {
                        label: ds.label || `数据系列 ${index + 1}`,
                        data: ds.data || [],
                        backgroundColor: ds.color ? 
                            (Array.isArray(ds.color) ? ds.color : generateColorArray(ds.color, (ds.data || []).length)) :
                            DEFAULT_COLORS.slice(0, (ds.data || []).length),
                        borderColor: ds.color ?
                            (Array.isArray(ds.color) ? ds.color.map(c => c.replace('0.7', '1')) : generateColorArray(borderColor, (ds.data || []).length)) :
                            DEFAULT_BORDER_COLORS.slice(0, (ds.data || []).length),
                        borderWidth: 2
                    };
                } else {
                    return {
                        label: ds.label || `数据系列 ${index + 1}`,
                        data: ds.data || [],
                        backgroundColor: color,
                        borderColor: borderColor,
                        borderWidth: 2,
                        fill: chartType === 'line' ? false : undefined,
                        tension: chartType === 'line' ? 0.3 : undefined
                    };
                }
            });

            const chartConfig = {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: chartDatasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                font: {
                                    size: 12
                                },
                                padding: 15
                            }
                        },
                        title: {
                            display: !!title,
                            text: title,
                            font: {
                                size: 16,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        tooltip: {
                            mode: chartType === 'pie' || chartType === 'doughnut' ? 'index' : 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: {
                                size: 14
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12
                        }
                    },
                    scales: (chartType === 'bar' || chartType === 'line') ? {
                        x: {
                            display: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 12
                                }
                            }
                        },
                        y: {
                            display: true,
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                font: {
                                    size: 12
                                }
                            }
                        }
                    } : undefined,
                    animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                    }
                }
            };

            successResponse(res, {
                chartConfig,
                chartType,
                labelCount: labels.length,
                datasetCount: datasets.length
            });
        } catch (error) {
            console.error('❌ 图表配置生成失败:', error);
            errorResponse(res, '图表配置生成失败: ' + error.message, 10000, 500);
        }
    });

    app.post('/api/data/json-to-yaml', (req, res) => {
        const { data, options } = req.body;
        const source = data && data.source !== undefined ? data.source : req.body.source;
        const indent = (options && options.indent !== undefined) ? options.indent : 2;

        if (!source || typeof source !== 'string' || source.trim() === '') {
            return errorResponse(res, '缺少必要参数: source（源文本不能为空）', 10001);
        }

        try {
            const obj = JSON.parse(source);
            const result = yaml.dump(obj, {
                indent: typeof indent === 'number' ? indent : 2,
                lineWidth: -1
            });

            successResponse(res, {
                result,
                sourceLength: source.length,
                resultLength: result.length
            });
        } catch (error) {
            console.error('❌ JSON 转 YAML 失败:', error);
            errorResponse(res, 'JSON 解析失败: ' + error.message, 10002, 400);
        }
    });

    app.post('/api/data/yaml-to-json', (req, res) => {
        const { data, options } = req.body;
        const source = data && data.source !== undefined ? data.source : req.body.source;
        const indent = (options && options.indent !== undefined) ? options.indent : 2;

        if (!source || typeof source !== 'string' || source.trim() === '') {
            return errorResponse(res, '缺少必要参数: source（源文本不能为空）', 10001);
        }

        try {
            const obj = yaml.load(source);
            const indentVal = typeof indent === 'number' ? indent : 2;
            const result = JSON.stringify(obj, null, indentVal);

            successResponse(res, {
                result,
                sourceLength: source.length,
                resultLength: result.length
            });
        } catch (error) {
            console.error('❌ YAML 转 JSON 失败:', error);
            errorResponse(res, 'YAML 解析失败: ' + error.message, 10002, 400);
        }
    });

    return app;
};

function generateColorArray(baseColor, count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hueShift = (i * 30) % 360;
        colors.push(adjustColorHue(baseColor, hueShift));
    }
    return colors;
}

function adjustColorHue(color, degrees) {
    return color;
}
