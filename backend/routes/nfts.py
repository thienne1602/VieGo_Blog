"""
NFT Routes for VieGo Blog
Handles NFT gallery, badges, and blockchain features
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc
from datetime import datetime
import json

from models import db
from models.user import User
from models.nft import NFT

nfts_bp = Blueprint('nfts', __name__, url_prefix='/api/nfts')

@nfts_bp.route('/gallery', methods=['GET'])
def get_nft_gallery():
    """Get all NFTs in the gallery"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)
        badge_type = request.args.get('badge_type')
        badge_level = request.args.get('badge_level')
        rarity = request.args.get('rarity')
        
        query = NFT.query.filter_by(status='minted')
        
        if badge_type:
            query = query.filter_by(badge_type=badge_type)
        
        if badge_level:
            query = query.filter_by(badge_level=badge_level)
        
        if rarity:
            query = query.filter_by(rarity=rarity)
        
        query = query.order_by(desc(NFT.minted_at))
        
        nfts_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        nfts_data = []
        for nft in nfts_pagination.items:
            nft_dict = nft.to_dict()
            # Include owner info
            owner = User.query.get(nft.owner_id)
            nft_dict['owner'] = {
                'id': owner.id,
                'username': owner.username,
                'avatar_url': owner.avatar_url
            } if owner else None
            nfts_data.append(nft_dict)
        
        return jsonify({
            'nfts': nfts_data,
            'pagination': {
                'page': nfts_pagination.page,
                'pages': nfts_pagination.pages,
                'total': nfts_pagination.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy NFT gallery: {str(e)}'}), 500

@nfts_bp.route('/my-collection', methods=['GET'])
@jwt_required()
def get_my_collection():
    """Get current user's NFT collection"""
    try:
        current_user_id = get_jwt_identity()
        
        nfts = NFT.query.filter_by(
            owner_id=current_user_id,
            status='minted'
        ).order_by(desc(NFT.minted_at)).all()
        
        nfts_data = [nft.to_dict() for nft in nfts]
        
        return jsonify({
            'nfts': nfts_data,
            'count': len(nfts_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy bộ sưu tập: {str(e)}'}), 500

@nfts_bp.route('/<int:nft_id>', methods=['GET'])
def get_nft(nft_id):
    """Get single NFT details"""
    try:
        nft = NFT.query.get_or_404(nft_id)
        nft_dict = nft.to_dict()
        
        # Include owner info
        owner = User.query.get(nft.owner_id)
        nft_dict['owner'] = {
            'id': owner.id,
            'username': owner.username,
            'full_name': owner.full_name,
            'avatar_url': owner.avatar_url
        } if owner else None
        
        return jsonify(nft_dict), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thông tin NFT: {str(e)}'}), 500

@nfts_bp.route('/check-eligibility', methods=['GET'])
@jwt_required()
def check_eligibility():
    """Check which NFTs/badges the user is eligible to unlock"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Check eligibility for different badge types
        eligible_badges = []
        
        # Explorer badge - based on points and locations visited
        if user.points >= 500:
            eligible_badges.append({
                'badge_type': 'explorer',
                'badge_level': 'bronze',
                'reason': 'Đạt 500 điểm',
                'requirement_met': True
            })
        
        if user.points >= 2000:
            eligible_badges.append({
                'badge_type': 'explorer',
                'badge_level': 'silver',
                'reason': 'Đạt 2000 điểm',
                'requirement_met': True
            })
        
        # Writer badge - based on posts
        # Would check post count when relationships are enabled
        
        return jsonify({
            'eligible_badges': eligible_badges,
            'user_points': user.points,
            'user_level': user.level
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi kiểm tra điều kiện: {str(e)}'}), 500

@nfts_bp.route('/mint', methods=['POST'])
@jwt_required()
def mint_nft():
    """Mint a new NFT badge for user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        data = request.get_json()
        badge_type = data.get('badge_type')
        badge_level = data.get('badge_level', 'bronze')
        
        if not badge_type:
            return jsonify({'error': 'Thiếu loại badge'}), 400
        
        # Check if user already has this badge
        existing = NFT.query.filter_by(
            owner_id=current_user_id,
            badge_type=badge_type,
            badge_level=badge_level,
            status='minted'
        ).first()
        
        if existing:
            return jsonify({'error': 'Bạn đã sở hữu badge này'}), 400
        
        # Create NFT
        nft = NFT(
            owner_id=current_user_id,
            badge_type=badge_type,
            badge_level=badge_level
        )
        
        # Generate token ID (simplified - in production use proper blockchain integration)
        import time
        nft.token_id = f"VGB-{badge_type.upper()}-{int(time.time())}"
        nft.contract_address = "0x1234567890abcdef"  # Placeholder
        
        # Set metadata
        nft.name = f"{badge_type.title()} {badge_level.title()} Badge"
        nft.description = f"VieGo Blog {badge_type} achievement badge - {badge_level} level"
        nft.image_url = f"/nft-images/{badge_type}-{badge_level}.png"
        
        # Set rarity based on level
        rarity_map = {
            'bronze': 'common',
            'silver': 'uncommon',
            'gold': 'rare',
            'platinum': 'epic',
            'legendary': 'legendary'
        }
        nft.rarity = rarity_map.get(badge_level, 'common')
        
        # Mark as minted
        nft.status = 'minted'
        nft.minted_at = datetime.utcnow()
        nft.unlocked = True
        nft.unlock_date = datetime.utcnow()
        
        db.session.add(nft)
        
        # Add badge to user
        user.add_badge(f"{badge_type}_{badge_level}")
        
        # Award points for minting
        user.add_points(200)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Mint NFT thành công!',
            'nft': nft.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Lỗi mint NFT: {str(e)}'}), 500

@nfts_bp.route('/badge-types', methods=['GET'])
def get_badge_types():
    """Get available badge types"""
    return jsonify({
        'badge_types': [
            {
                'value': 'explorer',
                'label': 'Nhà Thám Hiểm',
                'description': 'Dành cho người khám phá nhiều địa điểm',
                'icon': '🗺️'
            },
            {
                'value': 'foodie',
                'label': 'Tín Đồ Ẩm Thực',
                'description': 'Dành cho người yêu thích khám phá ẩm thực',
                'icon': '🍜'
            },
            {
                'value': 'photographer',
                'label': 'Nhiếp Ảnh Gia',
                'description': 'Dành cho người có nhiều ảnh đẹp',
                'icon': '📸'
            },
            {
                'value': 'writer',
                'label': 'Nhà Văn',
                'description': 'Dành cho người viết nhiều bài chất lượng',
                'icon': '✍️'
            },
            {
                'value': 'adventurer',
                'label': 'Phiêu Lưu Gia',
                'description': 'Dành cho người thích mạo hiểm',
                'icon': '⛰️'
            },
            {
                'value': 'cultural',
                'label': 'Văn Hóa',
                'description': 'Dành cho người tìm hiểu văn hóa',
                'icon': '🏛️'
            }
        ],
        'badge_levels': [
            {'value': 'bronze', 'label': 'Đồng', 'color': '#CD7F32'},
            {'value': 'silver', 'label': 'Bạc', 'color': '#C0C0C0'},
            {'value': 'gold', 'label': 'Vàng', 'color': '#FFD700'},
            {'value': 'platinum', 'label': 'Bạch Kim', 'color': '#E5E4E2'},
            {'value': 'legendary', 'label': 'Huyền Thoại', 'color': '#FF00FF'}
        ]
    }), 200

@nfts_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get NFT statistics"""
    try:
        total_minted = NFT.query.filter_by(status='minted').count()
        
        # Count by badge type
        from sqlalchemy import func
        by_badge_type = db.session.query(
            NFT.badge_type,
            func.count(NFT.id)
        ).filter_by(status='minted').group_by(NFT.badge_type).all()
        
        # Count by rarity
        by_rarity = db.session.query(
            NFT.rarity,
            func.count(NFT.id)
        ).filter_by(status='minted').group_by(NFT.rarity).all()
        
        return jsonify({
            'total_minted': total_minted,
            'by_badge_type': [{'type': t, 'count': c} for t, c in by_badge_type],
            'by_rarity': [{'rarity': r, 'count': c} for r, c in by_rarity]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Lỗi lấy thống kê: {str(e)}'}), 500
