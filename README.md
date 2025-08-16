# D Dash Backend

A modern, fast, and scalable backend API built with Node.js, Fastify, MongoDB, and Apollo GraphQL.

## 🚀 Features

- **Fast & Lightweight**: Built with Fastify for maximum performance
- **GraphQL API**: Apollo GraphQL with full schema and resolvers
- **REST API**: Traditional REST endpoints for compatibility
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Student, Teacher, and Admin roles
- **MongoDB Integration**: Mongoose ODM with optimized schemas
- **Input Validation**: Joi schema validation for all endpoints
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Cross-origin resource sharing configuration
- **Health Checks**: Built-in health monitoring endpoints

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5.0+
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=4000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/d-dash
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod
   
   # Or use MongoDB Atlas
   # Update MONGODB_URI in .env
   ```

5. **Run the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### REST Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

#### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `PUT /api/profile/password` - Change password
- `POST /api/profile/avatar` - Upload avatar
- `DELETE /api/profile/avatar` - Remove avatar

#### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/admin` - Admin dashboard
- `GET /api/dashboard/teacher` - Teacher dashboard
- `POST /api/dashboard/activity` - Log activity

### GraphQL Endpoint

- **URL**: `http://localhost:4000/graphql`
- **Playground**: `http://localhost:4000/graphql` (development)

#### Example Queries

**Login User**
```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    success
    message
    user {
      id
      name
      email
      role
    }
    token
  }
}
```

**Get Dashboard**
```graphql
query GetDashboard {
  dashboard {
    success
    data {
      metrics {
        totalUsers
        activeUsers
        weeklySignups
        revenue
      }
      weeklyActivity {
        date
        teachers
        students
        signups
      }
    }
  }
}
```

**Update Profile**
```graphql
mutation UpdateProfile($input: UpdateProfileInput!) {
  updateProfile(input: $input) {
    success
    message
    user {
      id
      name
      email
      bio
    }
  }
}
```

## 🔐 Authentication

### JWT Token Format
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "student|teacher|admin",
  "name": "User Name",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Authorization Headers
```bash
Authorization: Bearer <jwt_token>
```

## 👥 User Roles & Permissions

### Student
- View dashboard
- Update own profile
- View own courses
- Submit assignments

### Teacher
- All student permissions
- View students
- Manage own courses
- Grade assignments
- View teaching statistics

### Admin
- All teacher permissions
- Manage all users
- View system analytics
- Access admin dashboard
- System management

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: Enum ['student', 'teacher', 'admin'],
  bio: String,
  avatar: String,
  isActive: Boolean,
  lastActive: Date,
  emailVerified: Boolean,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  timestamps: true
}
```

### Dashboard Model
```javascript
{
  userId: ObjectId (ref: User),
  metrics: {
    totalUsers: Number,
    activeUsers: Number,
    weeklySignups: Number,
    revenue: Number
  },
  charts: {
    weeklyActivity: Array,
    monthlyGrowth: Array,
    roleDistribution: Array
  },
  recentActivity: Array,
  lastUpdated: Date,
  timestamps: true
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📊 Monitoring

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

### Logging
- Development: Pretty-printed logs
- Production: JSON structured logs
- Error tracking and monitoring

## 🚀 Deployment

### Environment Variables
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/d-dash
JWT_SECRET=your-production-secret-key
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   └── Dashboard.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── jwt.js
│   ├── graphql/
│   │   ├── schema.js
│   │   └── resolvers.js
│   └── server.js
├── package.json
├── env.example
└── README.md
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the GraphQL playground for API exploration
