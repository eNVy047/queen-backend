import jwt from 'jsonwebtoken';
import crypto from 'crypto'


class JWTUtils {
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return null;
    }
  }

  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  setTokenExpiration(hours = 24) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }
}

const jwtUtils = new JWTUtils();
export default jwtUtils;
