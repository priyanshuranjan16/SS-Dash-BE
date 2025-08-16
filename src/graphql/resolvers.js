import User from '../models/User.js'
import Dashboard from '../models/Dashboard.js'
import { generateUserToken } from '../utils/jwt.js'
import bcrypt from 'bcryptjs'

export const resolvers = {
  Query: {
    // Get current user
    me: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      return user
    },

    // Get user profile
    profile: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      const currentUser = await User.findById(user.id)
      return {
        success: true,
        user: currentUser.getPublicProfile()
      }
    },

    // Get user by ID
    user: async (parent, { id }, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      // Check permissions
      if (user.role === 'student' && user.id !== id) {
        throw new Error('Access denied')
      }
      
      const foundUser = await User.findById(id)
      if (!foundUser) {
        throw new Error('User not found')
      }
      
      return foundUser
    },

    // Get dashboard data
    dashboard: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      const dashboard = await Dashboard.getOrCreate(user.id)
      
      // Generate mock data
      const weeklyActivity = generateWeeklyActivity()
      const monthlyGrowth = generateMonthlyGrowth()
      const roleDistribution = await generateRoleDistribution()
      
      // Update dashboard
      dashboard.charts.weeklyActivity = weeklyActivity
      dashboard.charts.monthlyGrowth = monthlyGrowth
      dashboard.charts.roleDistribution = roleDistribution
      
      // Update metrics based on role
      if (user.role === 'admin') {
        const stats = await Dashboard.getAdminStats()
        dashboard.metrics = {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          weeklySignups: stats.weeklySignups,
          revenue: stats.revenue
        }
      } else {
        const totalUsers = await User.countDocuments({ isActive: true })
        dashboard.metrics = {
          totalUsers,
          activeUsers: Math.floor(totalUsers * 0.8),
          weeklySignups: Math.floor(Math.random() * 50) + 10,
          revenue: 0
        }
      }
      
      await dashboard.save()
      
      return {
        success: true,
        data: {
          metrics: dashboard.metrics,
          weeklyActivity: dashboard.charts.weeklyActivity,
          monthlyGrowth: dashboard.charts.monthlyGrowth,
          roleDistribution: dashboard.charts.roleDistribution,
          recentActivity: dashboard.recentActivity.slice(0, 10)
        }
      }
    },

    // Get admin dashboard
    adminDashboard: async (parent, args, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Admin access required')
      }
      
      const dashboard = await Dashboard.getOrCreate(user.id)
      const adminStats = await Dashboard.getAdminStats()
      
      const systemHealth = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeConnections: Math.floor(Math.random() * 100) + 50,
        databaseStatus: 'healthy'
      }
      
      return {
        success: true,
        data: {
          metrics: adminStats,
          weeklyActivity: dashboard.charts.weeklyActivity,
          monthlyGrowth: dashboard.charts.monthlyGrowth,
          roleDistribution: dashboard.charts.roleDistribution,
          recentActivity: dashboard.recentActivity.slice(0, 20),
          systemHealth
        }
      }
    },

    // Get teacher dashboard
    teacherDashboard: async (parent, args, { user }) => {
      if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
        throw new Error('Teacher access required')
      }
      
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
      
      return {
        success: true,
        data: {
          metrics: {
            totalUsers: studentCount,
            activeUsers: teachingStats.activeStudents,
            weeklySignups: Math.floor(Math.random() * 20) + 5,
            revenue: 0
          },
          weeklyActivity: dashboard.charts.weeklyActivity,
          monthlyGrowth: dashboard.charts.monthlyGrowth,
          roleDistribution: dashboard.charts.roleDistribution,
          recentActivity: dashboard.recentActivity.slice(0, 10),
          teachingStats
        }
      }
    },

    // Get all users (admin only)
    users: async (parent, args, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Admin access required')
      }
      
      const users = await User.find({ isActive: true })
      return users.map(user => user.getPublicProfile())
    },

    // Get users by role (admin only)
    usersByRole: async (parent, { role }, { user }) => {
      if (!user || user.role !== 'admin') {
        throw new Error('Admin access required')
      }
      
      const users = await User.findByRole(role)
      return users.map(user => user.getPublicProfile())
    }
  },

  Mutation: {
    // Register user
    register: async (parent, { input }) => {
      const { name, email, password, role } = input
      
      // Check if user exists
      const existingUser = await User.findByEmail(email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }
      
      // Create user
      const user = new User({
        name,
        email,
        password,
        role: role.toLowerCase()
      })
      
      await user.save()
      
      // Generate token
      const token = generateUserToken(user)
      
      return {
        success: true,
        message: 'User registered successfully',
        user: user.getPublicProfile(),
        token
      }
    },

    // Login user
    login: async (parent, { input }) => {
      const { email, password } = input
      
      // Find user
      const user = await User.findByEmail(email).select('+password')
      if (!user) {
        throw new Error('Invalid email or password')
      }
      
      // Check if active
      if (!user.isActive) {
        throw new Error('Account is deactivated')
      }
      
      // Verify password
      const isValid = await user.comparePassword(password)
      if (!isValid) {
        throw new Error('Invalid email or password')
      }
      
      // Update last active
      user.lastActive = new Date()
      await user.save()
      
      // Generate token
      const token = generateUserToken(user)
      
      return {
        success: true,
        message: 'Login successful',
        user: user.getPublicProfile(),
        token
      }
    },

    // Logout user
    logout: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      // Update last active
      const currentUser = await User.findById(user.id)
      currentUser.lastActive = new Date()
      await currentUser.save()
      
      return {
        success: true,
        message: 'Logout successful'
      }
    },

    // Update profile
    updateProfile: async (parent, { input }, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      const { name, email, bio } = input
      const currentUser = await User.findById(user.id)
      
      // Check email uniqueness
      if (email && email !== currentUser.email) {
        const existingUser = await User.findByEmail(email)
        if (existingUser) {
          throw new Error('Email is already taken')
        }
      }
      
      // Update fields
      if (name) currentUser.name = name
      if (email) currentUser.email = email
      if (bio !== undefined) currentUser.bio = bio
      
      await currentUser.save()
      
      return {
        success: true,
        message: 'Profile updated successfully',
        user: currentUser.getPublicProfile()
      }
    },

    // Change password
    changePassword: async (parent, { input }, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      const { currentPassword, newPassword } = input
      const currentUser = await User.findById(user.id).select('+password')
      
      // Verify current password
      const isValid = await currentUser.comparePassword(currentPassword)
      if (!isValid) {
        throw new Error('Current password is incorrect')
      }
      
      // Check if new password is different
      const isSame = await currentUser.comparePassword(newPassword)
      if (isSame) {
        throw new Error('New password must be different from current password')
      }
      
      // Update password
      currentUser.password = newPassword
      await currentUser.save()
      
      return {
        success: true,
        message: 'Password changed successfully'
      }
    },

    // Upload avatar
    uploadAvatar: async (parent, { input }, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      const { avatar } = input
      const currentUser = await User.findById(user.id)
      
      currentUser.avatar = avatar
      await currentUser.save()
      
      return {
        success: true,
        message: 'Avatar uploaded successfully',
        user: currentUser.getPublicProfile()
      }
    },

    // Delete avatar
    deleteAvatar: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      const currentUser = await User.findById(user.id)
      currentUser.avatar = ''
      await currentUser.save()
      
      return {
        success: true,
        message: 'Avatar removed successfully',
        user: currentUser.getPublicProfile()
      }
    },

    // Add activity
    addActivity: async (parent, { action, details }, { user }) => {
      if (!user) {
        throw new Error('Authentication required')
      }
      
      const dashboard = await Dashboard.getOrCreate(user.id)
      
      const activity = {
        user: user.id,
        action,
        details,
        timestamp: new Date()
      }
      
      await dashboard.addActivity(activity)
      
      return {
        success: true,
        message: 'Activity logged successfully'
      }
    }
  },

  // Custom scalar for JSON
  JSON: {
    __serialize(value) {
      return value
    }
  }
}

// Helper functions
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
