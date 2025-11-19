/**
 * Script để kiểm tra Google Maps API Key configuration
 * Chạy: node check-map-api.js
 */

const https = require('https');

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyA7gWv2sQWonQMvSsWIOB00Sxcxgrf5lx0';

console.log('🔍 Đang kiểm tra Google Maps API Key...\n');
console.log(`API Key: ${API_KEY.substring(0, 20)}...\n`);

// Test Maps JavaScript API
function testMapsAPI() {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=test`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          if (data.includes('refererNotAllowedMapError') || data.includes('RefererNotAllowed')) {
            resolve({ success: false, error: 'RefererNotAllowed - Cần thêm localhost vào Application restrictions' });
          } else if (data.includes('invalidKeyMapError') || data.includes('InvalidKey')) {
            resolve({ success: false, error: 'InvalidKey - API Key không hợp lệ' });
          } else if (data.includes('apiNotActivatedMapError')) {
            resolve({ success: false, error: 'ApiNotActivated - Maps JavaScript API chưa được enable' });
          } else {
            resolve({ success: true, message: 'API Key hợp lệ' });
          }
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.substring(0, 100)}` });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Test Places API
function testPlacesAPI() {
  return new Promise((resolve, reject) => {
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Vietnam&inputtype=textquery&key=${API_KEY}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'OK' || json.status === 'ZERO_RESULTS') {
            resolve({ success: true, message: 'Places API hoạt động bình thường' });
          } else if (json.status === 'REQUEST_DENIED') {
            resolve({ success: false, error: 'REQUEST_DENIED - Places API chưa được enable hoặc bị restrict' });
          } else if (json.status === 'INVALID_REQUEST') {
            resolve({ success: false, error: 'INVALID_REQUEST - API Key hoặc request không hợp lệ' });
          } else {
            resolve({ success: false, error: `Places API error: ${json.status} - ${json.error_message || ''}` });
          }
        } catch (e) {
          resolve({ success: false, error: `Parse error: ${e.message}` });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runChecks() {
  console.log('📊 Kiểm tra Maps JavaScript API...');
  const mapsResult = await testMapsAPI();
  if (mapsResult.success) {
    console.log('✅', mapsResult.message);
  } else {
    console.log('❌', mapsResult.error);
  }
  
  console.log('\n📊 Kiểm tra Places API...');
  const placesResult = await testPlacesAPI();
  if (placesResult.success) {
    console.log('✅', placesResult.message);
  } else {
    console.log('❌', placesResult.error);
  }
  
  console.log('\n📋 Tóm tắt:');
  console.log('- Nếu thấy "For development purposes only": Cần thêm Billing account');
  console.log('- Nếu thấy "RefererNotAllowed": Thêm localhost vào Application restrictions');
  console.log('- Nếu thấy "REQUEST_DENIED": Enable Places API và kiểm tra API restrictions');
  console.log('\n📖 Xem hướng dẫn chi tiết: FIX_MAP_DEVELOPMENT_WATERMARK.md');
}

runChecks().catch(console.error);

