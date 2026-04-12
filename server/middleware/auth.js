const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-2';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || 'us-east-2_baWOWMykv';

const client = jwksClient({
  jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

const auth = (req, res, next) => {
  // Dev bypass: set DEV_AUTH=1 to accept x-dev-user headers instead of a real
  // Cognito JWT. Gated on an explicit env var rather than NODE_ENV so it can
  // be enabled for demos without a full redeploy. Always remove DEV_AUTH in
  // real production.
  if (process.env.DEV_AUTH === '1') {
    const devUser = req.header('x-dev-user');
    if (devUser) {
      try {
        const parsed = JSON.parse(devUser);
        req.user = {
          cognitoId: parsed.cognitoId || 'dev-' + (parsed.email || 'user'),
          email: parsed.email || 'dev@example.com',
          name: parsed.name || 'Dev User',
          role: parsed.role || 'student'
        };
        return next();
      } catch {
        return res.status(400).json({ message: 'Invalid x-dev-user header' });
      }
    }
  }

  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }

  jwt.verify(token, getKey, {
    issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    req.user = {
      cognitoId: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.email,
      role: decoded['custom:role'] || 'student'
    };
    next();
  });
};

module.exports = auth;
