# 🎭 API Mock Master

Professional Chrome Extension để redirect API từ domain khác về localhost và override API với response tùy chỉnh.

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Cài đặt](#-cài-đặt)
- [Sử dụng](#-sử-dụng)
- [API Proxy & Redirect](#-api-proxy--redirect)
- [Debug & Monitoring](#-debug--monitoring)
- [Troubleshooting](#-troubleshooting)
- [Cấu trúc file](#-cấu-trúc-file)

## ✨ Tính năng

- ✅ **API Proxy & Redirect**: Chuyển hướng API từ domain khác về localhost
- ✅ **Custom Request Parameters**: Tùy chỉnh headers, body, query params
- ✅ **Custom Response**: Transform response từ localhost
- ✅ **Override API hiện có**: Ghi đè API với response tùy chỉnh
- ✅ **Hỗ trợ tất cả HTTP methods**: GET, POST, PUT, DELETE, PATCH
- ✅ **Request/Response Transform**: JavaScript functions để transform dữ liệu
- ✅ **Delay response**: Thêm độ trễ để test loading states
- ✅ **Wildcard URL matching**: Hỗ trợ pattern matching với `*`
- ✅ **Import/Export cấu hình**: Chia sẻ và backup cấu hình
- ✅ **Logging**: Ghi log các request được proxy
- ✅ **Giao diện thân thiện**: UI đẹp và dễ sử dụng

## 🚀 Cài đặt

### Bước 1: Cài đặt Extension

1. Mở Chrome và vào `chrome://extensions/`
2. Bật **"Developer mode"** ở góc trên bên phải
3. Nhấn **"Load unpacked"**
4. Chọn thư mục `API Mock Master` (thư mục chứa extension này)
5. Extension sẽ xuất hiện trong toolbar với icon 🎭

### Bước 2: Tạo icon cho extension (tùy chọn)

1. Mở file `create_icons.html` trong browser
2. Các icon sẽ được tự động download
3. Copy các file `icon16.png`, `icon48.png`, `icon128.png` vào thư mục `icons/`

### Bước 3: Sử dụng

1. Nhấn vào icon extension trong toolbar
2. Chuyển sang tab **"Cài đặt"**
3. Bật **"Bật ghi đè API"**
4. Chuyển sang tab **"API Proxy"**
5. Nhấn **"+ Thêm Proxy"** để bắt đầu

## 🛠️ Sử dụng

### 1. Thêm Proxy

1. Nhấn **"+ Thêm Proxy"**
2. Điền thông tin:
   - **Tên Proxy**: Tên mô tả cho proxy
   - **Source URL**: URL gốc mà bạn muốn redirect (ví dụ: `https://nghiapd.com/api/list_user`)
   - **Target URL**: URL localhost đích (ví dụ: `http://localhost:3000/api/list_user`)
   - **HTTP Method**: Chọn method hoặc "Tất cả"
   - **Custom Headers**: JSON object chứa headers tùy chỉnh
   - **Request Transform**: JavaScript function để transform request
   - **Response Transform**: JavaScript function để transform response
   - **Delay**: Thời gian trễ (ms)
   - **Kích hoạt**: Bật/tắt proxy

### 2. Ví dụ cấu hình

#### Basic Proxy:
```json
{
  "name": "Users API Proxy",
  "sourceUrl": "https://nghiapd.com/api/list_user",
  "targetUrl": "http://localhost:3000/api/list_user",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer your-token"
  },
  "delay": 0
}
```

#### Proxy với Transform:
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

### 3. Cài đặt

- **Bật ghi đè API**: Kích hoạt/tắt toàn bộ chức năng proxy
- **Hiển thị thông báo**: Thông báo khi API được proxy
- **Ghi log**: Ghi log các request trong console

### 4. Import/Export

- **Xuất cấu hình**: Lưu tất cả proxies và settings ra file JSON
- **Nhập cấu hình**: Load cấu hình từ file JSON
- **Xóa tất cả**: Reset về trạng thái ban đầu

## 🔄 API Proxy & Redirect

### Mục đích sử dụng

#### Ví dụ thực tế:
- **Production API**: `https://nghiapd.com/api/list_user`
- **Local API**: `http://localhost:3000/api/list_user`
- **Kết quả**: Khi app gọi nghiapd.com → tự động redirect về localhost:3000

### 🚀 Cách sử dụng Proxy

#### Bước 1: Tạo Proxy
1. Mở extension **API Mock Master**
2. Chuyển sang tab **"API Proxy"**
3. Nhấn **"+ Thêm Proxy"**

#### Bước 2: Cấu hình Proxy
```
Tên Proxy: Users API Proxy
Source URL: https://nghiapd.com/api/list_user
Target URL: http://localhost:3000/api/list_user
Method: GET
Headers: {"Authorization": "Bearer your-token"}
Delay: 0ms
```

#### Bước 3: Kích hoạt
1. Bật **"Kích hoạt proxy này"**
2. Nhấn **"Lưu"**
3. Bật **"Bật ghi đè API"** trong Settings

### 🛠️ Tính năng nâng cao Proxy

#### 1. Custom Headers
Thêm headers tùy chỉnh cho request tới target URL:
```json
{
  "Authorization": "Bearer your-token",
  "Content-Type": "application/json",
  "X-Custom-Header": "value"
}
```

#### 2. Request Transform
Transform dữ liệu request trước khi gửi tới target:
```javascript
function transformRequest(data) {
    // data.url, data.method, data.headers, data.body
    data.headers['X-User-ID'] = '123';
    data.body = JSON.stringify({...JSON.parse(data.body), userId: 123});
    return data;
}
```

#### 3. Response Transform
Transform response trước khi trả về:
```javascript
function transformResponse(data) {
    // data.status, data.headers, data.body
    const response = JSON.parse(data.body);
    response.timestamp = new Date().toISOString();
    data.body = JSON.stringify(response);
    return data;
}
```

### 📋 Ví dụ Proxy thực tế

#### Ví dụ 1: Basic Proxy
```
Tên: Basic User API
Source: https://api.example.com/users
Target: http://localhost:3000/users
Method: GET
Headers: {}
```

#### Ví dụ 2: Auth Proxy
```
Tên: Auth API Proxy
Source: https://api.example.com/auth/login
Target: http://localhost:3000/auth/login
Method: POST
Headers: {"Content-Type": "application/json"}
```

#### Ví dụ 3: Complex Transform
```
Tên: Data Transform Proxy
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

### 🔧 Workflow Development

#### 1. Setup Local Server
```bash
# Start your local API server
npm start
# Server running on http://localhost:3000
```

#### 2. Configure Proxy
- Tạo proxy cho từng API endpoint
- Test với Postman hoặc browser
- Điều chỉnh transform functions nếu cần

#### 3. Development
- App vẫn gọi production URLs
- Extension tự động redirect về localhost
- Thay đổi local code → test ngay

#### 4. Production
- Tắt extension hoặc disable proxies
- App gọi production APIs bình thường

## 🔍 Debug & Monitoring

### Console API
Extension cung cấp API debugging trong console:

```javascript
// Xem tất cả proxies
window.apiOverride.getProxies()

// Test proxy cho một URL
window.apiOverride.testProxy('https://api.example.com/users', 'GET')
```

### Network Monitoring
- Request sẽ hiển thị với source URL
- Response sẽ là data từ target URL
- Headers sẽ được merge và transform

## 🚨 Troubleshooting

### Extension không hoạt động:
1. Kiểm tra extension đã được enable
2. Kiểm tra "Bật ghi đè API" trong settings
3. Refresh trang web sau khi thay đổi cấu hình
4. Kiểm tra console để xem lỗi

### Proxy không hoạt động:
1. Kiểm tra local server có đang chạy không
2. Kiểm tra CORS settings trên local server
3. Kiểm tra transform functions có lỗi không
4. Kiểm tra network tab để xem request flow

### CORS Issues:
- Local server cần enable CORS
- Hoặc dùng proxy để bypass CORS

### HTTPS vs HTTP:
- Source URL có thể là HTTPS
- Target URL thường là HTTP (localhost)
- Extension sẽ handle việc này

## 📁 Cấu trúc file

```
├── manifest.json          # Extension manifest
├── popup.html            # Popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── background.js         # Background service worker
├── content.js            # Content script
├── injected.js           # Injected script
├── demo.html             # Demo page để test
├── icons/                # Extension icons
├── package.json          # Package configuration
└── README.md             # Documentation này
```

## 💡 Tips & Best Practices

### 1. Naming Convention:
- Đặt tên proxy rõ ràng: "Users API Proxy"
- Group theo feature: "Auth Proxy", "Data Proxy"

### 2. Transform Functions:
- Luôn validate input data
- Handle errors gracefully
- Test transform functions trước khi save

### 3. Headers Management:
- Không hardcode sensitive data
- Sử dụng environment variables
- Rotate tokens khi cần

### 4. Performance:
- Set delay phù hợp (0-100ms)
- Monitor proxy performance
- Disable unused proxies

### 5. Development Workflow:
1. **Tạo proxy** → Cấu hình → **Save**
2. **Test ngay** trên trang web
3. **Điều chỉnh** transform functions nếu cần
4. **Export config** để chia sẻ

## 🎯 Use Cases

### 1. Frontend Development:
- Redirect production APIs về localhost
- Test với local data
- Develop offline

### 2. API Testing:
- Test với different environments
- A/B testing APIs
- Load testing với local server

### 3. Integration Testing:
- Test integration với local services
- Mock external APIs
- Test error scenarios

### 4. Development với Production APIs:
- Redirect production APIs về localhost
- Test với local changes
- Develop mà không cần thay đổi code

## 📝 Lưu ý

- Extension chỉ hoạt động trên các trang web thông thường (không phải chrome://)
- Cần refresh trang web sau khi thay đổi cấu hình
- URL pattern hỗ trợ wildcard `*` và regex cơ bản
- Transform functions phải là JavaScript hợp lệ

## 📄 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.

---

Với **API Mock Master**, bạn có thể redirect production APIs về localhost để development mà không cần thay đổi code! 🎭✨