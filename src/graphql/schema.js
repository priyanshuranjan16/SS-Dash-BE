import { gql } from 'graphql-tag'

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
    bio: String
    avatar: String
    joinDate: String!
    lastActive: String!
    isActive: Boolean!
  }

  enum UserRole {
    STUDENT
    TEACHER
    ADMIN
  }

  type DashboardMetrics {
    totalUsers: Int!
    activeUsers: Int!
    weeklySignups: Int!
    revenue: Float!
  }

  type WeeklyActivity {
    date: String!
    teachers: Int!
    students: Int!
    signups: Int!
  }

  type MonthlyGrowth {
    month: String!
    growth: Int!
    revenue: Float!
  }

  type RoleDistribution {
    role: String!
    count: Int!
    percentage: Int!
  }

  type RecentActivity {
    id: ID!
    user: User!
    action: String!
    timestamp: String!
    details: JSON
  }

  type DashboardData {
    metrics: DashboardMetrics!
    weeklyActivity: [WeeklyActivity!]!
    monthlyGrowth: [MonthlyGrowth!]!
    roleDistribution: [RoleDistribution!]!
    recentActivity: [RecentActivity!]!
  }

  type AdminDashboardData {
    metrics: DashboardMetrics!
    weeklyActivity: [WeeklyActivity!]!
    monthlyGrowth: [MonthlyGrowth!]!
    roleDistribution: [RoleDistribution!]!
    recentActivity: [RecentActivity!]!
    systemHealth: SystemHealth!
  }

  type SystemHealth {
    uptime: Float!
    memoryUsage: MemoryUsage!
    activeConnections: Int!
    databaseStatus: String!
  }

  type MemoryUsage {
    rss: Float!
    heapTotal: Float!
    heapUsed: Float!
    external: Float!
  }

  type TeacherDashboardData {
    metrics: DashboardMetrics!
    weeklyActivity: [WeeklyActivity!]!
    monthlyGrowth: [MonthlyGrowth!]!
    roleDistribution: [RoleDistribution!]!
    recentActivity: [RecentActivity!]!
    teachingStats: TeachingStats!
  }

  type TeachingStats {
    totalStudents: Int!
    activeStudents: Int!
    coursesTaught: Int!
    averageGrade: String!
  }

  type AuthResponse {
    success: Boolean!
    message: String!
    user: User
    token: String
  }

  type ProfileResponse {
    success: Boolean!
    message: String
    user: User
  }

  type DashboardResponse {
    success: Boolean!
    data: DashboardData
  }

  type AdminDashboardResponse {
    success: Boolean!
    data: AdminDashboardData
  }

  type TeacherDashboardResponse {
    success: Boolean!
    data: TeacherDashboardData
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    role: UserRole = STUDENT
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    name: String
    email: String
    bio: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  input UploadAvatarInput {
    avatar: String!
  }

  type Query {
    # Authentication
    me: User
    
    # Profile
    profile: ProfileResponse!
    user(id: ID!): User
    
    # Dashboard
    dashboard: DashboardResponse!
    adminDashboard: AdminDashboardResponse!
    teacherDashboard: TeacherDashboardData!
    
    # Users (Admin only)
    users: [User!]!
    usersByRole(role: UserRole!): [User!]!
  }

  type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    logout: ProfileResponse!
    
    # Profile
    updateProfile(input: UpdateProfileInput!): ProfileResponse!
    changePassword(input: ChangePasswordInput!): ProfileResponse!
    uploadAvatar(input: UploadAvatarInput!): ProfileResponse!
    deleteAvatar: ProfileResponse!
    
    # Dashboard
    addActivity(action: String!, details: JSON): ProfileResponse!
  }

  scalar JSON
}

type Subscription {
  _: Boolean
}
`
