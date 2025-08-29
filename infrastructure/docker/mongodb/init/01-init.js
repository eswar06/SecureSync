// MongoDB initialization script for SecureSync Pro
db = db.getSiblingDB('securesync-pro');

// Create collections
db.createCollection('users');
db.createCollection('organizations');
db.createCollection('meetings');
db.createCollection('documents');
db.createCollection('threads');
db.createCollection('audit_logs');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "organizationId": 1 });
db.organizations.createIndex({ "domain": 1 }, { unique: true });
db.meetings.createIndex({ "organizationId": 1 });
db.meetings.createIndex({ "startTime": 1 });
db.documents.createIndex({ "organizationId": 1 });
db.documents.createIndex({ "createdAt": 1 });
db.threads.createIndex({ "organizationId": 1 });
db.threads.createIndex({ "participants": 1 });
db.audit_logs.createIndex({ "timestamp": 1 });
db.audit_logs.createIndex({ "userId": 1 });

print('SecureSync Pro database initialized successfully');
