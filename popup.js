// Popup script for API Mock Master
class APIManager {
    constructor() {
        this.overrides = [];
        this.settings = {
            enableOverride: false,
            showNotifications: true,
            logRequests: false
        };
        this.currentOverrideId = null;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderOverrides();
        this.updateStatus();
    }

    async loadData() {
        try {
            const result = await chrome.storage.local.get(['overrides', 'settings']);
            this.overrides = result.overrides || [];
            this.settings = { ...this.settings, ...result.settings };
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async saveData() {
        try {
            await chrome.storage.local.set({
                overrides: this.overrides,
                settings: this.settings
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Settings
        document.getElementById('enable-override').addEventListener('change', (e) => {
            this.settings.enableOverride = e.target.checked;
            this.saveData();
            this.updateStatus();
            this.notifyBackground();
        });

        document.getElementById('show-notifications').addEventListener('change', (e) => {
            this.settings.showNotifications = e.target.checked;
            this.saveData();
        });

        document.getElementById('log-requests').addEventListener('change', (e) => {
            this.settings.logRequests = e.target.checked;
            this.saveData();
        });

        // Import/Export
        document.getElementById('export-config').addEventListener('click', () => {
            this.exportConfig();
        });

        document.getElementById('import-config').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importConfig(e.target.files[0]);
        });

        document.getElementById('clear-all').addEventListener('click', () => {
            this.clearAll();
        });

        // Override events
        this.setupOverrideEvents();

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('override-modal');
            if (e.target === modal) {
                this.closeOverrideModal();
            }
        });
    }

    setupOverrideEvents() {
        // Add override button
        document.getElementById('add-override').addEventListener('click', () => {
            this.openOverrideModal();
        });

        // Override type change
        document.getElementById('override-type').addEventListener('change', (e) => {
            this.toggleOverrideType(e.target.value);
        });

        // Override modal events
        document.getElementById('save-override').addEventListener('click', () => {
            this.saveOverride();
        });

        document.getElementById('cancel-override').addEventListener('click', () => {
            this.closeOverrideModal();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeOverrideModal();
        });
    }

    toggleOverrideType(type) {
        const customSection = document.getElementById('custom-response-section');
        const proxySection = document.getElementById('proxy-section');
        
        if (type === 'custom') {
            customSection.style.display = 'block';
            proxySection.style.display = 'none';
        } else {
            customSection.style.display = 'none';
            proxySection.style.display = 'block';
        }
    }

    openOverrideModal(override = null) {
        const modal = document.getElementById('override-modal');
        const form = document.getElementById('override-form');
        
        if (override) {
            this.currentOverrideId = override.id;
            document.getElementById('override-modal-title').textContent = 'Chỉnh sửa Override';
            document.getElementById('override-name').value = override.name;
            document.getElementById('override-url').value = override.url;
            document.getElementById('override-method').value = override.method;
            document.getElementById('override-type').value = override.type || 'custom';
            document.getElementById('override-delay').value = override.delay;
            document.getElementById('override-enabled').checked = override.enabled;
            
            // Toggle sections based on type
            this.toggleOverrideType(override.type || 'custom');
            
            if (override.type === 'custom') {
                document.getElementById('override-status').value = override.status;
                document.getElementById('override-headers').value = JSON.stringify(override.headers, null, 2);
                document.getElementById('override-body').value = override.body;
            } else {
                document.getElementById('override-target-url').value = override.targetUrl;
                document.getElementById('override-request-headers').value = JSON.stringify(override.requestHeaders, null, 2);
                document.getElementById('override-request-body').value = override.requestBody;
            }
        } else {
            this.currentOverrideId = null;
            document.getElementById('override-modal-title').textContent = 'Thêm API Override';
            form.reset();
            document.getElementById('override-delay').value = '0';
            document.getElementById('override-enabled').checked = true;
            document.getElementById('override-type').value = 'custom';
            this.toggleOverrideType('custom');
        }
        
        modal.style.display = 'block';
    }

    closeOverrideModal() {
        document.getElementById('override-modal').style.display = 'none';
        this.currentOverrideId = null;
    }

    async saveOverride() {
        const form = document.getElementById('override-form');
        const overrideType = document.getElementById('override-type').value;
        
        let override = {
            id: this.currentOverrideId || Date.now().toString(),
            name: document.getElementById('override-name').value,
            url: document.getElementById('override-url').value,
            method: document.getElementById('override-method').value,
            type: overrideType,
            delay: parseInt(document.getElementById('override-delay').value),
            enabled: document.getElementById('override-enabled').checked,
            createdAt: this.currentOverrideId ? 
                this.overrides.find(o => o.id === this.currentOverrideId)?.createdAt || Date.now() : 
                Date.now()
        };

        if (overrideType === 'custom') {
            // Custom Response
            try {
                const headers = JSON.parse(document.getElementById('override-headers').value || '{}');
                override.status = parseInt(document.getElementById('override-status').value);
                override.headers = headers;
                override.body = document.getElementById('override-body').value;
            } catch (error) {
                alert('Headers không hợp lệ. Vui lòng nhập JSON hợp lệ.');
                return;
            }
        } else {
            // Proxy to Localhost
            override.targetUrl = document.getElementById('override-target-url').value;
            
            try {
                override.requestHeaders = JSON.parse(document.getElementById('override-request-headers').value || '{}');
                override.requestBody = document.getElementById('override-request-body').value;
            } catch (error) {
                alert('Request Headers không hợp lệ. Vui lòng nhập JSON hợp lệ.');
                return;
            }
        }

        if (this.currentOverrideId) {
            const index = this.overrides.findIndex(o => o.id === this.currentOverrideId);
            this.overrides[index] = override;
        } else {
            this.overrides.push(override);
        }

        await this.saveData();
        this.renderOverrides();
        this.closeOverrideModal();
        this.notifyBackground();
    }

    renderOverrides() {
        const container = document.getElementById('overrides-list');
        
        if (this.overrides.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Chưa có override nào</h3>
                    <p>Nhấn "Thêm Override" để bắt đầu tạo API override</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.overrides.map(override => `
            <div class="override-item">
                <div class="override-header">
                    <span class="override-name">${override.name}</span>
                    <span class="override-status ${override.enabled ? 'enabled' : 'disabled'}">
                        ${override.enabled ? 'Đang hoạt động' : 'Tạm dừng'}
                    </span>
                </div>
                <div class="override-urls">
                    <div class="override-source">${override.url}</div>
                    <div class="override-arrow">↓</div>
                    <div class="override-target">
                        ${override.type === 'custom' ? 
                            `Custom Response (${override.status})` : 
                            override.targetUrl
                        }
                    </div>
                </div>
                <div>
                    <span class="override-method">${override.method}</span>
                    <span class="override-type ${override.type === 'custom' ? 'custom' : 'proxy'}">
                        ${override.type === 'custom' ? 'Custom' : 'Proxy'}
                    </span>
                    <span style="color: #64748b; font-size: 12px;">Delay: ${override.delay}ms</span>
                </div>
                <div class="override-actions">
                    <button class="btn btn-small btn-secondary" onclick="apiManager.editOverride('${override.id}')">
                        Chỉnh sửa
                    </button>
                    <button class="btn btn-small ${override.enabled ? 'btn-secondary' : 'btn-primary'}" 
                            onclick="apiManager.toggleOverride('${override.id}')">
                        ${override.enabled ? 'Tắt' : 'Bật'}
                    </button>
                    <button class="btn btn-small btn-danger" onclick="apiManager.deleteOverride('${override.id}')">
                        Xóa
                    </button>
                </div>
            </div>
        `).join('');
    }

    editOverride(id) {
        const override = this.overrides.find(o => o.id === id);
        if (override) {
            this.openOverrideModal(override);
        }
    }

    async toggleOverride(id) {
        const override = this.overrides.find(o => o.id === id);
        if (override) {
            override.enabled = !override.enabled;
            await this.saveData();
            this.renderOverrides();
            this.notifyBackground();
        }
    }

    async deleteOverride(id) {
        if (confirm('Bạn có chắc chắn muốn xóa override này?')) {
            this.overrides = this.overrides.filter(o => o.id !== id);
            await this.saveData();
            this.renderOverrides();
            this.notifyBackground();
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update settings checkboxes
        if (tabName === 'settings') {
            document.getElementById('enable-override').checked = this.settings.enableOverride;
            document.getElementById('show-notifications').checked = this.settings.showNotifications;
            document.getElementById('log-requests').checked = this.settings.logRequests;
        }
    }

    updateStatus() {
        const statusElement = document.getElementById('status');
        if (this.settings.enableOverride) {
            statusElement.textContent = 'Đang hoạt động';
            statusElement.className = 'status-active';
        } else {
            statusElement.textContent = 'Tắt';
            statusElement.className = 'status-inactive';
        }
    }

    async notifyBackground() {
        try {
            await chrome.runtime.sendMessage({
                type: 'UPDATE_CONFIG',
                overrides: this.overrides,
                settings: this.settings
            });
        } catch (error) {
            console.error('Error notifying background:', error);
        }
    }

    exportConfig() {
        const config = {
            overrides: this.overrides,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `api-override-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importConfig(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const config = JSON.parse(text);
            
            if (config.overrides && config.settings) {
                this.overrides = config.overrides;
                this.settings = config.settings;
                await this.saveData();
                this.renderOverrides();
                this.updateStatus();
                this.notifyBackground();
                alert('Cấu hình đã được nhập thành công!');
            } else {
                alert('File cấu hình không hợp lệ!');
            }
        } catch (error) {
            alert('Lỗi khi đọc file cấu hình: ' + error.message);
        }
    }

    async clearAll() {
        if (confirm('Bạn có chắc chắn muốn xóa tất cả cấu hình? Hành động này không thể hoàn tác!')) {
            this.overrides = [];
            this.settings = {
                enableOverride: false,
                showNotifications: true,
                logRequests: false
            };
            await this.saveData();
            this.renderOverrides();
            this.updateStatus();
            this.notifyBackground();
        }
    }
}

// Initialize the API Manager
const apiManager = new APIManager();