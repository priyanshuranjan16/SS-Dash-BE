import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export function decodeToken(token) {
  try {
    return jwt.decode(token)
  } catch (error) {
    throw new Error('Invalid token format')
  }
}

export function generateUserToken(user) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  }
  
  return generateToken(payload)
}

export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header must start with Bearer')
  }
  
  return authHeader.substring(7)
}
