import jwt from 'jsonwebtoken';
import { getPublicKey } from '../config/publicKey.js';

/**
 * Verifies the RS256 appAccessToken issued by Universal Master.
 * Sets req.user = { global_user_id, email, username, ... }
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 'NO_TOKEN', error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const publicKey = await getPublicKey();

    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

    req.user = {
      global_user_id:   decoded.global_user_id,
      global_company_id:decoded.global_company_id,
      email:            decoded.email,
      username:         decoded.username,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 'TOKEN_EXPIRED', error: 'Token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ code: 'INVALID_TOKEN', error: 'Invalid token' });
    }
    return res.status(500).json({ error: err.message });
  }
};

export default verifyToken;
