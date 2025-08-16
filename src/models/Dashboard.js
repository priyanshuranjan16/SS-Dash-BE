import mongoose from 'mongoose'

const dashboardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metrics: {
    totalUsers: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    weeklySignups: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  charts: {
    weeklyActivity: [{
      date: String,
      teachers: Number,
      students: Number,
      signups: Number
    }],
    monthlyGrowth: [{
      month: String,
      growth: Number,
      revenue: Number
    }],
    roleDistribution: [{
      role: String,
      count: Number,
      percentage: Number
    }]
  },
  recentActivity: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index for better query performance
dashboardSchema.index({ userId: 1 })
dashboardSchema.index({ lastUpdated: -1 })

// Static method to get or create dashboard for user
dashboardSchema.statics.getOrCreate = async function(userId) {
  let dashboard = await this.findOne({ userId })
  
  if (!dashboard) {
    dashboard = new this({ userId })
    await dashboard.save()
  }
  
  return dashboard
}

// Instance method to update metrics
dashboardSchema.methods.updateMetrics = async function(newMetrics) {
  this.metrics = { ...this.metrics, ...newMetrics }
  this.lastUpdated = new Date()
  return await this.save()
}

// Instance method to add activity
dashboardSchema.methods.addActivity = async function(activity) {
  this.recentActivity.unshift(activity)
  
  // Keep only last 50 activities
  if (this.recentActivity.length > 50) {
    this.recentActivity = this.recentActivity.slice(0, 50)
  }
  
  this.lastUpdated = new Date()
  return await this.save()
}

// Static method to get dashboard stats for admin
dashboardSchema.statics.getAdminStats = async function() {
  const User = mongoose.model('User')
  
  const [
    totalUsers,
    activeUsers,
    weeklySignups,
    roleStats
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ 
      isActive: true, 
      lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    User.countDocuments({ 
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])
  ])
  
  return {
    totalUsers,
    activeUsers,
    weeklySignups,
    roleDistribution: roleStats,
    revenue: totalUsers * 10 // Mock revenue calculation
  }
}

export default mongoose.model('Dashboard', dashboardSchema)
