// Content script for API Mock Master
class ContentScriptManager {
    constructor() {
        this.overrides = [];
        this.settings = {};
        this.originalFetch = window.fetch;
        this.originalXHROpen = XMLHttpRequest.prototype.open;
        this.originalXHRSend = XMLHttpRequest.prototype.send;
        
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupInterceptors();
        this.setupMessageListener();
    }

    async loadConfig() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
            this.overrides = response.overrides || [];
            this.settings = response.settings || {};
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    setupInterceptors() {
        // Intercept fetch requests
        window.fetch = async (...args) => {
            const url = args[0];
            const options = args[1] || {};
            
            // Check for override
            const overriddenResponse = await this.checkForOverride(url, options.method || 'GET', options);
            
            if (overriddenResponse) {
                this.logRequest('FETCH', url, options.method || 'GET', overriddenResponse);
                return overriddenResponse;
            }
            
            return this.originalFetch.apply(this, args);
        };

        // Intercept XMLHttpRequest
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._method = method;
            this._url = url;
            return this.originalXHROpen.apply(this, [method, url, ...args]);
        };

        XMLHttpRequest.prototype.send = function(data) {
            const xhr = this;
            const originalOnReadyStateChange = xhr.onreadystatechange;
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    // Request completed, check if we need to override
                    contentScriptManager.checkXHROverride(xhr);
                }
                
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(this, arguments);
                }
            };
            
            return this.originalXHRSend.apply(this, arguments);
        };
    }

    async checkXHROverride(xhr) {
        const url = xhr._url;
        const method = xhr._method;
        
        // Check for override
        const overriddenResponse = await this.checkForOverride(url, method, {});
        
        if (overriddenResponse) {
            // Override the response
            const responseText = await overriddenResponse.text();
            const status = overriddenResponse.status;
            const statusText = overriddenResponse.statusText;
            
            // Create a mock response object
            Object.defineProperty(xhr, 'responseText', {
                value: responseText,
                writable: false
            });
            
            Object.defineProperty(xhr, 'status', {
                value: status,
                writable: false
            });
            
            Object.defineProperty(xhr, 'statusText', {
                value: statusText,
                writable: false
            });
            
            this.logRequest('XHR', url, method, overriddenResponse);
        }
    }



    async checkForOverride(url, method, options) {
        if (!this.settings.enableOverride || this.overrides.length === 0) {
            return null;
        }

        const matchingOverride = this.findMatchingOverride(url, method);
        
        if (!matchingOverride) {
            return null;
        }

        // Apply delay if specified
        if (matchingOverride.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, matchingOverride.delay));
        }

        // Handle different override types
        if (matchingOverride.type === 'custom') {
            // Custom Response - return custom data directly
            const responseBody = matchingOverride.body || '{}';
            const responseHeaders = matchingOverride.headers || { 'Content-Type': 'application/json' };
            
            return new Response(responseBody, {
                status: matchingOverride.status || 200,
                statusText: this.getStatusText(matchingOverride.status || 200),
                headers: responseHeaders
            });
        } else if (matchingOverride.type === 'proxy') {
            // Proxy to localhost - redirect request
            return this.handleProxyRequest(url, options, matchingOverride);
        }

        return null;
    }

    async handleProxyRequest(url, options, override) {
        try {
            // Transform request data
            const transformedOptions = await this.transformRequest(options, override);
            
            // Make request to target URL
            const targetUrl = override.targetUrl;
            const response = await this.originalFetch(targetUrl, transformedOptions);
            
            // Transform response data
            const transformedResponse = await this.transformResponse(response, override);
            
            return transformedResponse;
        } catch (error) {
            console.error('Proxy request failed:', error);
            return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
                status: 500,
                statusText: 'Internal Server Error',
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    async transformRequest(options, override) {
        const transformedOptions = { ...options };
        
        // Add custom headers
        if (override.requestHeaders) {
            transformedOptions.headers = {
                ...transformedOptions.headers,
                ...override.requestHeaders
            };
        }
        
        // Add custom body
        if (override.requestBody) {
            transformedOptions.body = override.requestBody;
        }
        
        return transformedOptions;
    }

    async transformResponse(response, override) {
        // For now, just return the response as-is
        // In the future, you can add response transformation logic here
        return response;
    }

    findMatchingOverride(url, method) {
        return this.overrides.find(override => {
            if (!override.enabled) return false;
            
            // Check method
            if (override.method !== '*' && override.method !== method) {
                return false;
            }
            
            // Check URL pattern
            return this.matchUrlPattern(url, override.url);
        });
    }

    matchUrlPattern(url, pattern) {
        // Convert pattern to regex
        // Support wildcards (*) and basic regex patterns
        let regexPattern = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
            .replace(/\\\*/g, '.*'); // Convert escaped * to .*
        
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(url);
    }

    getStatusText(status) {
        const statusTexts = {
            200: 'OK',
            201: 'Created',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error',
            502: 'Bad Gateway',
            503: 'Service Unavailable'
        };
        
        return statusTexts[status] || 'Unknown';
    }

    async logRequest(type, url, method, response) {
        if (this.settings.logRequests) {
            try {
                await chrome.runtime.sendMessage({
                    type: 'LOG_REQUEST',
                    data: {
                        type: type,
                        url: url,
                        method: method,
                        status: response.status,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('Error logging request:', error);
            }
        }
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'UPDATE_CONFIG') {
                this.overrides = message.overrides || [];
                this.settings = message.settings || {};
                sendResponse({ success: true });
            }
        });
    }
}

// Initialize content script manager
const contentScriptManager = new ContentScriptManager();

// Also inject the override script into the page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);
