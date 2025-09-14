# 🎭 API Mock Master

Professional Chrome Extension to redirect APIs from different domains to localhost and override APIs with custom responses.

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Proxy & Redirect](#-api-proxy--redirect)
- [Debug & Monitoring](#-debug--monitoring)
- [Troubleshooting](#-troubleshooting)
- [File Structure](#-file-structure)

## ✨ Features

- ✅ **API Proxy & Redirect**: Redirect APIs from different domains to localhost
- ✅ **Custom Request Parameters**: Customize headers, body, query params
- ✅ **Custom Response**: Transform responses from localhost
- ✅ **Override Existing APIs**: Override APIs with custom responses
- ✅ **Support All HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- ✅ **Request/Response Transform**: JavaScript functions to transform data
- ✅ **Delay Response**: Add delays to test loading states
- ✅ **Wildcard URL Matching**: Support pattern matching with `*`
- ✅ **Import/Export Configuration**: Share and backup configurations
- ✅ **Logging**: Log proxied requests
- ✅ **User-Friendly Interface**: Beautiful and easy-to-use UI

## 🚀 Installation

### Method 1: Install from Chrome Web Store (Recommended)

1. Visit [Chrome Web Store](https://chrome.google.com/webstore) 
2. Search for "API Mock Master"
3. Click "Add to Chrome"
4. Confirm installation

### Method 2: Manual Installation (Developer Mode)

#### Step 1: Download Extension
- **From GitHub**: Download `api-mock-master-extension.zip` from [Releases](https://github.com/your-username/api-mock-master/releases)
- **From Source**: Clone this repository

#### Step 2: Install Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** in the top right corner
3. Click **"Load unpacked"**
4. Select the `API Mock Master` folder (folder containing this extension)
5. Extension will appear in toolbar with 🎭 icon

> 📋 **Detailed Instructions**: See [INSTALL.md](INSTALL.md)

### Step 3: Create Extension Icons (Optional)

1. Open `create_icons.html` in browser
2. Icons will be automatically downloaded
3. Copy `icon16.png`, `icon48.png`, `icon128.png` files to `icons/` folder

### Step 4: Usage

1. Click the extension icon in toolbar
2. Switch to **"Settings"** tab
3. Enable **"Enable API Override"**
4. Switch to **"API Proxy"** tab
5. Click **"+ Add Proxy"** to get started

## 🛠️ Usage

### 1. Add Proxy

1. Click **"+ Add Proxy"**
2. Fill in the information:
   - **Proxy Name**: Descriptive name for the proxy
   - **Source URL**: Original URL you want to redirect (e.g., `https://api.example.com/users`)
   - **Target URL**: Target localhost URL (e.g., `http://localhost:3000/users`)
   - **HTTP Method**: Select method or "All"
   - **Custom Headers**: JSON object containing custom headers
   - **Request Transform**: JavaScript function to transform request
   - **Response Transform**: JavaScript function to transform response
   - **Delay**: Delay time (ms)
   - **Enable**: Turn proxy on/off

### 2. Configuration Examples

#### Basic Proxy:
```json
{
  "name": "Users API Proxy",
  "sourceUrl": "https://api.example.com/users",
  "targetUrl": "http://localhost:3000/users",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer your-token"
  },
  "delay": 0
}
```

#### Proxy with Transform:
```json
{
  "name": "Data Transform Proxy",
  "sourceUrl": "https://api.example.com/data",
  "targetUrl": "http://localhost:3000/data",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "requestTransform": "function transformRequest(data) { data.headers['X-Source'] = 'extension'; return data; }",
  "responseTransform": "function transformResponse(data) { const json = JSON.parse(data.body); json.proxyInfo = { timestamp: Date.now() }; data.body = JSON.stringify(json); return data; }",
  "delay": 100
}
```

### 3. Settings

- **Enable API Override**: Enable/disable entire proxy functionality
- **Show Notifications**: Notify when API is proxied
- **Logging**: Log requests in console

### 4. Import/Export

- **Export Configuration**: Save all proxies and settings to JSON file
- **Import Configuration**: Load configuration from JSON file
- **Clear All**: Reset to initial state

## 🔄 API Proxy & Redirect

### Use Cases

#### Real-world Example:
- **Production API**: `https://api.example.com/users`
- **Local API**: `http://localhost:3000/users`
- **Result**: When app calls api.example.com → automatically redirects to localhost:3000

### 🚀 How to Use Proxy

#### Step 1: Create Proxy
1. Open **API Mock Master** extension
2. Switch to **"API Proxy"** tab
3. Click **"+ Add Proxy"**

#### Step 2: Configure Proxy
```
Proxy Name: Users API Proxy
Source URL: https://api.example.com/users
Target URL: http://localhost:3000/users
Method: GET
Headers: {"Authorization": "Bearer your-token"}
Delay: 0ms
```

#### Step 3: Activate
1. Enable **"Enable this proxy"**
2. Click **"Save"**
3. Enable **"Enable API Override"** in Settings

### 🛠️ Advanced Proxy Features

#### 1. Custom Headers
Add custom headers for requests to target URL:
```json
{
  "Authorization": "Bearer your-token",
  "Content-Type": "application/json",
  "X-Custom-Header": "value"
}
```

#### 2. Request Transform
Transform request data before sending to target:
```javascript
function transformRequest(data) {
    // data.url, data.method, data.headers, data.body
    data.headers['X-User-ID'] = '123';
    data.body = JSON.stringify({...JSON.parse(data.body), userId: 123});
    return data;
}
```

#### 3. Response Transform
Transform response before returning:
```javascript
function transformResponse(data) {
    // data.status, data.headers, data.body
    const response = JSON.parse(data.body);
    response.timestamp = new Date().toISOString();
    data.body = JSON.stringify(response);
    return data;
}
```

### 📋 Real-world Proxy Examples

#### Example 1: Basic Proxy
```
Name: Basic User API
Source: https://api.example.com/users
Target: http://localhost:3000/users
Method: GET
Headers: {}
```

#### Example 2: Auth Proxy
```
Name: Auth API Proxy
Source: https://api.example.com/auth/login
Target: http://localhost:3000/auth/login
Method: POST
Headers: {"Content-Type": "application/json"}
```

#### Example 3: Complex Transform
```
Name: Data Transform Proxy
Source: https://api.example.com/data
Target: http://localhost:3000/data

Request Transform:
function transformRequest(data) {
    data.headers['X-Source'] = 'extension';
    return data;
}

Response Transform:
function transformResponse(data) {
    const json = JSON.parse(data.body);
    json.proxyInfo = { timestamp: Date.now() };
    data.body = JSON.stringify(json);
    return data;
}
```

### 🔧 Development Workflow

#### 1. Setup Local Server
```bash
# Start your local API server
npm start
# Server running on http://localhost:3000
```

#### 2. Configure Proxy
- Create proxy for each API endpoint
- Test with Postman or browser
- Adjust transform functions if needed

#### 3. Development
- App still calls production URLs
- Extension automatically redirects to localhost
- Change local code → test immediately

#### 4. Production
- Disable extension or disable proxies
- App calls production APIs normally

## 🔍 Debug & Monitoring

### Console API
Extension provides debugging API in console:

```javascript
// View all proxies
window.apiOverride.getProxies()

// Test proxy for a URL
window.apiOverride.testProxy('https://api.example.com/users', 'GET')
```

### Network Monitoring
- Requests will show with source URL
- Response will be data from target URL
- Headers will be merged and transformed

## 🚨 Troubleshooting

### Extension not working:
1. Check if extension is enabled
2. Check "Enable API Override" in settings
3. Refresh webpage after changing configuration
4. Check console for errors

### Proxy not working:
1. Check if local server is running
2. Check CORS settings on local server
3. Check if transform functions have errors
4. Check network tab to see request flow

### CORS Issues:
- Local server needs to enable CORS
- Or use proxy to bypass CORS

### HTTPS vs HTTP:
- Source URL can be HTTPS
- Target URL is usually HTTP (localhost)
- Extension will handle this

## 📁 File Structure

```
├── manifest.json          # Extension manifest
├── popup.html            # Popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── background.js         # Background service worker
├── content.js            # Content script
├── injected.js           # Injected script
├── demo.html             # Demo page for testing
├── icons/                # Extension icons
├── package.json          # Package configuration
└── README.md             # This documentation
```

## 💡 Tips & Best Practices

### 1. Naming Convention:
- Use clear proxy names: "Users API Proxy"
- Group by feature: "Auth Proxy", "Data Proxy"

### 2. Transform Functions:
- Always validate input data
- Handle errors gracefully
- Test transform functions before saving

### 3. Headers Management:
- Don't hardcode sensitive data
- Use environment variables
- Rotate tokens when needed

### 4. Performance:
- Set appropriate delay (0-100ms)
- Monitor proxy performance
- Disable unused proxies

### 5. Development Workflow:
1. **Create proxy** → Configure → **Save**
2. **Test immediately** on webpage
3. **Adjust** transform functions if needed
4. **Export config** to share

## 🎯 Use Cases

### 1. Frontend Development:
- Redirect production APIs to localhost
- Test with local data
- Develop offline

### 2. API Testing:
- Test with different environments
- A/B testing APIs
- Load testing with local server

### 3. Integration Testing:
- Test integration with local services
- Mock external APIs
- Test error scenarios

### 4. Development with Production APIs:
- Redirect production APIs to localhost
- Test with local changes
- Develop without changing code

## 📝 Notes

- Extension only works on regular web pages (not chrome://)
- Need to refresh webpage after changing configuration
- URL pattern supports wildcard `*` and basic regex
- Transform functions must be valid JavaScript

## 📄 License

MIT License - Free to use for personal and commercial purposes.

---

With **API Mock Master**, you can redirect production APIs to localhost for development without changing code! 🎭✨