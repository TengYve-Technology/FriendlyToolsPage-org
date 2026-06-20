
const API_BASE = (() => {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port;
    
    if (protocol === 'file:') {
        return 'http://localhost:3000';
    }
    
    if (host === 'localhost' || host === '127.0.0.1') {
        const usePort = port || '3000';
        return `${protocol}//${host}:${usePort}`;
    }
    
    return '';
})();

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        method: options.method || 'GET',
        headers: options.headers || {}
    };

    if (options.data !== undefined || options.options !== undefined) {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify({
            data: options.data,
            options: options.options || {}
        });
    }

    if (options.formData) {
        config.body = options.formData;
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return response;
    } catch (error) {
        console.error('API 请求失败:', error);
        throw error;
    }
}
