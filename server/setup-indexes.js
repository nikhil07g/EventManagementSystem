// Database optimization script - creates indexes for better performance
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

async function createIndexes() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create indexes for Events collection
    await db.collection('events').createIndex({ type: 1 });
    await db.collection('events').createIndex({ date: 1 });
    await db.collection('events').createIndex({ status: 1 });
    await db.collection('events').createIndex({ createdAt: -1 });
    await db.collection('events').createIndex({ 'theatres': 1 });
    
    console.log('✅ Events indexes created');

    // Create indexes for Bookings collection
    await db.collection('bookings').createIndex({ eventId: 1 });
    await db.collection('bookings').createIndex({ bookingDate: -1 });
    await db.collection('bookings').createIndex({ eventType: 1 });
    await db.collection('bookings').createIndex({ theatre: 1 });
    
    console.log('✅ Bookings indexes created');

    // Create indexes for Users collection
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    console.log('✅ Users indexes created');

    console.log('🎉 All database indexes created successfully!');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createIndexes();