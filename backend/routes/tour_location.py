"""
Tour Location Tracking Routes
API endpoints for managing tour member locations, geofences, and alerts
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import desc, and_

from models import db
from models.user import User
from models.booking import Booking
from models.tour import Tour
from models.tour_assignment import TourAssignment
from models.booking_participant import BookingParticipant
from models.tour_member_location import TourMemberLocation, TourLocationHistory, TourGeofence
from utils.auth import token_required, tour_guide_required

tour_location_bp = Blueprint('tour_location', __name__, url_prefix='/api/tour-location')


# =====================================================
# MEMBER LOCATION MANAGEMENT
# =====================================================

@tour_location_bp.route('/bookings/<int:booking_id>/members', methods=['GET'])
@token_required
def get_tour_members_locations(current_user, booking_id):
    """Get current locations of all members in a tour"""
    try:
        # Verify access to this booking
        booking = Booking.query.get_or_404(booking_id)
        
        # Check if user is tour guide, seller, admin, or participant
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        tour = Tour.query.get(booking.tour_id)
        
        is_authorized = (
            current_user.role in ['admin', 'moderator'] or
            (assignment and assignment.tour_guide_id == current_user.id) or
            (tour and tour.seller_id == current_user.id) or
            booking.user_id == current_user.id
        )
        
        if not is_authorized:
            return jsonify({'error': 'Không có quyền truy cập'}), 403
        
        # Get all active member locations
        locations = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            is_active=True
        ).all()
        
        # Separate tour guides and participants
        guides = []
        participants = []
        sos_alerts = []
        
        for loc in locations:
            loc_data = loc.to_dict(include_user=True)
            
            if loc.is_sos:
                sos_alerts.append(loc_data)
            
            if loc.member_type == 'tour_guide':
                guides.append(loc_data)
            else:
                participants.append(loc_data)
        
        # Get stale locations (not updated in last 10 minutes)
        stale_members = [loc.to_dict() for loc in locations if loc.is_stale(minutes=10)]
        
        return jsonify({
            'booking_id': booking_id,
            'tour_guides': guides,
            'participants': participants,
            'total_members': len(locations),
            'sos_alerts': sos_alerts,
            'stale_members': stale_members,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy vị trí thành viên: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/members/<int:member_id>', methods=['GET'])
@token_required
def get_member_location(current_user, booking_id, member_id):
    """Get specific member's current location and history"""
    try:
        member_location = TourMemberLocation.query.filter_by(
            id=member_id,
            booking_id=booking_id
        ).first_or_404()
        
        # Get recent history
        history = TourLocationHistory.query.filter_by(
            member_location_id=member_id
        ).order_by(desc(TourLocationHistory.recorded_at)).limit(100).all()
        
        return jsonify({
            'member': member_location.to_dict(include_user=True),
            'history': [h.to_dict() for h in history],
            'history_count': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy vị trí thành viên: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/update-location', methods=['POST'])
@token_required
def update_my_location(current_user, booking_id):
    """Update current user's location"""
    try:
        data = request.get_json()
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or longitude is None:
            return jsonify({'error': 'Thiếu tọa độ vị trí'}), 400
        
        # Verify booking exists and user is part of it
        booking = Booking.query.get_or_404(booking_id)
        
        # Determine member type
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        if assignment and assignment.tour_guide_id == current_user.id:
            member_type = 'tour_guide'
        elif booking.user_id == current_user.id:
            member_type = 'leader'  # Booking leader
        else:
            member_type = 'participant'
        
        # Find or create location record
        member_location = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            user_id=current_user.id,
            is_active=True
        ).first()
        
        if not member_location:
            member_location = TourMemberLocation(
                booking_id=booking_id,
                user_id=current_user.id,
                member_type=member_type,
                member_name=current_user.full_name or current_user.username,
                latitude=latitude,
                longitude=longitude
            )
            db.session.add(member_location)
        else:
            member_location.update_location(
                latitude=latitude,
                longitude=longitude,
                accuracy=data.get('accuracy'),
                altitude=data.get('altitude'),
                heading=data.get('heading'),
                speed=data.get('speed'),
                battery_level=data.get('battery_level'),
                location_source=data.get('location_source', 'gps')
            )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Đã cập nhật vị trí',
            'location': member_location.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật vị trí: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/start-tracking', methods=['POST'])
@token_required
def start_location_tracking(current_user, booking_id):
    """Start location tracking for current user"""
    try:
        data = request.get_json() or {}
        
        booking = Booking.query.get_or_404(booking_id)
        
        # Determine member type
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        if assignment and assignment.tour_guide_id == current_user.id:
            member_type = 'tour_guide'
        elif booking.user_id == current_user.id:
            member_type = 'leader'
        else:
            member_type = 'participant'
        
        # Check if already tracking
        existing = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            user_id=current_user.id,
            is_active=True
        ).first()
        
        if existing:
            return jsonify({
                'message': 'Đã đang theo dõi vị trí',
                'location': existing.to_dict()
            }), 200
        
        # Create new tracking record
        latitude = data.get('latitude', 0)
        longitude = data.get('longitude', 0)
        
        member_location = TourMemberLocation(
            booking_id=booking_id,
            user_id=current_user.id,
            member_type=member_type,
            member_name=current_user.full_name or current_user.username,
            latitude=latitude,
            longitude=longitude,
            is_active=True
        )
        
        db.session.add(member_location)
        db.session.commit()
        
        return jsonify({
            'message': 'Đã bắt đầu theo dõi vị trí',
            'location': member_location.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi bắt đầu theo dõi: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/stop-tracking', methods=['POST'])
@token_required
def stop_location_tracking(current_user, booking_id):
    """Stop location tracking for current user"""
    try:
        member_location = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            user_id=current_user.id,
            is_active=True
        ).first()
        
        if member_location:
            member_location.is_active = False
            db.session.commit()
        
        return jsonify({
            'message': 'Đã dừng theo dõi vị trí'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi dừng theo dõi: {str(e)}'}), 500


# =====================================================
# SOS EMERGENCY ALERTS
# =====================================================

@tour_location_bp.route('/bookings/<int:booking_id>/sos', methods=['POST'])
@token_required
def trigger_sos_alert(current_user, booking_id):
    """Trigger SOS emergency alert"""
    try:
        data = request.get_json() or {}
        
        message = data.get('message', 'Cần hỗ trợ khẩn cấp!')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        # Find member location
        member_location = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            user_id=current_user.id,
            is_active=True
        ).first()
        
        if member_location:
            member_location.trigger_sos(message)
            if latitude and longitude:
                member_location.latitude = latitude
                member_location.longitude = longitude
            db.session.commit()
        else:
            # Create new location record with SOS
            member_location = TourMemberLocation(
                booking_id=booking_id,
                user_id=current_user.id,
                member_type='participant',
                member_name=current_user.full_name or current_user.username,
                latitude=latitude or 0,
                longitude=longitude or 0,
                is_sos=True,
                sos_message=message
            )
            db.session.add(member_location)
            db.session.commit()
        
        # Create notification for tour guide
        from routes.notifications import create_notification
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        if assignment and assignment.tour_guide_id:
            create_notification(
                user_id=assignment.tour_guide_id,
                notification_type='sos_alert',
                title='🆘 SOS - Cần hỗ trợ khẩn cấp!',
                message=f'{current_user.full_name or current_user.username}: {message}',
                reference_type='booking',
                reference_id=booking_id,
                priority='critical'
            )
        
        return jsonify({
            'message': 'Đã gửi tín hiệu SOS',
            'sos_id': member_location.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi gửi SOS: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/sos/<int:sos_id>/clear', methods=['POST'])
@token_required
def clear_sos_alert(current_user, booking_id, sos_id):
    """Clear SOS alert (typically by tour guide)"""
    try:
        # Verify user is tour guide or admin
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        tour = Tour.query.join(Booking).filter(Booking.id == booking_id).first()
        
        is_authorized = (
            current_user.role in ['admin', 'moderator'] or
            (assignment and assignment.tour_guide_id == current_user.id) or
            (tour and tour.seller_id == current_user.id)
        )
        
        if not is_authorized:
            return jsonify({'error': 'Không có quyền xóa SOS'}), 403
        
        member_location = TourMemberLocation.query.filter_by(
            id=sos_id,
            booking_id=booking_id,
            is_sos=True
        ).first_or_404()
        
        member_location.clear_sos()
        db.session.commit()
        
        return jsonify({
            'message': 'Đã xử lý SOS',
            'cleared_by': current_user.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa SOS: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/sos/active', methods=['GET'])
@token_required
def get_active_sos_alerts(current_user, booking_id):
    """Get all active SOS alerts for a tour"""
    try:
        sos_alerts = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            is_sos=True,
            is_active=True
        ).all()
        
        return jsonify({
            'booking_id': booking_id,
            'sos_alerts': [loc.to_dict(include_user=True) for loc in sos_alerts],
            'count': len(sos_alerts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy danh sách SOS: {str(e)}'}), 500


# =====================================================
# GEOFENCE MANAGEMENT
# =====================================================

@tour_location_bp.route('/bookings/<int:booking_id>/geofences', methods=['GET'])
@token_required
def get_geofences(current_user, booking_id):
    """Get all geofences for a tour"""
    try:
        geofences = TourGeofence.query.filter_by(
            booking_id=booking_id
        ).all()
        
        return jsonify({
            'booking_id': booking_id,
            'geofences': [g.to_dict() for g in geofences],
            'count': len(geofences)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy geofences: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/geofences', methods=['POST'])
@token_required
@tour_guide_required
def create_geofence(current_user, booking_id):
    """Create a new geofence for a tour"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'center_latitude', 'center_longitude']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Thiếu trường {field}'}), 400
        
        geofence = TourGeofence(
            booking_id=booking_id,
            name=data['name'],
            description=data.get('description'),
            center_latitude=data['center_latitude'],
            center_longitude=data['center_longitude'],
            radius=data.get('radius', 500),
            fence_type=data.get('fence_type', 'safety_zone'),
            is_active=data.get('is_active', True),
            alert_on_exit=data.get('alert_on_exit', True),
            alert_on_enter=data.get('alert_on_enter', False),
            start_time=datetime.fromisoformat(data['start_time']) if data.get('start_time') else None,
            end_time=datetime.fromisoformat(data['end_time']) if data.get('end_time') else None,
            created_by=current_user.id
        )
        
        db.session.add(geofence)
        db.session.commit()
        
        return jsonify({
            'message': 'Đã tạo geofence',
            'geofence': geofence.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi tạo geofence: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/geofences/<int:geofence_id>', methods=['PUT'])
@token_required
@tour_guide_required
def update_geofence(current_user, booking_id, geofence_id):
    """Update a geofence"""
    try:
        geofence = TourGeofence.query.filter_by(
            id=geofence_id,
            booking_id=booking_id
        ).first_or_404()
        
        data = request.get_json()
        
        updateable_fields = [
            'name', 'description', 'center_latitude', 'center_longitude',
            'radius', 'fence_type', 'is_active', 'alert_on_exit', 'alert_on_enter'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(geofence, field, data[field])
        
        if 'start_time' in data:
            geofence.start_time = datetime.fromisoformat(data['start_time']) if data['start_time'] else None
        if 'end_time' in data:
            geofence.end_time = datetime.fromisoformat(data['end_time']) if data['end_time'] else None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Đã cập nhật geofence',
            'geofence': geofence.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi cập nhật geofence: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/geofences/<int:geofence_id>', methods=['DELETE'])
@token_required
@tour_guide_required
def delete_geofence(current_user, booking_id, geofence_id):
    """Delete a geofence"""
    try:
        geofence = TourGeofence.query.filter_by(
            id=geofence_id,
            booking_id=booking_id
        ).first_or_404()
        
        db.session.delete(geofence)
        db.session.commit()
        
        return jsonify({
            'message': 'Đã xóa geofence'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi xóa geofence: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/geofences/check', methods=['POST'])
@token_required
def check_geofence_status(current_user, booking_id):
    """Check if a point is inside any active geofences"""
    try:
        data = request.get_json()
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or longitude is None:
            return jsonify({'error': 'Thiếu tọa độ'}), 400
        
        active_geofences = TourGeofence.query.filter_by(
            booking_id=booking_id,
            is_active=True
        ).all()
        
        results = []
        for fence in active_geofences:
            is_inside = fence.is_point_inside(latitude, longitude)
            results.append({
                'geofence': fence.to_dict(),
                'is_inside': is_inside
            })
        
        return jsonify({
            'location': {'latitude': latitude, 'longitude': longitude},
            'geofences': results
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi kiểm tra geofence: {str(e)}'}), 500


# =====================================================
# LOCATION HISTORY
# =====================================================

@tour_location_bp.route('/bookings/<int:booking_id>/history', methods=['GET'])
@token_required
def get_tour_location_history(current_user, booking_id):
    """Get location history for entire tour"""
    try:
        # Query parameters
        user_id = request.args.get('user_id', type=int)
        member_id = request.args.get('member_id', type=int)
        start_time = request.args.get('start_time')
        end_time = request.args.get('end_time')
        limit = min(request.args.get('limit', 1000, type=int), 5000)
        
        query = TourLocationHistory.query.filter_by(booking_id=booking_id)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        if member_id:
            query = query.filter_by(member_location_id=member_id)
        
        if start_time:
            query = query.filter(TourLocationHistory.recorded_at >= datetime.fromisoformat(start_time))
        
        if end_time:
            query = query.filter(TourLocationHistory.recorded_at <= datetime.fromisoformat(end_time))
        
        history = query.order_by(desc(TourLocationHistory.recorded_at)).limit(limit).all()
        
        return jsonify({
            'booking_id': booking_id,
            'history': [h.to_dict() for h in history],
            'count': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy lịch sử vị trí: {str(e)}'}), 500


@tour_location_bp.route('/bookings/<int:booking_id>/route/<int:user_id>', methods=['GET'])
@token_required
def get_member_route(current_user, booking_id, user_id):
    """Get the route (path) traveled by a specific member"""
    try:
        # Get member location record
        member_location = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            user_id=user_id
        ).first()
        
        if not member_location:
            return jsonify({'error': 'Không tìm thấy thành viên'}), 404
        
        # Get history in chronological order
        history = TourLocationHistory.query.filter_by(
            member_location_id=member_location.id
        ).order_by(TourLocationHistory.recorded_at.asc()).all()
        
        # Format as route coordinates
        route = [{
            'lat': h.latitude,
            'lng': h.longitude,
            'timestamp': h.recorded_at.isoformat(),
            'speed': h.speed,
            'heading': h.heading
        } for h in history]
        
        return jsonify({
            'booking_id': booking_id,
            'user_id': user_id,
            'member_name': member_location.member_name,
            'route': route,
            'total_points': len(route)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy lộ trình: {str(e)}'}), 500


# =====================================================
# DISTANCE CALCULATIONS
# =====================================================

@tour_location_bp.route('/bookings/<int:booking_id>/distances', methods=['GET'])
@token_required
def get_member_distances(current_user, booking_id):
    """Get distances between all members or from a reference point"""
    try:
        from math import radians, sin, cos, sqrt, atan2
        
        ref_lat = request.args.get('lat', type=float)
        ref_lng = request.args.get('lng', type=float)
        
        # Get all active member locations
        locations = TourMemberLocation.query.filter_by(
            booking_id=booking_id,
            is_active=True
        ).all()
        
        def calculate_distance(lat1, lon1, lat2, lon2):
            """Calculate distance in meters using Haversine formula"""
            R = 6371000  # Earth radius in meters
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            return R * c
        
        members_with_distance = []
        
        for loc in locations:
            member_data = loc.to_dict()
            
            if ref_lat is not None and ref_lng is not None:
                # Calculate distance from reference point
                distance = calculate_distance(ref_lat, ref_lng, loc.latitude, loc.longitude)
                member_data['distance_from_ref'] = round(distance, 2)
            
            members_with_distance.append(member_data)
        
        # Sort by distance if reference point provided
        if ref_lat is not None and ref_lng is not None:
            members_with_distance.sort(key=lambda x: x.get('distance_from_ref', 0))
        
        # Calculate pairwise distances for tour guide
        guide_distances = {}
        guides = [loc for loc in locations if loc.member_type == 'tour_guide']
        
        if guides:
            guide = guides[0]
            for loc in locations:
                if loc.id != guide.id:
                    distance = calculate_distance(
                        guide.latitude, guide.longitude,
                        loc.latitude, loc.longitude
                    )
                    guide_distances[loc.id] = {
                        'member_id': loc.id,
                        'member_name': loc.member_name,
                        'distance': round(distance, 2)
                    }
        
        return jsonify({
            'booking_id': booking_id,
            'reference_point': {'lat': ref_lat, 'lng': ref_lng} if ref_lat and ref_lng else None,
            'members': members_with_distance,
            'distances_from_guide': list(guide_distances.values())
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi tính khoảng cách: {str(e)}'}), 500


# =====================================================
# TOUR GUIDE SPECIFIC
# =====================================================

@tour_location_bp.route('/my-tours/locations', methods=['GET'])
@token_required
@tour_guide_required
def get_my_tour_locations(current_user):
    """Get locations for all tours assigned to current tour guide"""
    try:
        # Get all active assignments
        assignments = TourAssignment.query.filter_by(
            tour_guide_id=current_user.id,
            status='in_progress'
        ).all()
        
        tours_data = []
        
        for assignment in assignments:
            booking = assignment.booking
            
            # Get member locations
            locations = TourMemberLocation.query.filter_by(
                booking_id=booking.id,
                is_active=True
            ).all()
            
            # Check for SOS alerts
            sos_count = sum(1 for loc in locations if loc.is_sos)
            stale_count = sum(1 for loc in locations if loc.is_stale(minutes=10))
            
            tours_data.append({
                'booking_id': booking.id,
                'tour_name': booking.tour.title if booking.tour else 'Unknown',
                'tour_date': booking.date,
                'members_count': len(locations),
                'sos_alerts': sos_count,
                'stale_locations': stale_count,
                'members': [loc.to_dict() for loc in locations]
            })
        
        return jsonify({
            'tours': tours_data,
            'total_tours': len(tours_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy dữ liệu tour: {str(e)}'}), 500
