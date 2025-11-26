// Test MongoDB connection and API endpoints
const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing server endpoints...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('Health check:', healthResponse.data);
    
    // Test creating an event
    const eventData = {
      name: "Test Movie",
      type: "Movie",
      description: "Test movie event",
      date: "2025-11-01",
      time: "7:00pm",
      venue: "Test Venue",
      theatres: ["Prasads Multiplex", "INOX GVK One (Banjara Hills)"],
      showtimes: ["7:00pm", "10:00pm"],
      ticketPrice: "120",
      capacity: 100
    };
    
    const createResponse = await axios.post('http://localhost:4000/api/events', eventData);
    console.log('Event created:', createResponse.data);
    
    // Test getting events
    const getResponse = await axios.get('http://localhost:4000/api/events');
    console.log('Events retrieved:', getResponse.data.length, 'events');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI();