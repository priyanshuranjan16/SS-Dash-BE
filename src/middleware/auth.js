import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js'
import User from '../models/User.js'

export async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization
    
    if (!authHeader) {
      return reply.code(401).send({
        error: 'Authentication required',
        message: 'No authorization header provided'
      })
    }
    
    const token = extractTokenFromHeader(authHeader)
    const decoded = verifyToken(token)
    
    // Find user and attach to request
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user || !user.isActive) {
      return reply.code(401).send({
        error: 'Authentication failed',
        message: 'User not found or inactive'
      })
    }
    
    // Update last active
    user.lastActive = new Date()
    await user.save()
    
    request.user = user
    request.token = decoded
    
  } catch (error) {
    return reply.code(401).send({
      error: 'Authentication failed',
      message: error.message
    })
  }
}

export function requireRole(roles) {
  return async function(request, reply) {
    await authenticate(request, reply)
    
    if (reply.sent) return
    
    if (!Array.isArray(roles)) {
      roles = [roles]
    }
    
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Access denied',
        message: `Required role: ${roles.join(' or ')}`
      })
    }
  }
}

export function requirePermission(permission) {
  return async function(request, reply) {
    await authenticate(request, reply)
    
    if (reply.sent) return
    
    const userPermissions = getUserPermissions(request.user.role)
    
    if (!userPermissions.includes(permission)) {
      return reply.code(403).send({
        error: 'Access denied',
        message: `Required permission: ${permission}`
      })
    }
  }
}

function getUserPermissions(role) {
  const permissions = {
    student: [
      'view:dashboard',
      'view:own-courses',
      'submit:assignments',
      'view:own-grades',
      'update:own-profile'
    ],
    teacher: [
      'view:dashboard',
      'view:own-courses',
      'create:courses',
      'edit:own-courses',
      'grade:assignments',
      'view:students',
      'manage:own-students',
      'update:own-profile'
    ],
    admin: [
      'view:dashboard',
      'view:all-courses',
      'create:courses',
      'edit:all-courses',
      'delete:courses',
      'view:all-users',
      'manage:users',
      'manage:roles',
      'view:analytics',
      'manage:system',
      'update:own-profile'
    ]
  }
  
  return permissions[role] || []
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(request, reply) {
  try {
    const authHeader = request.headers.authorization
    
    if (!authHeader) {
      return // Continue without authentication
    }
    
    const token = extractTokenFromHeader(authHeader)
    const decoded = verifyToken(token)
    
    const user = await User.findById(decoded.id).select('-password')
    
    if (user && user.isActive) {
      user.lastActive = new Date()
      await user.save()
      
      request.user = user
      request.token = decoded
    }
    
  } catch (error) {
    // Continue without authentication on error
    console.log('Optional auth error:', error.message)
  }
}
