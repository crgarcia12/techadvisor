import { io } from 'socket.io-client';

async function testSocketConnection() {
  console.log('Testing Socket.IO connection...');
  
  const socket = io('http://localhost:3001', {
    transports: ['websocket', 'polling']
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error('Connection timeout'));
    }, 5000);

    socket.on('connect', () => {
      console.log('✓ Connected to server');
      clearTimeout(timeout);
      
      // Test chat message
      socket.emit('chat:message', {
        username: 'TestUser',
        message: 'Hello from test'
      });
      
      socket.on('chat:message', (data) => {
        console.log('✓ Received chat message:', data);
        socket.close();
        resolve();
      });
    });

    socket.on('connect_error', (error) => {
      console.error('✗ Connection error:', error.message);
      clearTimeout(timeout);
      socket.close();
      reject(error);
    });
  });
}

testSocketConnection()
  .then(() => {
    console.log('\n✓ All tests passed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Tests failed:', error.message);
    process.exit(1);
  });
