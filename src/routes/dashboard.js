import Dashboard from '../models/Dashboard.js'
import User from '../models/User.js'

export default async function dashboardRoutes(fastify, options) {
  // Get dashboard data
  fastify.get('/dashboard', {
    preHandler: fastify.authenticate,
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                metrics: {
                  type: 'object',
                  properties: {
                    totalUsers: { type: 'number' },
                    activeUsers: { type: 'number' },
                    weeklySignups: { type: 'number' },
                    revenue: { type: 'number' }
                  }
                },
                charts: {
                  type: 'object',
                  properties: {
                    weeklyActivity: { type: 'array' },
                    monthlyGrowth: { type: 'array' },
                    roleDistribution: { type: 'array' }
                  }
                },
                recentActivity: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = request.user
      
      // Get or create dashboard for user
      let dashboard = await Dashboard.getOrCreate(user.id)
      
      // Generate mock data for charts
      const weeklyActivity = generateWeeklyActivity()
      const monthlyGrowth = generateMonthlyGrowth()
      const roleDistribution = await generateRoleDistribution()
      
      // Update dashboard with fresh data
      dashboard.charts.weeklyActivity = weeklyActivity
      dashboard.charts.monthlyGrowth = monthlyGrowth
      dashboard.charts.roleDistribution = roleDistribution
      
      // Update metrics based on user role
      if (user.role === 'admin') {
        const stats = await Dashboard.getAdminStats()
        dashboard.metrics = {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          weeklySignups: stats.weeklySignups,
          revenue: stats.revenue
        }
      } else {
        // For non-admin users, show limited metrics
        const totalUsers = await User.countDocuments({ isActive: true })
        dashboard.metrics = {
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.8),
          weeklySignups: Math.floor(Math.random() * 50) + 10,
          revenue: 0 // Students/teachers don't see revenue
        }
      }
      
      await dashboard.save()
      
      return reply.send({
        success: true,
        data: {
          metrics: dashboard.metrics,
          charts: dashboard.charts,
          recentActivity: dashboard.recentActivity.slice(0, 10) // Last 10 activities
        }
      })
      
    } catch (error) {
      fastify.log.error('Get dashboard error:', error)
      
      return reply.code(500).send({
        error: 'Failed to get dashboard data',
        message: 'Internal server error'
      })
    }
  })
  
  // Get admin dashboard (extended data)
  fastify.get('/dashboard/admin', {
    preHandler: [fastify.authenticate, fastify.requireRole(['admin'])],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                metrics: { type: 'object' },
                charts: { type: 'object' },
                recentActivity: { type: 'array' },
                systemHealth: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = request.user
      
      // Get admin-specific dashboard data
      const dashboard = await Dashboard.getOrCreate(user.id)
      const adminStats = await Dashboard.getAdminStats()
      
      // Add system health data
      const systemHealth = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeConnections: Math.floor(Math.random() * 100) + 50,
        databaseStatus: 'healthy'
      }
      
      return reply.send({
        success: true,
        data: {
          metrics: adminStats,
          charts: dashboard.charts,
          recentActivity: dashboard.recentActivity.slice(0, 20),
          systemHealth
        }
      })
      
    } catch (error) {
      fastify.log.error('Get admin dashboard error:', error)
      
      return reply.code(500).send({
        error: 'Failed to get admin dashboard',
        message: 'Internal server error'
      })
    }
  })
  
  // Get teacher dashboard
  fastify.get('/dashboard/teacher', {
    preHandler: fastify.requireRole(['teacher', 'admin']),
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                metrics: { type: 'object' },
                charts: { type: 'object' },
                recentActivity: { type: 'array' },
                teachingStats: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = request.user
      
      // Get teacher-specific data
      const studentCount = await User.countDocuments({ 
        role: 'student', 
        isActive: true 
      })
      
      const teachingStats = {
        totalStudents: studentCount,
        activeStudents: Math.floor(studentCount * 0.85),
        coursesTaught: Math.floor(Math.random() * 10) + 5,
        averageGrade: (Math.random() * 20 + 80).toFixed(1)
      }
      
      const dashboard = await Dashboard.getOrCreate(user.id)
      
      return reply.send({
        success: true,
        data: {
          metrics: {
            totalUsers: studentCount,
            activeUsers: teachingStats.activeStudents,
            weeklySignups: Math.floor(Math.random() * 20) + 5,
            revenue: 0
          },
          charts: dashboard.charts,
          recentActivity: dashboard.recentActivity.slice(0, 10),
          teachingStats
        }
      })
      
    } catch (error) {
      fastify.log.error('Get teacher dashboard error:', error)
      
      return reply.code(500).send({
        error: 'Failed to get teacher dashboard',
        message: 'Internal server error'
      })
    }
  })
  
  // Add activity to dashboard
  fastify.post('/dashboard/activity', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string' },
          details: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { action, details } = request.body
      const user = request.user
      
      const dashboard = await Dashboard.getOrCreate(user.id)
      
      const activity = {
        user: user.id,
        action,
        details,
        timestamp: new Date()
      }
      
      await dashboard.addActivity(activity)
      
      return reply.send({
        success: true,
        message: 'Activity logged successfully'
      })
      
    } catch (error) {
      fastify.log.error('Add activity error:', error)
      
      return reply.code(500).send({
        error: 'Failed to log activity',
        message: 'Internal server error'
      })
    }
  })
}

// Helper functions to generate mock data
function generateWeeklyActivity() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(day => ({
    date: day,
    teachers: Math.floor(Math.random() * 20) + 10,
    students: Math.floor(Math.random() * 50) + 30,
    signups: Math.floor(Math.random() * 15) + 5
  }))
}

function generateMonthlyGrowth() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return months.map(month => ({
    month,
    growth: Math.floor(Math.random() * 30) + 10,
    revenue: Math.floor(Math.random() * 50000) + 20000
  }))
}

async function generateRoleDistribution() {
  const [students, teachers, admins] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    User.countDocuments({ role: 'admin', isActive: true })
  ])
  
  const total = students + teachers + admins
  
  return [
    { role: 'Students', count: students, percentage: total > 0 ? Math.round((students / total) * 100) : 0 },
    { role: 'Teachers', count: teachers, percentage: total > 0 ? Math.round((teachers / total) * 100) : 0 },
    { role: 'Admins', count: admins, percentage: total > 0 ? Math.round((admins / total) * 100) : 0 }
  ]
}
