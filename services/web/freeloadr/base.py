import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO

ALLOWED_EXTENSIONS = set(['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'])

db = SQLAlchemy()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER')
app.config['S3_BUCKET'] = os.getenv('S3_BUCKET')
app.secret_key = os.getenv('SECRET_STRING')
app.config['CLOUDFRONT_DOMAIN'] = os.getenv('CLOUDFRONT_DOMAIN')

CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

db.init_app(app)