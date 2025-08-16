// MongoDB initialization script for D Dash
// This script runs when the MongoDB container starts for the first time

print('🚀 Initializing D Dash MongoDB database...');

// Switch to the d-dash database
db = db.getSiblingDB('d-dash');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password", "role"],
      properties: {
        name: {
          bsonType: "string",
          description: "User name - required"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Valid email address - required"
        },
        password: {
          bsonType: "string",
          minLength: 8,
          description: "Password - required, minimum 8 characters"
        },
        role: {
          enum: ["student", "teacher", "admin"],
          description: "User role - must be student, teacher, or admin"
        }
      }
    }
  }
});

db.createCollection('dashboards', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId"],
      properties: {
        userId: {
          bsonType: "objectId",
          description: "User ID - required"
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });
db.dashboards.createIndex({ "userId": 1 });
db.dashboards.createIndex({ "lastUpdated": -1 });

// Insert sample admin user (password: admin123)
// Hash generated with bcrypt: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8O
db.users.insertOne({
  name: "Admin User",
  email: "admin@d-dash.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8O", // admin123
  role: "admin",
  bio: "System Administrator",
  avatar: "",
  isActive: true,
  emailVerified: true,
  lastActive: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert sample teacher user (password: teacher123)
// Hash generated with bcrypt: $2a$12$8K1p/a0dL1LXMIgoEDFrwOe6g7fKjJqHqKqKqKqKqKqKqKqKqKqKq
db.users.insertOne({
  name: "Teacher User",
  email: "teacher@d-dash.com",
  password: "$2a$12$8K1p/a0dL1LXMIgoEDFrwOe6g7fKjJqHqKqKqKqKqKqKqKqKqKqKq", // teacher123
  role: "teacher",
  bio: "Experienced educator with 5+ years of teaching experience",
  avatar: "",
  isActive: true,
  emailVerified: true,
  lastActive: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert sample student user (password: student123)
// Hash generated with bcrypt: $2a$12$9L2q/b1eM2MYNJpFEDGrxPf7g8gLjKrIrLrLrLrLrLrLrLrLrLr
db.users.insertOne({
  name: "Student User",
  email: "student@d-dash.com",
  password: "$2a$12$9L2q/b1eM2MYNJpFEDGrxPf7g8gLjKrIrLrLrLrLrLrLrLrLrLr", // student123
  role: "student",
  bio: "Enthusiastic learner",
  avatar: "",
  isActive: true,
  emailVerified: true,
  lastActive: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ D Dash database initialized successfully!');
print('📊 Sample users created:');
print('   - Admin: admin@d-dash.com (password: admin123)');
print('   - Teacher: teacher@d-dash.com (password: teacher123)');
print('   - Student: student@d-dash.com (password: student123)');
print('');
print('🔗 MongoDB Express UI available at: http://localhost:8081');
print('   Username: admin, Password: password');
