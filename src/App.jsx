import React, { useEffect, useRef } from 'react';

export default function App() {
  const localVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5000');

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      ws.current.send(JSON.stringify({ type: 'createOffer', message: 'connected' }));
    };

    ws.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      console.log(message);

      if (message.type === 'createOffer') {
        createOffer();
      } else if (message.type === 'offer') {
        // Handle incoming offer
        await handleOffer(message.offer);
      } else if (message.type === 'answer') {
        // Handle incoming answer
        await handleAnswer(message.answer);
      } else if (message.type === 'candidate') {
        // Handle incoming ICE candidate
        await handleCandidate(message);
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);

  const createOffer = async () => {
    try {
      // Initialize peer connection
      peerConnectionRef.current = new RTCPeerConnection();

      // Add local stream to peer connection
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = localStream;
      localStream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStream);
      });

      // Create offer
      const offer = await peerConnectionRef.current.createOffer();

      // Set local description
      await peerConnectionRef.current.setLocalDescription(offer);

      // Send offer to the other peer through the signaling server
      ws.current.send(JSON.stringify({ type: 'offer', offer }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer) => {
    // Set up peer connection
    peerConnectionRef.current = new RTCPeerConnection();

    // Add local stream to peer connection
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = localStream;
    localStream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, localStream);
    });

    // Set remote description
    console.log('running');
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

    // Create answer
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);

    // Send answer to the server
    ws.current.send(JSON.stringify({ type: 'answer', answer }));
  };

  const handleAnswer = async (answer) => {
    try {
      console.log('running222', peerConnectionRef.current);
      if (peerConnectionRef.current.connectionState === 'stable') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } else {
        console.warn('Peer connection is not in the correct state to accept the remote description.');
      }
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };


  const handleCandidate = async (candidate) => {
    // Add ICE candidate
    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
  };

  return (
    <div style={{ background: '#373737', padding: '0px', margin: '0px', height: '100vh', width: '100vw' }} className='flex object-cover w-full h-screen relative'>
      <video ref={localVideoRef} className='bg-[aqua] w-[200px] z-[2002] h-[200px] absolute bottom-[102px] left-0' autoPlay muted />
    </div>
  );
}
