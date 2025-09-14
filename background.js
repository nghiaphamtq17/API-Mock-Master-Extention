// Background script for API Mock Master
class BackgroundManager {
    constructor() {
        this.overrides = [];
        this.settings = {
            enableOverride: false,
            showNotifications: true,
            logRequests: false
        };
        
        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.setupDeclarativeNetRequest();
    }

    async loadConfig() {
        try {
            const result = await chrome.storage.local.get(['overrides', 'settings']);
            this.overrides = result.overrides || [];
            this.settings = { ...this.settings, ...result.settings };
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    setupEventListeners() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Listen for tab updates to inject content script
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.injectContentScript(tabId);
            }
        });
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'UPDATE_CONFIG':
                    this.overrides = message.overrides || [];
                    this.settings = message.settings || this.settings;
                    await this.updateDeclarativeNetRequest();
                    sendResponse({ success: true });
                    break;

                case 'GET_CONFIG':
                    sendResponse({
                        overrides: this.overrides,
                        settings: this.settings
                    });
                    break;

                case 'LOG_REQUEST':
                    if (this.settings.logRequests) {
                        console.log('API Request:', message.data);
                    }
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async setupDeclarativeNetRequest() {
        try {
            // Clear existing rules
            const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
            const ruleIdsToRemove = existingRules.map(rule => rule.id);
            
            if (ruleIdsToRemove.length > 0) {
                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: ruleIdsToRemove
                });
            }

            await this.updateDeclarativeNetRequest();
        } catch (error) {
            console.error('Error setting up declarative net request:', error);
        }
    }

    async updateDeclarativeNetRequest() {
        if (!this.settings.enableOverride || this.endpoints.length === 0) {
            return;
        }

        try {
            const rules = [];
            const enabledEndpoints = this.endpoints.filter(ep => ep.enabled);

            for (let i = 0; i < enabledEndpoints.length; i++) {
                const endpoint = enabledEndpoints[i];
                
                // Create rule for each endpoint
                const rule = {
                    id: i + 1,
                    priority: 1,
                    action: {
                        type: 'redirect',
                        redirect: {
                            extensionPath: '/injected.js',
                            transform: {
                                queryTransform: {
                                    addOrReplaceParams: [
                                        {
                                            key: 'endpoint_id',
                                            value: endpoint.id
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    condition: {
                        urlFilter: this.convertToUrlFilter(endpoint.url),
                        resourceTypes: ['xmlhttprequest', 'fetch']
                    }
                };

                // Add method condition if not wildcard
                if (endpoint.method !== '*') {
                    rule.condition.requestMethods = [endpoint.method.toLowerCase()];
                }

                rules.push(rule);
            }

            if (rules.length > 0) {
                await chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: rules
                });
            }
        } catch (error) {
            console.error('Error updating declarative net request:', error);
        }
    }

    convertToUrlFilter(urlPattern) {
        // Convert wildcard pattern to regex-like pattern for declarativeNetRequest
        // This is a simplified conversion - in practice, you might need more sophisticated pattern matching
        return urlPattern.replace(/\*/g, '*');
    }

    async injectContentScript(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
        } catch (error) {
            // Ignore errors for chrome:// pages or other restricted pages
            console.log('Could not inject content script:', error.message);
        }
    }

    async showNotification(title, message) {
        if (this.settings.showNotifications) {
            try {
                await chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: title,
                    message: message
                });
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        }
    }
}

// Initialize background manager
const backgroundManager = new BackgroundManager();

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Set default settings
        await chrome.storage.local.set({
            endpoints: [],
            settings: {
                enableOverride: false,
                showNotifications: true,
                logRequests: false
            }
        });
        
        // Show welcome notification
        await backgroundManager.showNotification(
            'API Mock Master đã được cài đặt!',
            'Nhấn vào icon extension để bắt đầu cấu hình API endpoints.'
        );
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
    await backgroundManager.loadConfig();
    await backgroundManager.setupDeclarativeNetRequest();
});
