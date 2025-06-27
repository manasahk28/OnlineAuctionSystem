from flask_jwt_extended import JWTManager

def configure_jwt(app):
    app.config['JWT_SECRET_KEY'] = 'your-jwt-secret-key'
    JWTManager(app)
