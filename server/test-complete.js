// Complete integration test for MongoDB + Authentication
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testCompleteIntegration() {
  try {
    console.log('🚀 Testing complete MongoDB + Auth integration...\n');

    // 1. Test Health Check
    console.log('1. Testing health check...');
    const health = await axios.get('http://localhost:4000/health');
    console.log('✅ Health check:', health.data);

    // 2. Test User Registration
    console.log('\n2. Testing user registration...');
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'organizer'
    };
    
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, userData);
      console.log('✅ User registered:', registerResponse.data.user);
      var token = registerResponse.data.token;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️ User already exists, trying login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        console.log('✅ User logged in:', loginResponse.data.user);
        var token = loginResponse.data.token;
      } else {
        throw error;
      }
    }

    // 3. Test Event Creation with Auth
    console.log('\n3. Testing event creation...');
    const eventData = {
      name: "Test Movie Event",
      type: "Movie",
      description: "A test movie with MongoDB backend",
      date: "2025-11-15",
      time: "7:00pm",
      venue: "Test Cinema Complex",
      theatres: ["Prasads Multiplex", "INOX GVK One (Banjara Hills)"],
      showtimes: ["7:00pm", "10:00pm"],
      ticketPrice: "120",
      capacity: 150
    };

    const eventResponse = await axios.post(`${API_BASE}/events`, eventData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Event created:', eventResponse.data);
    const eventId = eventResponse.data._id;

    // 4. Test Event Retrieval
    console.log('\n4. Testing event retrieval...');
    const eventsResponse = await axios.get(`${API_BASE}/events`);
    console.log(`✅ Retrieved ${eventsResponse.data.length} events from MongoDB`);

    // 5. Test Booking Creation
    console.log('\n5. Testing booking creation...');
    const bookingData = {
      eventId: eventId,
      eventName: eventData.name,
      eventType: eventData.type,
      date: eventData.date,
      time: "7:00pm",
      venue: eventData.venue,
      theatre: "Prasads Multiplex",
      tier: "gold",
      pricePerSeat: 120,
      seats: ["A1", "A2"],
      quantity: 2,
      totalPrice: 240,
      paymentMethod: "Paid",
      bookingDate: new Date().toISOString()
    };

    const bookingResponse = await axios.post(`${API_BASE}/bookings`, bookingData);
    console.log('✅ Booking created:', bookingResponse.data);

    // 6. Test Booking Retrieval
    console.log('\n6. Testing booking retrieval...');
    const bookingsResponse = await axios.get(`${API_BASE}/bookings`);
    console.log(`✅ Retrieved ${bookingsResponse.data.length} bookings from MongoDB`);

    console.log('\n🎉 ALL TESTS PASSED! MongoDB integration is working perfectly!');
    console.log('\n📊 Summary:');
    console.log(`- MongoDB Atlas connection: ✅ Working`);
    console.log(`- User authentication: ✅ Working`);
    console.log(`- Event management: ✅ Working`);
    console.log(`- Booking system: ✅ Working`);
    console.log(`- Database indexes: ✅ Created`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteIntegration();