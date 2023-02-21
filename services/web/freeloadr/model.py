from .base import db, app
from flask_marshmallow import Marshmallow
from marshmallow import fields, EXCLUDE
import bcrypt
from sqlalchemy.sql import func, cast
from sqlalchemy.dialects import postgresql
from sqlalchemy import text
from sqlalchemy.sql.operators import op
from geoalchemy2 import Geography

ma = Marshmallow(app)

def create_tsvector(*args):
    field, weight = args[0]
    exp = func.setweight(func.to_tsvector('english', func.coalesce(field, '')), weight)
    for field, weight in args[1:]:
        exp = op(exp, '||', func.setweight(func.to_tsvector('english', func.coalesce(field, '')), weight))
    return exp

class Person(db.Model):
    __tablename__ = "person"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.Text, unique=True, nullable=False)
    push_tokens = db.Column(db.String)
    password = db.Column(db.Text, nullable=False)
    name = db.Column(db.Text, nullable=False)
    address = db.Column(db.String, nullable=False)
    lat = db.Column(db.Numeric, nullable=False)
    lng = db.Column(db.Numeric, nullable=False)
    location = db.Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    listings = db.relationship("Listing", back_populates="owner", cascade="all, delete")
    conversations = db.relationship("Conversation", back_populates="asker")

    def __init__(self, email, password, name, address, lat, lng):
        self.email = email
        self.password = password
        self.name = name
        self.address = address
        self.lat = lat
        self.lng = lng
        self.location = func.ST_GeographyFromText(f'POINT({lat} {lng})')

    def verify_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

class PersonSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer()
    email = fields.String()
    name = fields.String()
    address = fields.String()
    lat = fields.Number()
    lng = fields.Number()

class Listing(db.Model):
    __tablename__ = "listing"
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("person.id"))
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    owner = db.relationship("Person", back_populates="listings")
    conversations = db.relationship("Conversation", back_populates="listing")

    __ts_vector__ = create_tsvector((title, 'A'), (description, 'B'))

    __table_args__ = (
        db.Index(
            'idx_listing_fts',
            __ts_vector__,
            postgresql_using="gin"
        ),
    )

    def __init__(self, owner_id, title, description):
        self.owner_id = owner_id
        self.title = title
        self.description = description

class ListingSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer()
    title = fields.String()
    description = fields.String()
    owner = fields.Nested(PersonSchema)

class Conversation(db.Model):
    __tablename__ = "conversation"
    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listing.id"), nullable=False)
    listing = db.relationship("Listing", back_populates="conversations")
    asker_id = db.Column(db.Integer, db.ForeignKey("person.id"), nullable=False)
    asker = db.relationship("Person", back_populates="conversations")
    messages = db.relationship("Message", back_populates="conversation", cascade="all, delete")
    last_modified = db.Column(db.DateTime)
    last_message_text = db.Column(db.Text)

    def __init__(self, listing_id, asker_id):
        self.listing_id = listing_id
        self.asker_id = asker_id
    
class ConversationSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer()
    listing = fields.Nested(ListingSchema)
    asker = fields.Nested(PersonSchema)
    last_modified = fields.DateTime()
    last_message_text = fields.String()

class Message(db.Model):
    __tablename__ = "message"
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("person.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, nullable=False)
    conversation = db.relationship("Conversation", back_populates="messages")

    def __init__(self, conversation_id, sender_id, content, sent_at):
        self.conversation_id = conversation_id
        self.sender_id = sender_id
        self.content = content
        self.sent_at = sent_at

class MessageSchema(ma.Schema):
    class Meta:
        unknown = EXCLUDE

    id = fields.Integer()
    content = fields.String()
    sent_at = fields.DateTime()
    sender_id = fields.Integer()

person_schema = PersonSchema()
listing_schema = ListingSchema()
listings_schema = ListingSchema(many=True)
conversation_schema = ConversationSchema()
conversations_schema = ConversationSchema(many=True)
message_schema = MessageSchema()
messages_schema = MessageSchema(many=True)