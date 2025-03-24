import { useState, useEffect, useCallback, useRef } from 'react';
import { WsMessage } from '@/types/game';

const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messageCallbacksRef = useRef<Map<string, ((message: any) => void)[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize and handle WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Clear any existing reconnect timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close existing socket if it's open
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsMessage;
        
        // Call all registered callbacks for this message type
        const callbacks = messageCallbacksRef.current.get(message.type) || [];
        callbacks.forEach(callback => callback(message.payload));
        
        // Call any wildcards
        const wildcardCallbacks = messageCallbacksRef.current.get('*') || [];
        wildcardCallbacks.forEach(callback => callback(message));
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed', event.code, event.reason);
      setIsConnected(false);
      
      // Attempt to reconnect after a delay, unless this was a clean close
      if (event.code !== 1000) {
        console.log('Scheduling reconnect attempt...');
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 2000);
      }
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Failed to connect to game server');
    };
  }, []);
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Function to send messages
  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }, []);

  // Function to add message listeners
  const addMessageListener = useCallback((type: string, callback: (message: any) => void) => {
    const callbacks = messageCallbacksRef.current.get(type) || [];
    callbacks.push(callback);
    messageCallbacksRef.current.set(type, callbacks);
    
    // Return a function to remove this specific listener
    return () => {
      const updatedCallbacks = messageCallbacksRef.current.get(type) || [];
      messageCallbacksRef.current.set(
        type,
        updatedCallbacks.filter(cb => cb !== callback)
      );
    };
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
    addMessageListener
  };
};

export default useWebSocket;
