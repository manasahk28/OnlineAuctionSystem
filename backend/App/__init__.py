from flask import Flask
from App.routes.auth import auth_bp
from App.routes.protected_routes import protected_bp
from App.utils.jwt_token import configure_jwt
from App.utils.email_sender import configure_mail

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key'

    configure_jwt(app)
    configure_mail(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(protected_bp, url_prefix='/api/protected')

    return app
