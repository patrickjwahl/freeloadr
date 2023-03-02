import os
from urllib.error import HTTPError
from flask import request, jsonify
from werkzeug.utils import secure_filename
import bcrypt
from functools import wraps
import jwt
from datetime import datetime, timedelta
from sqlalchemy.sql import func
from sqlalchemy import or_, and_
import json
import traceback
from PIL import Image, ImageOps
from flask_socketio import emit

from .s3_functions import upload_file, get_presigned_urls, delete_object, get_urls

from .base import app, db, socketio
from .model import Conversation, Message, Person, Listing, \
        person_schema, listing_schema, conversation_schema, conversations_schema, \
        listings_schema, message_schema, messages_schema

client_sid_to_user = {}
client_user_to_sid = {}

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # jwt is passed in the request header
        if 'Authorization' in request.headers:
            header_spl = request.headers['Authorization'].split()
            if len(header_spl) > 1:
                token = header_spl[1]
        # return 401 if token is not passed
        if not token:
            return jsonify({'code' : 'MISSING_TOKEN'}), 401
  
        try:
            # decoding the payload to fetch the stored details
            data = jwt.decode(token, app.secret_key, algorithms=["HS256"])
            current_user = Person.query \
                .filter_by(id = data['id']) \
                .first()
        except Exception:
            traceback.print_exc()
            return jsonify({
                'code' : 'INVALID_TOKEN'
            }), 401
        # returns the current logged in users contex to the routes
        return  f(current_user, *args, **kwargs)
  
    return decorated

@app.route('/user', methods=['POST'])
def sign_up():

    request_data = request.get_json()

    email = request_data['email']
    password = request_data['password']
    name = request_data['name']
    address = request_data['address']
    lat = request_data['lat']
    lng = request_data['lng']

    user = Person.query.filter_by(email=email).first()
    if user:
        return {"code": "USER_EXISTS"}

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = Person(email=email,
        password=pw_hash,
        name=name,
        address=address,
        lat=lat,
        lng=lng)

    db.session.add(user)
    db.session.commit()

    token = jwt.encode({
            'id': user.id,
            'exp' : datetime.utcnow() + timedelta(days = 30),
            'iat': datetime.utcnow()
        }, app.secret_key, algorithm="HS256")

    return {'code': 'OK',
        'access_token': token,
        'user': person_schema.dump(user)}

@app.route('/conversations/<id>', methods=['GET'])
@login_required
def get_conversation(current_user, id):
    id = int(id)
    conversation = Conversation.query.filter_by(id=id).first()
    if not conversation:
        return {'code': 'NO_CONVERSATION_EXISTS'}
    
    if current_user.id not in (conversation.listing.owner_id, conversation.asker_id):
        return {'code': 'NOT_YOUR_CONVERSATION'}

    page = int(request.args.get('page')) if request.args.get('page') else 1

    messages = Message.query.filter_by(conversation_id=id).order_by(Message.sent_at.desc())

    image = ''
    urls = get_urls(app.config['S3_BUCKET'], conversation.listing_id, app.config['CLOUDFRONT_DOMAIN'])
    if len(urls) > 0:
        image = urls[0]
    else:
        image = app.config['CLOUDFRONT_DOMAIN']

    return {'code': 'OK', 'conversation': conversation_schema.dump(conversation), 'messages': messages_schema.dump(messages), 'image': image}

@app.route('/conversations', methods=['GET'])
@login_required
def get_conversations(current_user):
    conversations = Conversation.query \
                    .join(Listing) \
                    .filter(or_(Listing.owner_id == current_user.id, Conversation.asker_id == current_user.id)) \
                    .order_by(Conversation.last_modified.desc()).all()

    images = []
    for conversation in conversations:
        urls = get_urls(app.config['S3_BUCKET'], conversation.listing_id, app.config['CLOUDFRONT_DOMAIN'])
        if len(urls) > 0:
            images.append(urls[0])
        else:
            images.append(app.config['CLOUDFRONT_DOMAIN'])
    
    return {'code': 'OK', 'conversations': conversations_schema.dump(conversations), 'images': images}


@app.route('/conversations/unread', methods=['GET'])
@login_required
def get_unread_conversations(current_user):
    conversations = Conversation.query \
                    .join(Listing) \
                    .filter(or_(Listing.owner_id == current_user.id, Conversation.asker_id == current_user.id)) \
                    .order_by(Conversation.last_modified.desc()).all()

    conversation_ids = list(map(lambda c: c.id, conversations))
    unread_messages = Message.query \
        .join(Conversation) \
        .filter(and_(Message.read == False, Conversation.id.in_(conversation_ids), Message.sender_id != current_user.id)) \
        .all()
    
    unread_conversation_ids = set(map(lambda m: m.conversation_id, unread_messages))
    unread_conversations = list(filter(lambda c: c.id in unread_conversation_ids, conversations))

    return {'code': 'OK', 'conversations': conversations_schema.dump(unread_conversations)}

@app.route('/conversation/mark/<id>', methods=['GET'])
@login_required
def mark_as_read(current_user, id):
    conversation = Conversation.query.filter_by(id=id).first()
    if not conversation:
        return {'code': 'NO_CONVERSATION_EXISTS'}
    
    if current_user.id not in (conversation.listing.owner_id, conversation.asker_id):
        return {'code': 'NOT_YOUR_CONVERSATION'}

    db.session.query(Message).filter(Message.conversation_id == id).update({Message.read: True}, synchronize_session=False)
    db.session.commit()

    return {'code': 'OK'}


@app.route('/message', methods=['POST'])
@login_required
def send_message(current_user):

    request_data = request.get_json()

    listing_id = int(request_data['listingId'])
    listing = Listing.query.filter_by(id=listing_id).first()
    if not listing:
        return {'code': 'NO_LISTING'}
    asker_id = int(request_data['askerId'])

    if current_user.id not in (asker_id, listing.owner_id):
        return {'code': 'NOT_YOUR_CONVERSATION'}

    conversation = Conversation.query.filter_by(listing_id=listing_id, asker_id=asker_id).first()
    if not conversation:
        conversation = Conversation(
            listing_id=listing_id,
            asker_id=asker_id)

        db.session.add(conversation)
        db.session.commit()
    
    sender_id = current_user.id
    content = request_data['content']
    sent_at = request_data['sentAt']

    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=content,
        sent_at=sent_at,
        read=False
    )

    db.session.add(message)
    db.session.commit()

    conversation.last_modified = sent_at
    conversation.last_message_text = content
    db.session.commit()

    recipient = listing.owner_id if current_user.id == asker_id else asker_id

    if recipient in client_user_to_sid:
        socketio.emit('message', {'content': content, 'sent_at': sent_at, 'conversation_id': message.conversation_id, 'sender_id': message.sender_id, 'id': message.id}, room=client_user_to_sid[recipient])

    return {'code': 'OK', 'message': message_schema.dump(message), 'conversation': conversation_schema.dump(conversation)}


@app.route('/user/edit', methods=['POST', 'DELETE'])
@login_required
def update_user(current_user):
    if request.method == 'POST':

        request_data = request.get_json()

        if 'email' in request_data:
            person = Person.query.filter_by(email=request_data['email']).first()
            if person and request_data['email'] != current_user.email:
                return {'code': 'EMAIL_IN_USE'}

        current_user.email = request_data['email'] if 'email' in request_data else current_user.email
        current_user.name = request_data['name'] if 'name' in request_data else current_user.name
        current_user.address = request_data['address'] if 'address' in request_data else current_user.address
        current_user.lat = request_data['lat'] if 'lat' in request_data else current_user.lat
        current_user.lng = request_data['lng'] if 'lng' in request_data else current_user.lng
        current_user.location = func.ST_GeographyFromText(f'POINT({request_data["lat"]} {request_data["lng"]})') if 'address' in request_data else current_user.location

        if 'password' in request_data:
            pw_hash = bcrypt.hashpw(request_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            current_user.password = pw_hash

        db.session.commit()

        return {'code': 'OK'}

    else:
        user_id = current_user.id
        Listing.query.filter_by(owner=user_id).delete()
        db.session.delete(current_user)
        db.session.commit()

        return {'code': 'OK'}

@app.route('/login', methods=['POST'])
def log_in():

    request_data = request.get_json()

    email = request_data['email']
    password = request_data['password']
    user = Person.query.filter_by(email=email).first()

    if not user:
        return {"code": "NO_USER_EXISTS"}

    if not user.verify_password(password):
        return {"code": "INCORRECT_PASSWORD"}

    token = jwt.encode({
            'id': user.id,
            'exp' : datetime.utcnow() + timedelta(days = 365),
            'iat': datetime.utcnow()
        }, app.secret_key, algorithm="HS256")

    return {'code': 'OK',
        'access_token': token,
        'user': person_schema.dump(user)}

@app.route('/user/addPushToken', methods=['POST'])
@login_required
def add_push_token(current_user):
    push_tokens = current_user.push_tokens
    token_to_add = request.form['token']
    if not push_tokens:
        current_user.push_tokens = json.dumps([token_to_add])
    else:
        current_user.push_tokens = json.dumps(list(set(json.loads(current_user.push_tokens).append(token_to_add))))

    db.session.commit()

    return {'code': 'OK'}

def get_search_results(query, radius, center):

    radius_in_meters = radius * 1609

    text_search_clause = True
    if query:
        query_term = ' | '.join(query.split(' '))
        text_search_clause = Listing.__ts_vector__.match(query_term, postgres_sql_regconfig='english')

    location_clause = True
    if center is not None:
        location_clause = func.ST_Distance(Person.location, center) < radius_in_meters

    listings = Listing.query.join(Person).filter(and_(text_search_clause, location_clause))

    image_urls = []
    for listing in listings:
        image_urls.append(get_urls(app.config['S3_BUCKET'], listing.id, app.config['CLOUDFRONT_DOMAIN']))

    return listings, image_urls

@app.route('/search', methods=['GET'])
@login_required
def search(current_user):

    search_term = request.args.get('search', '')
    radius = int(request.args.get('radius', 50))
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    page = request.args.get('page')

    center = None

    if not lat or not lng:
        center = current_user.location
    else:
        center = func.ST_GeographyFromText(f'POINT({lat} {lng})')

    if page:
        page = int(page)
    else:
        page = 1

    listings, images = get_search_results(search_term, radius, center)

    return {'code': 'OK', 'listings': listings_schema.dump(listings), 'images': images}

@app.route('/search/guest', methods=['GET'])
def guest_search():
    search_term = request.args.get('search')
    radius = int(request.args.get('radius', 50))
    lat = request.args.get('lat')
    lng = request.args.get('lng')

    if not lat or not lng:
        center = None
    else:
        center = func.ST_GeographyFromText(f'POINT({lat} {lng})')

    listings, images = get_search_results(search_term, radius, center)

    return {'code': 'OK', 'listings': listings_schema.dump(listings), 'images': images}

@app.route('/listings/<user_id>', methods=['GET'])
def listings(user_id):
    owner = Person.query.filter_by(id=user_id).first()

    if not owner:
        return {'code': 'NO_USER_EXISTS'}

    image_urls = []
    listings = Listing.query.filter_by(owner_id=user_id)
    for listing in listings:
        image_urls.append(get_presigned_urls(app.config['S3_BUCKET'], listing.id))

    return {'code': 'OK',
        'owner': person_schema.dump(owner),
        'listings': listings_schema.dump(listings),
        'images': image_urls}

@app.route('/listing/<listing_id>', methods=['GET'])
def listing(listing_id):
    listing = Listing.query.filter_by(id=listing_id).first()

    if not listing:
        return {'code': 'NO_LISTING_EXISTS'}

    image_urls = get_presigned_urls(app.config['S3_BUCKET'], listing.id)
    
    owner = Person.query.filter_by(id=listing.owner_id).first()
    return {'code': 'OK',
        'owner': person_schema.dump(owner),
        'listing': listing_schema.dump(listing),
        'images': image_urls}

def compress_and_upload_file(listing, file):
    if file.filename:
        filename = secure_filename(file.filename)
        dir = os.path.join(app.config['UPLOAD_FOLDER'])
        if not os.path.exists(dir):
            os.makedirs(dir)
        filepath = os.path.join(dir, filename)
        file.save(filepath)

        image = Image.open(filepath)

        image = ImageOps.exif_transpose(image)

        size = image.size
        aspect_ratio = float(size[0]) / size[1]
        new_dimensions = None
        if aspect_ratio > 1:
            new_dimensions = 500, int(500 / aspect_ratio)
        else:
            new_dimensions = int(500 * aspect_ratio), 500

        image = image.resize(new_dimensions, Image.ANTIALIAS)
        image.save(filepath, optimize=True, quality=95)

        upload_file(filepath, app.config['S3_BUCKET'], f'{str(listing.id)}/{filename}')
        os.remove(filepath)

@app.route('/listing/<listing_id>', methods=['POST', 'DELETE'])
@login_required
def update_listing(current_user, listing_id):
    listing = Listing.query.filter_by(id=listing_id).first()

    if not listing:
        return {'code': 'NO_LISTING_EXISTS'}

    if listing.owner_id != current_user.id:
        return {'code': 'NOT_YOUR_LISTING'}

    if request.method == 'POST':
        listing.title = request.form['title']
        listing.description = request.form['description']

        db.session.commit()

        urls_to_delete = request.args.getlist('delete')
        for url in urls_to_delete:

            image_with_param = url.split('/')[-1]
            image_filename = '?'.join(image_with_param.split('?')[:-1])

            delete_object(app.config['S3_BUCKET'], listing_id, image_filename)

        for file_key in request.files:
            file = request.files[file_key]
            compress_and_upload_file(listing, file)

        return {'code': 'OK'}

    elif request.method == 'DELETE':
        db.session.delete(listing)
        db.session.commit()
        return {'code': 'OK'}

    else:
        return {'code': 'UNSUPPORTED METHOD'}


@app.route('/listing', methods=['POST'])
@login_required
def create_listing(current_user):

    owner_id = current_user.id
    title = request.form['title']
    description = request.form['description']

    listing = Listing(owner_id=owner_id,
        title=title,
        description=description)

    db.session.add(listing)
    db.session.commit()

    for file_key in request.files:
        file = request.files[file_key]
        compress_and_upload_file(listing, file)

    return {'code': 'OK', 'listing_id': listing.id};

@socketio.on('connect')
def connect_socket():
    token = None
    # jwt is passed in the request header
    if 'Authorization' in request.headers:
        header_spl = request.headers['Authorization'].split()
        if len(header_spl) > 1:
            token = header_spl[1]
    # return 401 if token is not passed
    if not token:
        return False

    try:
        # decoding the payload to fetch the stored details
        data = jwt.decode(token, app.secret_key, algorithms=["HS256"])

        client_sid_to_user[request.sid] = data['id']
        client_user_to_sid[data['id']] = request.sid
    except Exception:
        traceback.print_exc()
        return False

    print(client_sid_to_user)
    print(client_user_to_sid)

@socketio.on('disconnect')
def disconnect_socket():
    user_id = client_sid_to_user[request.sid]
    del client_sid_to_user[request.sid]
    del client_user_to_sid[user_id]

    print(client_sid_to_user)
    print(client_user_to_sid)
    
    

@app.route('/')
def hello():
    #socketio.emit('hello', {'data': 'world'})
    return {'hello': 'world!'}

if __name__ == '__main__':
    print('we fuckin in this')
    socketio.run(app, host='0.0.0.0')
    