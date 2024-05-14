import React, { useEffect, useRef } from 'react';
const configuration = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
}
export default function App() {
  const localVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    // ws.current = new WebSocket('ws://localhost:5000');
    ws.current = new WebSocket('ws://192.168.132.125:5000');

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      // ws.current.send(JSON.stringify({ type: 'makeCall', message: 'connected' }));
      makeCall();
    };

    ws.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'makeCall') {
        makeCall();
      } else if (message.type === 'answer') {
        // Handle incoming answer
        await handleAnswer(message.answer);
      } else if (message.type === 'offer') {
        // Handle incoming offer
        await handleOffer(message.offer);
      } else if (message.type === 'candidate') {
        // Handle incoming ICE candidate
        await handleCandidate(message);
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);


  const makeCall = async () => {
    try {
      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // peerConnectionRef.current.addEventListener('icecandidate', event => {
      //   if (event.candidate) {
      //     // Send ICE candidate to the other peer
      //     ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      //   }
      // });
      console.log('peerConnectionRef.current', peerConnectionRef.current);
      peerConnectionRef.current.onicecandidate = event => {
        console.log(event);
        if (event.candidate) {
          // Send ICE candidate to the other peer
          ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      }
      peerConnectionRef.current.onsignalingstatechange = event => {
        console.log(event);
        if (event.candidate) {
          // Send ICE candidate to the other peer
          ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      }

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('sending Offer');
      ws.current.send(JSON.stringify({ type: 'offer', offer }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer) => {
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    console.log('offer handled');
    ws.current.send(JSON.stringify({ type: 'answer', answer }));
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('answer handled');
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  const handleCandidate = async (candidate) => {
    // Add ICE candidate
    console.log('handling candidate');
    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
  };

  return (
    <div style={{ background: '#373737', padding: '0px', margin: '0px', height: '100vh', width: '100vw' }} className='flex object-cover w-full h-screen relative'>
      <video ref={localVideoRef} className='bg-[aqua] w-[200px] z-[2002] h-[200px] absolute bottom-[102px] left-0' autoPlay muted />
    </div>
  );
}

// const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
// localVideoRef.current.srcObject = localStream;
// localStream.getTracks().forEach((track) => {
//   peerConnectionRef.current.addTrack(track, localStream);
// });

// const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
// localVideoRef.current.srcObject = localStream;
// localStream.getTracks().forEach((track) => {
//   peerConnectionRef.current.addTrack(track, localStream);
// });