import React, { useEffect, useId } from 'react'

export default function App() {
  const userId = useId();
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000');

    ws.onopen = () => {
      console.log('WebSocket connection established');
      ws.send(JSON.stringify({ type: 'addUser', userId }));
    };
    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };

  }, [])

  return (
    <div>App</div>
  )
}
