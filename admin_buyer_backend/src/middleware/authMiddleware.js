import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  console.log('authMiddleware:', { token });

  try {
    // In a decoupled product architecture, we use the Public Key assigned to this product
    // The Universal Backend signs the token with its Private Key (RS256)
    const publicKey = process.env.PORTAL_PUBLIC_KEY?.replace(/\\n/g, '\n');
    
    if (!publicKey) {
      console.error('PORTAL_PUBLIC_KEY is missing in .env');
      return res.status(500).json({ error: 'Server configuration error: Public Key missing' });
    }

    // Verify using RS256 algorithm
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export default authMiddleware;
