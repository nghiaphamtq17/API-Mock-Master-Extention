// Injected script for API Mock Master
// This script runs in the page context and can override fetch/XMLHttpRequest

(function() {
    'use strict';

    // Prevent multiple injections
    if (window.apiOverrideInjected) {
        return;
    }
    window.apiOverrideInjected = true;

    class APIOverrideInjector {
        constructor() {
            this.endpoints = [];
            this.settings = {};
            this.originalFetch = window.fetch;
            this.originalXHROpen = XMLHttpRequest.prototype.open;
            this.originalXHRSend = XMLHttpRequest.prototype.send;
            
            this.init();
        }

        async init() {
            await this.loadConfig();
            this.setupInterceptors();
            this.setupConfigListener();
        }

        async loadConfig() {
            try {
                // Get config from extension
                const response = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, resolve);
                });
                
                this.endpoints = response.endpoints || [];
                this.settings = response.settings || {};
            } catch (error) {
                console.error('Error loading config:', error);
            }
        }

        setupInterceptors() {
            // Override fetch
            window.fetch = async (...args) => {
                const url = args[0];
                const options = args[1] || {};
                
                const overriddenResponse = await this.checkForOverride(url, options.method || 'GET', options);
                
                if (overriddenResponse) {
                    this.logOverride('FETCH', url, options.method || 'GET');
                    return overriddenResponse;
                }
                
                return this.originalFetch.apply(this, args);
            };

            // Override XMLHttpRequest
            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._method = method;
                this._url = url;
                this._originalOnReadyStateChange = this.onreadystatechange;
                return this.originalXHROpen.apply(this, [method, url, ...args]);
            };

            XMLHttpRequest.prototype.send = function(data) {
                const xhr = this;
                
                // Store original handlers
                const originalOnReadyStateChange = xhr.onreadystatechange;
                const originalOnLoad = xhr.onload;
                const originalOnError = xhr.onerror;
                
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        injector.checkXHROverride(xhr);
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
            
            const overriddenResponse = await this.checkForOverride(url, method, {});
            
            if (overriddenResponse) {
                // Override the response
                const responseText = await overriddenResponse.text();
                const status = overriddenResponse.status;
                const statusText = overriddenResponse.statusText;
                
                // Mock the response
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
                
                this.logOverride('XHR', url, method);
            }
        }

        async checkForOverride(url, method, options) {
            if (!this.settings.enableOverride || this.endpoints.length === 0) {
                return null;
            }

            const matchingEndpoint = this.findMatchingEndpoint(url, method);
            
            if (!matchingEndpoint) {
                return null;
            }

            // Apply delay if specified
            if (matchingEndpoint.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, matchingEndpoint.delay));
            }

            // Create response with proper headers
            const headers = new Headers();
            Object.entries(matchingEndpoint.headers).forEach(([key, value]) => {
                headers.set(key, value);
            });

            const response = new Response(matchingEndpoint.body, {
                status: matchingEndpoint.status,
                statusText: this.getStatusText(matchingEndpoint.status),
                headers: headers
            });

            return response;
        }

        findMatchingEndpoint(url, method) {
            return this.endpoints.find(endpoint => {
                if (!endpoint.enabled) return false;
                
                // Check method
                if (endpoint.method !== '*' && endpoint.method !== method) {
                    return false;
                }
                
                // Check URL pattern
                return this.matchUrlPattern(url, endpoint.url);
            });
        }

        matchUrlPattern(url, pattern) {
            try {
                // Convert pattern to regex
                let regexPattern = pattern
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
                    .replace(/\\\*/g, '.*'); // Convert escaped * to .*
                
                const regex = new RegExp(`^${regexPattern}$`);
                return regex.test(url);
            } catch (error) {
                console.error('Error matching URL pattern:', error);
                return false;
            }
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

        logOverride(type, url, method) {
            if (this.settings.logRequests) {
                console.log(`[API Mock Master] ${type} ${method} ${url} - Overridden`);
            }
        }

        setupConfigListener() {
            // Listen for config updates
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'UPDATE_CONFIG') {
                    this.endpoints = message.endpoints || [];
                    this.settings = message.settings || {};
                    sendResponse({ success: true });
                }
            });
        }
    }

    // Initialize the injector
    const injector = new APIOverrideInjector();

    // Expose API for debugging
    window.apiOverride = {
        getEndpoints: () => injector.endpoints,
        getSettings: () => injector.settings,
        testOverride: (url, method = 'GET') => injector.checkForOverride(url, method, {})
    };

})();
