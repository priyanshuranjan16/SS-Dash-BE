import User from '../models/User.js'
import bcrypt from 'bcryptjs'

// Validation schemas
const updateProfileSchema = {
  type: 'object',
  properties: {
    name: { 
      type: 'string', 
      minLength: 2, 
      maxLength: 50,
      description: 'User name'
    },
    email: { 
      type: 'string', 
      format: 'email',
      description: 'User email'
    },
    bio: { 
      type: 'string', 
      maxLength: 500,
      description: 'User bio'
    }
  }
}

const changePasswordSchema = {
  type: 'object',
  required: ['currentPassword', 'newPassword'],
  properties: {
    currentPassword: { 
      type: 'string',
      description: 'Current password'
    },
    newPassword: { 
      type: 'string', 
      minLength: 8,
      description: 'New password'
    }
  }
}

export default async function profileRoutes(fastify, options) {
  // Get user profile
  fastify.get('/profile', {
    preHandler: fastify.authenticate,
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                bio: { type: 'string' },
                avatar: { type: 'string' },
                joinDate: { type: 'string' },
                lastActive: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = request.user
      
      return reply.send({
        success: true,
        user: user.getPublicProfile()
      })
      
    } catch (error) {
      fastify.log.error('Get profile error:', error)
      
      return reply.code(500).send({
        error: 'Failed to get profile',
        message: 'Internal server error'
      })
    }
  })
  
  // Update user profile
  fastify.put('/profile', {
    preHandler: fastify.authenticate,
    schema: {
      body: updateProfileSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                bio: { type: 'string' },
                avatar: { type: 'string' },
                joinDate: { type: 'string' },
                lastActive: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { name, email, bio } = request.body
      const user = request.user
      
      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email)
        if (existingUser) {
          return reply.code(400).send({
            error: 'Update failed',
            message: 'Email is already taken'
          })
        }
      }
      
      // Update user fields
      if (name) user.name = name
      if (email) user.email = email
      if (bio !== undefined) user.bio = bio
      
      await user.save()
      
      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        user: user.getPublicProfile()
      })
      
    } catch (error) {
      fastify.log.error('Update profile error:', error)
      
      if (error.code === 11000) {
        return reply.code(400).send({
          error: 'Update failed',
          message: 'Email is already taken'
        })
      }
      
      return reply.code(500).send({
        error: 'Failed to update profile',
        message: 'Internal server error'
      })
    }
  })
  
  // Change password
  fastify.put('/profile/password', {
    preHandler: fastify.authenticate,
    schema: {
      body: changePasswordSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body
      const user = await User.findById(request.user.id).select('+password')
      
      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword)
      if (!isCurrentPasswordValid) {
        return reply.code(400).send({
          error: 'Password change failed',
          message: 'Current password is incorrect'
        })
      }
      
      // Check if new password is different
      const isNewPasswordSame = await user.comparePassword(newPassword)
      if (isNewPasswordSame) {
        return reply.code(400).send({
          error: 'Password change failed',
          message: 'New password must be different from current password'
        })
      }
      
      // Update password
      user.password = newPassword
      await user.save()
      
      return reply.send({
        success: true,
        message: 'Password changed successfully'
      })
      
    } catch (error) {
      fastify.log.error('Change password error:', error)
      
      return reply.code(500).send({
        error: 'Failed to change password',
        message: 'Internal server error'
      })
    }
  })
  
  // Upload avatar
  fastify.post('/profile/avatar', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const user = request.user
      
      // Handle file upload (you'll need to configure multer)
      // For now, we'll accept a base64 image
      const { avatar } = request.body
      
      if (!avatar) {
        return reply.code(400).send({
          error: 'Upload failed',
          message: 'Avatar data is required'
        })
      }
      
      // Update user avatar
      user.avatar = avatar
      await user.save()
      
      return reply.send({
        success: true,
        message: 'Avatar uploaded successfully',
        avatar: user.avatar
      })
      
    } catch (error) {
      fastify.log.error('Upload avatar error:', error)
      
      return reply.code(500).send({
        error: 'Failed to upload avatar',
        message: 'Internal server error'
      })
    }
  })
  
  // Delete avatar
  fastify.delete('/profile/avatar', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const user = request.user
      
      // Clear avatar
      user.avatar = ''
      await user.save()
      
      return reply.send({
        success: true,
        message: 'Avatar removed successfully'
      })
      
    } catch (error) {
      fastify.log.error('Delete avatar error:', error)
      
      return reply.code(500).send({
        error: 'Failed to remove avatar',
        message: 'Internal server error'
      })
    }
  })
  
  // Get user by ID (for admin/teacher access)
  fastify.get('/users/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const requestingUser = request.user
      
      // Check permissions
      if (requestingUser.role === 'student' && requestingUser.id !== id) {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'You can only view your own profile'
        })
      }
      
      const user = await User.findById(id)
      if (!user) {
        return reply.code(404).send({
          error: 'User not found',
          message: 'User does not exist'
        })
      }
      
      return reply.send({
        success: true,
        user: user.getPublicProfile()
      })
      
    } catch (error) {
      fastify.log.error('Get user by ID error:', error)
      
      return reply.code(500).send({
        error: 'Failed to get user',
        message: 'Internal server error'
      })
    }
  })
}
