from datetime import datetime
import json
from . import db

class NFT(db.Model):
    __tablename__ = 'nfts'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # NFT metadata
    token_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    contract_address = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Badge information
    badge_type = db.Column(db.Enum('explorer', 'foodie', 'photographer', 'writer', 'adventurer', 'cultural', 'special'), nullable=False)
    badge_level = db.Column(db.Enum('bronze', 'silver', 'gold', 'platinum', 'legendary'), default='bronze')
    rarity = db.Column(db.Enum('common', 'uncommon', 'rare', 'epic', 'legendary'), default='common')
    
    # Media and assets
    image_url = db.Column(db.String(255), nullable=False)
    animation_url = db.Column(db.String(255))  # For animated NFTs
    metadata_url = db.Column(db.String(255))   # IPFS or server URL
    
    # Achievement criteria
    achievement_criteria = db.Column(db.Text)  # JSON describing how to earn this NFT
    points_required = db.Column(db.Integer, default=0)
    locations_required = db.Column(db.Text)    # JSON array of location IDs
    posts_required = db.Column(db.Integer, default=0)
    
    # Blockchain data
    transaction_hash = db.Column(db.String(100))
    block_number = db.Column(db.Integer)
    gas_used = db.Column(db.Integer)
    
    # Status and availability
    status = db.Column(db.Enum('minted', 'pending', 'failed', 'burned'), default='pending')
    transferable = db.Column(db.Boolean, default=True)
    tradeable = db.Column(db.Boolean, default=False)
    
    # Unlock conditions
    unlocked = db.Column(db.Boolean, default=False)
    unlock_date = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    minted_at = db.Column(db.DateTime)
    
    # Foreign Keys
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    def unlock_for_user(self):
        """Unlock NFT for the user"""
        self.unlocked = True
        self.unlock_date = datetime.utcnow()
    
    def mint_nft(self, transaction_hash, block_number=None, gas_used=None):
        """Mark NFT as minted on blockchain"""
        self.status = 'minted'
        self.minted_at = datetime.utcnow()
        self.transaction_hash = transaction_hash
        if block_number:
            self.block_number = block_number
        if gas_used:
            self.gas_used = gas_used
    
    def get_achievement_criteria(self):
        """Get achievement criteria as dict"""
        if self.achievement_criteria:
            return json.loads(self.achievement_criteria)
        return {}
    
    def set_achievement_criteria(self, criteria_dict):
        """Set achievement criteria"""
        self.achievement_criteria = json.dumps(criteria_dict)
    
    def get_required_locations(self):
        """Get required locations as list"""
        if self.locations_required:
            return json.loads(self.locations_required)
        return []
    
    def to_dict(self):
        """Convert NFT to dictionary"""
        return {
            'id': self.id,
            'token_id': self.token_id,
            'contract_address': self.contract_address,
            'name': self.name,
            'description': self.description,
            'badge_type': self.badge_type,
            'badge_level': self.badge_level,
            'rarity': self.rarity,
            'image_url': self.image_url,
            'animation_url': self.animation_url,
            'metadata_url': self.metadata_url,
            'achievement_criteria': self.get_achievement_criteria(),
            'points_required': self.points_required,
            'locations_required': self.get_required_locations(),
            'posts_required': self.posts_required,
            'blockchain': {
                'transaction_hash': self.transaction_hash,
                'block_number': self.block_number,
                'gas_used': self.gas_used
            },
            'status': self.status,
            'transferable': self.transferable,
            'tradeable': self.tradeable,
            'unlocked': self.unlocked,
            'unlock_date': self.unlock_date.isoformat() if self.unlock_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'minted_at': self.minted_at.isoformat() if self.minted_at else None,
            'owner_id': self.owner_id
        }
    
    def __repr__(self):
        return f'<NFT {self.name} - {self.token_id}>'