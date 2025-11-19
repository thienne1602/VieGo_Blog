"""
Maps and Locations Routes for VieGo Blog
Handles location management and map-related features
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, desc, func
from datetime import datetime
import json

from models import db
from models.user import User
from models.location import Location

maps_bp = Blueprint('maps', __name__, url_prefix='/api/maps')

@maps_bp.route('/locations', methods=['GET'])
def get_locations():
    """Get all locations with filtering"""
    try:
        # Query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        category = request.args.get('category')
        search = request.args.get('search')
        city = request.args.get('city')
        province = request.args.get('province')
        min_rating = request.args.get('min_rating', type=float)
        
        # Bounding box for map viewport
        sw_lat = request.args.get('sw_lat', type=float)
        sw_lng = request.args.get('sw_lng', type=float)
        ne_lat = request.args.get('ne_lat', type=float)
        ne_lng = request.args.get('ne_lng', type=float)
        
        # Base query
        query = Location.query
        
        # Apply filters
        if category:
            query = query.filter_by(category=category)
        
        if city:
            query = query.filter_by(city=city)
        
        if province:
            query = query.filter_by(province=province)
        
        if min_rating is not None:
            query = query.filter(Location.rating >= min_rating)
        
        if search:
            search_filter = or_(
                Location.name.contains(search),
                Location.description.contains(search),
                Location.address.contains(search)
            )
            query = query.filter(search_filter)
        
        # Bounding box filter for map viewport
        if all([sw_lat, sw_lng, ne_lat, ne_lng]):
            query = query.filter(
                Location.latitude.between(sw_lat, ne_lat),
                Location.longitude.between(sw_lng, ne_lng)
            )
        
        # Order by rating (handle NULL values - MySQL compatible)
        query = query.order_by(desc(func.coalesce(Location.rating, 0)))
        
        # Paginate
        locations_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format response
        locations_data = [loc.to_dict() for loc in locations_pagination.items]
        
        return jsonify({
            'locations': locations_data,
            'pagination': {
                'page': locations_pagination.page,
                'pages': locations_pagination.pages,
                'per_page': locations_pagination.per_page,
                'total': locations_pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách địa điểm: {str(e)}'}), 500

@maps_bp.route('/locations/<int:location_id>', methods=['GET'])
def get_location(location_id):
    """Get single location by ID"""
    try:
        location = Location.query.get_or_404(location_id)
        
        # Increment view count
        location.increment_views()
        db.session.commit()
        
        return jsonify(location.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin địa điểm: {str(e)}'}), 500

@maps_bp.route('/locations', methods=['POST'])
@jwt_required()
def create_location():
    """Create a new location"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        data = request.get_json()
        
        # Required fields
        required_fields = ['name', 'latitude', 'longitude', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Thiếu trường bắt buộc: {field}'}), 400
        
        # Create new location
        location = Location(
            name=data['name'],
            latitude=data['latitude'],
            longitude=data['longitude'],
            category=data['category']
        )
        
        location.created_by = current_user_id
        
        # Set optional fields
        optional_fields = [
            'description', 'address', 'city', 'province', 'country',
            'subcategory', 'phone', 'website', 'email', 'opening_hours',
            'price_range', 'image_url'
        ]
        
        for field in optional_fields:
            if field in data:
                setattr(location, field, data[field])
        
        # Set JSON fields
        if 'amenities' in data:
            location.set_amenities(data['amenities'])
        
        if 'tags' in data:
            location.set_tags(data['tags'])
        
        if 'social_links' in data:
            location.set_social_links(data['social_links'])
        
        if 'gallery_images' in data:
            location.set_gallery_images(data['gallery_images'])
        
        db.session.add(location)
        db.session.commit()
        
        # Award points for adding location
        user.add_points(25)
        db.session.commit()
        
        return jsonify({
            'message': 'Thêm địa điểm thành công!',
            'location': location.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi thêm địa điểm: {str(e)}'}), 500

@maps_bp.route('/locations/<int:location_id>', methods=['PUT'])
@jwt_required()
def update_location(location_id):
    """Update location"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        location = Location.query.get_or_404(location_id)
        
        # Check permissions (owner or admin/moderator)
        if location.created_by != current_user_id and user.role not in ['admin', 'moderator']:
            return jsonify({'error': 'Bạn không có quyền chỉnh sửa địa điểm này'}), 403
        
        data = request.get_json()
        
        # Update fields
        updateable_fields = [
            'name', 'description', 'latitude', 'longitude', 'address',
            'city', 'province', 'country', 'category', 'subcategory',
            'phone', 'website', 'email', 'opening_hours', 'price_range',
            'image_url', 'verified'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(location, field, data[field])
        
        # Update JSON fields
        if 'amenities' in data:
            location.set_amenities(data['amenities'])
        
        if 'tags' in data:
            location.set_tags(data['tags'])
        
        if 'social_links' in data:
            location.set_social_links(data['social_links'])
        
        if 'gallery_images' in data:
            location.set_gallery_images(data['gallery_images'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cập nhật địa điểm thành công!',
            'location': location.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật địa điểm: {str(e)}'}), 500

@maps_bp.route('/locations/<int:location_id>', methods=['DELETE'])
@jwt_required()
def delete_location(location_id):
    """Delete location (admin/moderator only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        location = Location.query.get_or_404(location_id)
        
        # Only admin/moderator can delete
        if user.role not in ['admin', 'moderator']:
            return jsonify({'error': 'Bạn không có quyền xóa địa điểm'}), 403
        
        db.session.delete(location)
        db.session.commit()
        
        return jsonify({'message': 'Đã xóa địa điểm thành công!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa địa điểm: {str(e)}'}), 500

@maps_bp.route('/locations/<int:location_id>/rate', methods=['POST'])
@jwt_required()
def rate_location(location_id):
    """Rate a location"""
    try:
        current_user_id = get_jwt_identity()
        location = Location.query.get_or_404(location_id)
        
        data = request.get_json()
        rating = data.get('rating')
        
        if not rating or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating phải từ 1 đến 5'}), 400
        
        # Here you would store individual ratings in a separate table
        # For now, just update the average rating
        
        # Simple averaging (in production, use proper rating table)
        current_total = location.rating * location.reviews_count
        new_total = current_total + rating
        location.reviews_count += 1
        location.rating = new_total / location.reviews_count
        
        db.session.commit()
        
        return jsonify({
            'message': 'Đánh giá thành công!',
            'location': location.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi đánh giá: {str(e)}'}), 500

@maps_bp.route('/nearby', methods=['GET'])
def get_nearby_locations():
    """Get locations near a specific point"""
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', 10, type=float)  # km
        category = request.args.get('category')
        limit = min(request.args.get('limit', 20, type=int), 50)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Thiếu tọa độ (lat, lng)'}), 400
        
        # Simple distance calculation using Haversine formula
        # Note: For production, consider using PostGIS or similar
        query = Location.query
        
        if category:
            query = query.filter_by(category=category)
        
        locations = query.all()
        
        # Calculate distance and filter
        nearby = []
        for loc in locations:
            distance = calculate_distance(lat, lng, loc.latitude, loc.longitude)
            if distance <= radius:
                loc_dict = loc.to_dict()
                loc_dict['distance'] = round(distance, 2)
                nearby.append(loc_dict)
        
        # Sort by distance
        nearby.sort(key=lambda x: x['distance'])
        
        return jsonify({
            'locations': nearby[:limit],
            'count': len(nearby)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi tìm địa điểm gần: {str(e)}'}), 500

@maps_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get available location categories"""
    return jsonify({
        'categories': [
            {'value': 'restaurant', 'label': 'Nhà hàng'},
            {'value': 'attraction', 'label': 'Điểm tham quan'},
            {'value': 'hotel', 'label': 'Khách sạn'},
            {'value': 'transport', 'label': 'Giao thông'},
            {'value': 'shopping', 'label': 'Mua sắm'},
            {'value': 'entertainment', 'label': 'Giải trí'}
        ]
    }), 200

@maps_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get map statistics"""
    try:
        total_locations = Location.query.count()
        
        # Count by category
        by_category = db.session.query(
            Location.category,
            func.count(Location.id)
        ).group_by(Location.category).all()
        
        # Count by province
        by_province = db.session.query(
            Location.province,
            func.count(Location.id)
        ).group_by(Location.province).order_by(desc(func.count(Location.id))).limit(10).all()
        
        return jsonify({
            'total_locations': total_locations,
            'by_category': [{'category': cat, 'count': count} for cat, count in by_category],
            'top_provinces': [{'province': prov, 'count': count} for prov, count in by_province]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thống kê: {str(e)}'}), 500

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

@maps_bp.route('/routes', methods=['GET'])
def get_routes():
    """Get travel routes (public or user's routes)"""
    try:
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)
        user_id = request.args.get('user_id', type=int)
        
        # In a full implementation, you would have a TravelRoute model
        # For now, return empty list or stored routes
        return jsonify({
            'routes': [],
            'pagination': {
                'page': page,
                'pages': 0,
                'per_page': per_page,
                'total': 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy lộ trình: {str(e)}'}), 500

@maps_bp.route('/routes', methods=['POST'])
@jwt_required()
def create_route():
    """Create a new travel route"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('name') or not data.get('waypoints') or len(data.get('waypoints', [])) < 2:
            return jsonify({'error': 'Lộ trình cần có ít nhất 2 điểm'}), 400
        
        # In a full implementation, save to database
        route_data = {
            'id': f"route_{datetime.now().timestamp()}",
            'name': data['name'],
            'waypoints': data['waypoints'],
            'color': data.get('color', '#3b82f6'),
            'description': data.get('description', ''),
            'created_at': datetime.now().isoformat(),
            'created_by': current_user_id
        }
        
        return jsonify({
            'message': 'Tạo lộ trình thành công!',
            'route': route_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Lỗi tạo lộ trình: {str(e)}'}), 500

@maps_bp.route('/weather', methods=['GET'])
def get_weather():
    """Get weather forecast for a location using Google Geocoding + WeatherAPI.com"""
    try:
        import os
        import requests
        
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Thiếu tọa độ (lat, lng)'}), 400
        
        # Get Google Maps API key for geocoding
        google_api_key = os.getenv('GOOGLE_MAPS_API_KEY', '')
        weather_api_key = os.getenv('WEATHER_API_KEY', '')
        
        # Use Google Geocoding API to get location name
        location_name = ''
        if google_api_key:
            try:
                geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={google_api_key}&language=vi"
                geocode_response = requests.get(geocode_url, timeout=5)
                if geocode_response.status_code == 200:
                    geocode_data = geocode_response.json()
                    if geocode_data.get('results'):
                        location_name = geocode_data['results'][0].get('formatted_address', '')
            except:
                pass
        
        if not weather_api_key:
            # Return mock data if API key not configured
            return jsonify({
                'location': {'lat': lat, 'lng': lng, 'name': location_name or 'Chưa xác định'},
                'current': {
                    'temp': 28,
                    'feels_like': 30,
                    'humidity': 75,
                    'pressure': 1013,
                    'wind_speed': 5,
                    'wind_deg': 180,
                    'weather': [{
                        'main': 'Clear',
                        'description': 'trời quang',
                        'icon': '01d'
                    }],
                    'visibility': 10,
                    'clouds': 20,
                    'uv_index': 7
                },
                'forecast': [],
                'alerts': [],
                'warning': 'WEATHER_API_KEY chưa được cấu hình. Đang hiển thị dữ liệu mẫu. Lấy key miễn phí tại: https://www.weatherapi.com/'
            }), 200
        
        # Use WeatherAPI.com (free tier - 1 million calls/month)
        # Get current weather and forecast
        current_url = f"http://api.weatherapi.com/v1/current.json?key={weather_api_key}&q={lat},{lng}&lang=vi"
        forecast_url = f"http://api.weatherapi.com/v1/forecast.json?key={weather_api_key}&q={lat},{lng}&days=1&lang=vi&hour=24"
        
        current_response = requests.get(current_url, timeout=5)
        forecast_response = requests.get(forecast_url, timeout=5)
        
        if current_response.status_code != 200:
            error_data = current_response.json() if current_response.content else {}
            error_msg = error_data.get('error', {}).get('message', 'Không thể lấy dữ liệu thời tiết')
            return jsonify({'error': error_msg}), 500
        
        current_data = current_response.json()
        forecast_data = forecast_response.json() if forecast_response.status_code == 200 else None
        
        # Format response to match existing frontend format
        current_weather = current_data.get('current', {})
        location_info = current_data.get('location', {})
        
        weather_data = {
            'location': {
                'lat': lat,
                'lng': lng,
                'name': location_name or location_info.get('name', location_info.get('region', 'Chưa xác định'))
            },
            'current': {
                'temp': round(current_weather.get('temp_c', 0), 1),
                'feels_like': round(current_weather.get('feelslike_c', 0), 1),
                'humidity': current_weather.get('humidity', 0),
                'pressure': current_weather.get('pressure_mb', 0),
                'wind_speed': round(current_weather.get('wind_kph', 0), 1),  # Already in km/h
                'wind_deg': current_weather.get('wind_degree', 0),
                'weather': [{
                    'main': current_weather.get('condition', {}).get('text', ''),
                    'description': current_weather.get('condition', {}).get('text', ''),
                    'icon': current_weather.get('condition', {}).get('icon', '').replace('//cdn.weatherapi.com', 'https://cdn.weatherapi.com')
                }],
                'visibility': round(current_weather.get('vis_km', 0), 1),
                'clouds': current_weather.get('cloud', 0),
                'uv_index': current_weather.get('uv', 0)
            },
            'forecast': [],
            'alerts': []
        }
        
        # Parse forecast (24 hours)
        if forecast_data and 'forecast' in forecast_data:
            forecast_day = forecast_data['forecast'].get('forecastday', [])
            if forecast_day and len(forecast_day) > 0:
                hourly_forecast = forecast_day[0].get('hour', [])
                for item in hourly_forecast[:24]:
                    weather_data['forecast'].append({
                        'dt': int(item.get('time_epoch', 0)),
                        'temp': round(item.get('temp_c', 0), 1),
                        'feels_like': round(item.get('feelslike_c', 0), 1),
                        'humidity': item.get('humidity', 0),
                        'pressure': item.get('pressure_mb', 0),
                        'wind_speed': round(item.get('wind_kph', 0), 1),
                        'weather': [{
                            'main': item.get('condition', {}).get('text', ''),
                            'description': item.get('condition', {}).get('text', ''),
                            'icon': item.get('condition', {}).get('icon', '')
                        }],
                        'rain': item.get('precip_mm', 0),
                        'clouds': item.get('cloud', 0)
                    })
        
        # Generate weather alerts
        alerts = []
        condition_text = current_weather.get('condition', {}).get('text', '').lower()
        
        # Heavy rain alert
        if 'mưa' in condition_text or 'rain' in condition_text or 'drizzle' in condition_text:
            alerts.append({
                'type': 'rain',
                'severity': 'warning',
                'title': 'Cảnh báo mưa',
                'description': 'Có mưa tại khu vực này. Hãy chuẩn bị áo mưa hoặc dù.',
                'icon': '🌧️'
            })
        
        # Flood risk (if heavy rain forecasted)
        if forecast_data:
            heavy_rain_count = sum(1 for item in weather_data['forecast'][:8] 
                                 if item.get('rain', 0) > 10)
            if heavy_rain_count >= 3:
                alerts.append({
                    'type': 'flood',
                    'severity': 'danger',
                    'title': 'Cảnh báo nguy cơ lũ lụt',
                    'description': 'Dự báo mưa lớn trong 24h tới. Tránh đi đến khu vực thấp trũng.',
                    'icon': '⚠️'
                })
        
        # High wind alert
        if current_weather.get('wind_kph', 0) > 36:
            alerts.append({
                'type': 'wind',
                'severity': 'warning',
                'title': 'Cảnh báo gió mạnh',
                'description': 'Gió mạnh tại khu vực này. Cẩn thận khi di chuyển.',
                'icon': '💨'
            })
        
        # Extreme heat
        if current_weather.get('temp_c', 0) > 35:
            alerts.append({
                'type': 'heat',
                'severity': 'warning',
                'title': 'Cảnh báo nắng nóng',
                'description': 'Nhiệt độ cao. Hãy uống nhiều nước và tránh hoạt động ngoài trời.',
                'icon': '☀️'
            })
        
        weather_data['alerts'] = alerts
        
        return jsonify(weather_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy dữ liệu thời tiết: {str(e)}'}), 500

@maps_bp.route('/directions', methods=['GET'])
def get_directions():
    """Get directions between two points (proxy for Google Directions API)"""
    try:
        import os
        import requests
        
        origin = request.args.get('origin')  # "lat,lng" or address
        destination = request.args.get('destination')  # "lat,lng" or address
        mode = request.args.get('mode', 'driving')  # driving, walking, bicycling, transit
        
        if not origin or not destination:
            return jsonify({'error': 'Thiếu điểm xuất phát hoặc điểm đích'}), 400
        
        api_key = os.getenv('GOOGLE_MAPS_API_KEY', '')
        
        if not api_key:
            return jsonify({'error': 'Google Maps API Key chưa được cấu hình'}), 500
        
        # Call Google Directions API
        url = f"https://maps.googleapis.com/maps/api/directions/json"
        params = {
            'origin': origin,
            'destination': destination,
            'mode': mode,
            'key': api_key,
            'language': 'vi',
            'alternatives': 'true'
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            return jsonify({'error': 'Không thể lấy chỉ đường'}), 500
        
        data = response.json()
        
        if data.get('status') != 'OK':
            return jsonify({'error': f"Lỗi từ Google Directions: {data.get('status')}"}), 400
        
        # Format response
        routes = []
        for route in data.get('routes', []):
            leg = route['legs'][0]
            routes.append({
                'distance': leg['distance'],
                'duration': leg['duration'],
                'start_address': leg['start_address'],
                'end_address': leg['end_address'],
                'steps': [{
                    'instruction': step['html_instructions'],
                    'distance': step['distance'],
                    'duration': step['duration'],
                    'polyline': step['polyline']['points']
                } for step in leg['steps']]
            })
        
        return jsonify({
            'routes': routes,
            'status': 'OK'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy chỉ đường: {str(e)}'}), 500