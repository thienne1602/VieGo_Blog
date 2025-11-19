from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db
from models.user import User
from models.booking import Booking
from models.tour import Tour
from models.tour_progress import TourProgress
from models.tour_assignment import TourAssignment
from datetime import datetime
import json
import os
import uuid
import zipfile
import io
from PIL import Image

tour_progress_bp = Blueprint('tour_progress', __name__, url_prefix='/api/tour-progress')

# Configuration
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_IMAGES_PER_CHECKPOINT = 10


def allowed_image_file(filename):
    """Check if file has an allowed image extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def generate_unique_filename(original_filename):
    """Generate a unique filename"""
    ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
    unique_name = f"{uuid.uuid4().hex}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    return f"{unique_name}.{ext}" if ext else unique_name


@tour_progress_bp.route('', methods=['GET'])
@jwt_required()
def get_tour_progress_by_query():
    """Get all progress checkpoints for a booking (query parameter version)"""
    try:
        booking_id = request.args.get('booking_id', type=int)
        
        if not booking_id:
            return jsonify({'error': 'booking_id query parameter is required'}), 400
        
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Permission check: customer, tour guide, seller, or admin
        tour = Tour.query.get(booking.tour_id)
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        
        is_customer = booking.user_id == current_user_id
        is_seller = tour and tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_customer or is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all progress checkpoints
        checkpoints = TourProgress.query.filter_by(
            booking_id=booking_id
        ).order_by(TourProgress.checkpoint_order).all()
        
        return jsonify({
            'checkpoints': [cp.to_dict(include_updater=True) for cp in checkpoints],
            'total': len(checkpoints)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching tour progress: {str(e)}'}), 500


@tour_progress_bp.route('/booking/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_tour_progress(booking_id):
    """Get all progress checkpoints for a booking"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Permission check: customer, tour guide, seller, or admin
        tour = Tour.query.get(booking.tour_id)
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        
        is_customer = booking.user_id == current_user_id
        is_seller = tour and tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_customer or is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all progress checkpoints
        checkpoints = TourProgress.query.filter_by(
            booking_id=booking_id
        ).order_by(TourProgress.checkpoint_order).all()
        
        return jsonify({
            'checkpoints': [cp.to_dict(include_updater=True) for cp in checkpoints],
            'total': len(checkpoints)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error fetching tour progress: {str(e)}'}), 500


@tour_progress_bp.route('', methods=['POST'])
@jwt_required()
def create_checkpoint():
    """Create a new checkpoint (seller or tour guide)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        if not data or 'booking_id' not in data or 'checkpoint_name' not in data or 'checkpoint_order' not in data:
            return jsonify({'error': 'booking_id, checkpoint_name, and checkpoint_order are required'}), 400
        
        booking_id = data['booking_id']
        booking = Booking.query.get(booking_id)
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Permission check: seller, assigned guide, or admin
        tour = Tour.query.get(booking.tour_id)
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        
        is_seller = tour and tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized. Only seller, assigned guide, or admin can create checkpoints'}), 403
        
        # Create checkpoint
        checkpoint = TourProgress(
            booking_id=booking_id,
            checkpoint_name=data['checkpoint_name'],
            checkpoint_description=data.get('checkpoint_description'),
            checkpoint_order=data['checkpoint_order'],
            location_name=data.get('location_name'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            status=data.get('status', 'pending'),
            notes=data.get('notes'),
            updated_by=current_user_id
        )
        
        # Set scheduled time if provided
        if 'scheduled_time' in data and data['scheduled_time']:
            try:
                checkpoint.scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
            except:
                pass
        
        # Set images if provided
        if 'images' in data and isinstance(data['images'], list):
            checkpoint.set_images(data['images'])
        
        db.session.add(checkpoint)
        db.session.commit()
        
        return jsonify({
            'message': 'Checkpoint created successfully',
            'checkpoint': checkpoint.to_dict(include_updater=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating checkpoint: {str(e)}'}), 500


@tour_progress_bp.route('/<int:checkpoint_id>', methods=['PATCH'])
@jwt_required()
def update_checkpoint(checkpoint_id):
    """Update a checkpoint (tour guide can update status and notes)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        checkpoint = TourProgress.query.get(checkpoint_id)
        if not checkpoint:
            return jsonify({'error': 'Checkpoint not found'}), 404
        
        # Permission check: assigned guide, seller, or admin
        booking = Booking.query.get(checkpoint.booking_id)
        tour = Tour.query.get(booking.tour_id) if booking else None
        assignment = TourAssignment.query.filter_by(booking_id=checkpoint.booking_id).first()
        
        is_seller = tour and tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update allowed fields
        if 'checkpoint_name' in data:
            checkpoint.checkpoint_name = data['checkpoint_name']
        
        if 'checkpoint_description' in data:
            checkpoint.checkpoint_description = data['checkpoint_description']
        
        if 'location_name' in data:
            checkpoint.location_name = data['location_name']
        
        if 'latitude' in data:
            checkpoint.latitude = data['latitude']
        
        if 'longitude' in data:
            checkpoint.longitude = data['longitude']
        
        if 'status' in data:
            if data['status'] not in ['pending', 'in_progress', 'completed', 'skipped']:
                return jsonify({'error': 'Invalid status'}), 400
            checkpoint.status = data['status']
            
            # Auto-set arrival time when status changes to in_progress
            if data['status'] == 'in_progress' and not checkpoint.arrival_time:
                checkpoint.arrival_time = datetime.utcnow()
            
            # Auto-set departure time when status changes to completed
            if data['status'] == 'completed' and not checkpoint.departure_time:
                checkpoint.departure_time = datetime.utcnow()
        
        if 'notes' in data:
            checkpoint.notes = data['notes']
        
        if 'images' in data and isinstance(data['images'], list):
            checkpoint.set_images(data['images'])
        
        # Update times if provided
        if 'arrival_time' in data and data['arrival_time']:
            try:
                checkpoint.arrival_time = datetime.fromisoformat(data['arrival_time'].replace('Z', '+00:00'))
            except:
                pass
        
        if 'departure_time' in data and data['departure_time']:
            try:
                checkpoint.departure_time = datetime.fromisoformat(data['departure_time'].replace('Z', '+00:00'))
            except:
                pass
        
        if 'scheduled_time' in data and data['scheduled_time']:
            try:
                checkpoint.scheduled_time = datetime.fromisoformat(data['scheduled_time'].replace('Z', '+00:00'))
            except:
                pass
        
        checkpoint.updated_by = current_user_id
        checkpoint.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Checkpoint updated successfully',
            'checkpoint': checkpoint.to_dict(include_updater=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating checkpoint: {str(e)}'}), 500


@tour_progress_bp.route('/<int:checkpoint_id>', methods=['DELETE'])
@jwt_required()
def delete_checkpoint(checkpoint_id):
    """Delete a checkpoint (seller or admin only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        checkpoint = TourProgress.query.get(checkpoint_id)
        if not checkpoint:
            return jsonify({'error': 'Checkpoint not found'}), 404
        
        # Permission check: seller or admin only
        booking = Booking.query.get(checkpoint.booking_id)
        tour = Tour.query.get(booking.tour_id) if booking else None
        
        is_seller = tour and tour.seller_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_seller or is_admin):
            return jsonify({'error': 'Unauthorized. Only seller or admin can delete checkpoints'}), 403
        
        db.session.delete(checkpoint)
        db.session.commit()
        
        return jsonify({'message': 'Checkpoint deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting checkpoint: {str(e)}'}), 500


@tour_progress_bp.route('/booking/<int:booking_id>/init-from-itinerary', methods=['POST'])
@jwt_required()
def init_checkpoints_from_itinerary(booking_id):
    """Initialize checkpoints from tour itinerary (seller only)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        tour = Tour.query.get(booking.tour_id)
        if not tour:
            return jsonify({'error': 'Tour not found'}), 404
        
        # Permission check: seller, assigned tour guide, or admin
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        
        is_seller = tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized. Only seller, assigned tour guide, or admin can initialize itinerary'}), 403
        
        # Get tour itinerary
        itinerary = tour.get_itinerary()
        if not itinerary:
            return jsonify({'error': 'Tour has no itinerary'}), 400
        
        # Clear existing checkpoints
        TourProgress.query.filter_by(booking_id=booking_id).delete()
        
        # Create checkpoints from itinerary
        checkpoints_created = []
        
        # Assuming itinerary is a dict with days as keys
        for day_key in sorted(itinerary.keys()):
            day_data = itinerary[day_key]
            
            # Handle different itinerary formats
            if isinstance(day_data, dict):
                checkpoint_name = day_data.get('title', f'Day {day_key}')
                checkpoint_description = day_data.get('description', '')
                location = day_data.get('location', '')
            elif isinstance(day_data, str):
                checkpoint_name = f'Day {day_key}'
                checkpoint_description = day_data
                location = ''
            else:
                continue
            
            checkpoint = TourProgress(
                booking_id=booking_id,
                checkpoint_name=checkpoint_name,
                checkpoint_description=checkpoint_description,
                checkpoint_order=int(day_key) if str(day_key).isdigit() else len(checkpoints_created) + 1,
                location_name=location,
                status='pending',
                updated_by=current_user_id
            )
            
            db.session.add(checkpoint)
            checkpoints_created.append(checkpoint)
        
        db.session.commit()
        
        return jsonify({
            'message': f'{len(checkpoints_created)} checkpoints created successfully',
            'checkpoints': [cp.to_dict() for cp in checkpoints_created]
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error initializing checkpoints: {str(e)}'}), 500


@tour_progress_bp.route('/<int:checkpoint_id>/upload-images', methods=['POST'])
@jwt_required()
def upload_checkpoint_images(checkpoint_id):
    """Upload multiple images for a checkpoint (tour guide)"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        checkpoint = TourProgress.query.get(checkpoint_id)
        if not checkpoint:
            return jsonify({'error': 'Checkpoint not found'}), 404
        
        # Permission check: assigned guide, seller, or admin
        booking = Booking.query.get(checkpoint.booking_id)
        tour = Tour.query.get(booking.tour_id) if booking else None
        assignment = TourAssignment.query.filter_by(booking_id=checkpoint.booking_id).first()
        
        is_seller = tour and tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized. Only assigned guide, seller, or admin can upload images'}), 403
        
        # Check if files are in request
        if 'images' not in request.files:
            return jsonify({'error': 'No images provided'}), 400
        
        files = request.files.getlist('images')
        
        if not files or len(files) == 0:
            return jsonify({'error': 'No images selected'}), 400
        
        # Get existing images
        existing_images = checkpoint.get_images()
        
        # Check total images limit
        if len(existing_images) + len(files) > MAX_IMAGES_PER_CHECKPOINT:
            return jsonify({
                'error': f'Maximum {MAX_IMAGES_PER_CHECKPOINT} images allowed per checkpoint. Current: {len(existing_images)}'
            }), 400
        
        # Upload folder
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        checkpoint_folder = os.path.join(upload_folder, 'tour_progress', f'booking_{checkpoint.booking_id}', f'checkpoint_{checkpoint_id}')
        os.makedirs(checkpoint_folder, exist_ok=True)
        
        uploaded_images = []
        errors = []
        
        for file in files:
            # Validate file
            if file.filename == '':
                continue
            
            if not allowed_image_file(file.filename):
                errors.append(f'{file.filename}: Invalid file type. Allowed: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}')
                continue
            
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > MAX_IMAGE_SIZE:
                errors.append(f'{file.filename}: File too large. Max: {MAX_IMAGE_SIZE / (1024 * 1024)}MB')
                continue
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            unique_filename = generate_unique_filename(filename)
            file_path = os.path.join(checkpoint_folder, unique_filename)
            
            # Save file
            file.save(file_path)
            
            # Optionally compress/resize image
            try:
                img = Image.open(file_path)
                # Resize if too large (keep aspect ratio)
                max_dimension = 1920
                if img.width > max_dimension or img.height > max_dimension:
                    img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                    img.save(file_path, optimize=True, quality=85)
            except Exception as e:
                print(f"Warning: Could not optimize image {unique_filename}: {str(e)}")
            
            # Generate URL
            image_url = f"/uploads/tour_progress/booking_{checkpoint.booking_id}/checkpoint_{checkpoint_id}/{unique_filename}"
            uploaded_images.append(image_url)
        
        # Update checkpoint with new images
        all_images = existing_images + uploaded_images
        checkpoint.set_images(all_images)
        checkpoint.updated_by = current_user_id
        checkpoint.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        response = {
            'message': f'{len(uploaded_images)} images uploaded successfully',
            'uploaded': uploaded_images,
            'total_images': len(all_images),
            'checkpoint': checkpoint.to_dict(include_updater=True)
        }
        
        if errors:
            response['errors'] = errors
        
        return jsonify(response), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error uploading images: {str(e)}'}), 500


@tour_progress_bp.route('/<int:checkpoint_id>/images/<int:image_index>', methods=['DELETE'])
@jwt_required()
def delete_checkpoint_image(checkpoint_id, image_index):
    """Delete a specific image from checkpoint"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        checkpoint = TourProgress.query.get(checkpoint_id)
        if not checkpoint:
            return jsonify({'error': 'Checkpoint not found'}), 404
        
        # Permission check
        booking = Booking.query.get(checkpoint.booking_id)
        tour = Tour.query.get(booking.tour_id) if booking else None
        assignment = TourAssignment.query.filter_by(booking_id=checkpoint.booking_id).first()
        
        is_seller = tour and tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get images
        images = checkpoint.get_images()
        
        if image_index < 0 or image_index >= len(images):
            return jsonify({'error': 'Invalid image index'}), 400
        
        # Get image URL to delete
        image_url = images[image_index]
        
        # Delete physical file
        try:
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            # Extract relative path from URL
            relative_path = image_url.replace('/uploads/', '')
            file_path = os.path.join(upload_folder, relative_path)
            
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Warning: Could not delete physical file: {str(e)}")
        
        # Remove from list
        images.pop(image_index)
        checkpoint.set_images(images)
        checkpoint.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Image deleted successfully',
            'remaining_images': len(images),
            'checkpoint': checkpoint.to_dict(include_updater=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting image: {str(e)}'}), 500


@tour_progress_bp.route('/booking/<int:booking_id>/download-images', methods=['GET'])
@jwt_required()
def download_all_checkpoint_images(booking_id):
    """Download all checkpoint images as a ZIP file"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Permission check: customer, seller, guide, or admin
        tour = Tour.query.get(booking.tour_id)
        assignment = TourAssignment.query.filter_by(booking_id=booking_id).first()
        
        is_customer = booking.user_id == current_user_id
        is_seller = tour and tour.seller_id == current_user_id
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_customer or is_seller or is_guide or is_admin):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all checkpoints with images
        checkpoints = TourProgress.query.filter_by(booking_id=booking_id).all()
        
        # Create ZIP file in memory
        memory_file = io.BytesIO()
        
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            image_count = 0
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            
            for checkpoint in checkpoints:
                images = checkpoint.get_images()
                
                if not images:
                    continue
                
                # Create folder name in ZIP
                folder_name = f"{checkpoint.checkpoint_order}_{checkpoint.checkpoint_name.replace('/', '_')}"
                
                for idx, image_url in enumerate(images):
                    try:
                        # Get physical file path
                        relative_path = image_url.replace('/uploads/', '')
                        file_path = os.path.join(upload_folder, relative_path)
                        
                        if os.path.exists(file_path):
                            # Get original filename
                            original_filename = os.path.basename(file_path)
                            # Add to ZIP with structured path
                            zip_path = f"{folder_name}/{idx+1}_{original_filename}"
                            zf.write(file_path, zip_path)
                            image_count += 1
                    except Exception as e:
                        print(f"Warning: Could not add image to ZIP: {str(e)}")
                        continue
        
        if image_count == 0:
            return jsonify({'error': 'No images found for this booking'}), 404
        
        # Prepare file for download
        memory_file.seek(0)
        
        # Generate filename
        tour_title = tour.title.replace(' ', '_')[:50] if tour else 'tour'
        filename = f"{tour_title}_booking_{booking_id}_images.zip"
        
        return send_file(
            memory_file,
            mimetype='application/zip',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': f'Error downloading images: {str(e)}'}), 500


@tour_progress_bp.route('/<int:checkpoint_id>/check-in', methods=['POST'])
@jwt_required()
def checkpoint_checkin(checkpoint_id):
    """Quick check-in: Update status to 'in_progress' and optionally upload images"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        checkpoint = TourProgress.query.get(checkpoint_id)
        if not checkpoint:
            return jsonify({'error': 'Checkpoint not found'}), 404
        
        # Permission check: assigned guide only
        assignment = TourAssignment.query.filter_by(booking_id=checkpoint.booking_id).first()
        
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_guide or is_admin):
            return jsonify({'error': 'Unauthorized. Only assigned tour guide can check in'}), 403
        
        # Update status
        checkpoint.status = 'in_progress'
        checkpoint.arrival_time = datetime.utcnow()
        checkpoint.updated_by = current_user_id
        checkpoint.updated_at = datetime.utcnow()
        
        # Get notes from form/json
        if request.is_json:
            data = request.get_json()
            if 'notes' in data:
                checkpoint.notes = data.get('notes')
        else:
            checkpoint.notes = request.form.get('notes', checkpoint.notes)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Checked in successfully',
            'checkpoint': checkpoint.to_dict(include_updater=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error checking in: {str(e)}'}), 500


@tour_progress_bp.route('/<int:checkpoint_id>/complete', methods=['POST'])
@jwt_required()
def checkpoint_complete(checkpoint_id):
    """Mark checkpoint as completed"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        checkpoint = TourProgress.query.get(checkpoint_id)
        if not checkpoint:
            return jsonify({'error': 'Checkpoint not found'}), 404
        
        # Permission check: assigned guide only
        assignment = TourAssignment.query.filter_by(booking_id=checkpoint.booking_id).first()
        
        is_guide = assignment and assignment.tour_guide_id == current_user_id
        is_admin = user.role == 'admin'
        
        if not (is_guide or is_admin):
            return jsonify({'error': 'Unauthorized. Only assigned tour guide can complete checkpoint'}), 403
        
        # Update status
        checkpoint.status = 'completed'
        checkpoint.departure_time = datetime.utcnow()
        
        # Set arrival time if not set
        if not checkpoint.arrival_time:
            checkpoint.arrival_time = datetime.utcnow()
        
        checkpoint.updated_by = current_user_id
        checkpoint.updated_at = datetime.utcnow()
        
        # Get notes from request
        if request.is_json:
            data = request.get_json()
            if 'notes' in data:
                checkpoint.notes = data.get('notes')
        else:
            checkpoint.notes = request.form.get('notes', checkpoint.notes)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Checkpoint completed successfully',
            'checkpoint': checkpoint.to_dict(include_updater=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error completing checkpoint: {str(e)}'}), 500

