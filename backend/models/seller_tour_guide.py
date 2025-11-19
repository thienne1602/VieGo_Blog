from datetime import datetime
from . import db


class SellerTourGuide(db.Model):
    """Model to manage seller's list of available tour guides"""
    __tablename__ = 'seller_tour_guides'

    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    tour_guide_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    seller = db.relationship('User', foreign_keys=[seller_id], backref='available_tour_guides', lazy='joined')
    tour_guide = db.relationship('User', foreign_keys=[tour_guide_id], backref='sellers_using_me', lazy='joined')

    # Unique constraint: one seller can only have one record per tour guide
    __table_args__ = (db.UniqueConstraint('seller_id', 'tour_guide_id', name='unique_seller_tour_guide'),)

    def to_dict(self, include_guide=True):
        data = {
            'id': self.id,
            'seller_id': self.seller_id,
            'tour_guide_id': self.tour_guide_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_guide and self.tour_guide:
            data['tour_guide'] = {
                'id': self.tour_guide.id,
                'username': self.tour_guide.username,
                'full_name': self.tour_guide.full_name,
                'email': self.tour_guide.email,
                'phone': getattr(self.tour_guide, 'phone', None),
                'avatar_url': self.tour_guide.avatar_url,
                'bio': self.tour_guide.bio
            }
            
        return data

    def __repr__(self):
        return f'<SellerTourGuide {self.id} seller={self.seller_id} guide={self.tour_guide_id}>'

