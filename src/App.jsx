import React, { useEffect, useRef } from 'react';
const config = {
  configuration: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
  },
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  // iceCandidatePoolSize: 10,
}
export default function App() {
  const localVideoRef = useRef();
  const peerConnectionRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    // ws.current = new WebSocket('ws://localhost:5000');
    ws.current = new WebSocket('ws://192.168.197.125:5000');

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
        await handleCandidate(message.candidate);
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);


  const makeCall = async () => {
    try {
      peerConnectionRef.current = new RTCPeerConnection(config);

      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideoRef.current.srcObject = localStream;
      localStream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStream);
      });

      peerConnectionRef.current.addEventListener('icecandidate', event => {
        console.log('candidate1');
        if (event.candidate) {
          // Send ICE candidate to the other peer
          ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      });
      // peerConnectionRef.current.onicecandidate = event => {
      //   console.log('candidate2');
      //   if (event.candidate) {
      //     // Send ICE candidate to the other peer
      //     ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      //   }
      // }

      // peerConnectionRef.current.onsignalingstatechange = event => {
      //   console.log('candidate3', event);
      //   if (event.candidate) {
      //     // Send ICE candidate to the other peer
      //     ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      //   }
      // }

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('making call');
      ws.current.send(JSON.stringify({ type: 'offer', offer }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (offer) => {
    peerConnectionRef.current = new RTCPeerConnection(config);

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = localStream;
    localStream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, localStream);
    });

    peerConnectionRef.current.addEventListener('icecandidate', event => {
      console.log('candidate4');
      if (event.candidate) {
        // Send ICE candidate to the other peer
        ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      }
    });
    // peerConnectionRef.current.onicecandidate = event => {
    //   console.log('candidate5');
    //   if (event.candidate) {
    //     // Send ICE candidate to the other peer
    //     ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    //   }
    // }

    // peerConnectionRef.current.onsignalingstatechange = event => {
    //   console.log('candidate6', event.candidate);
    //   if (event.candidate) {
    //     // Send ICE candidate to the other peer
    //     ws.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
    //   }
    // }

    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    console.log('call received');
    ws.current.send(JSON.stringify({ type: 'answer', answer }));
  };

  const handleAnswer = async (answer) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('call answered');
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  };

  const handleCandidate = async (candidate) => {
    // Add ICE candidate
    console.log('handling candidate');
    if (peerConnectionRef.current.remoteDescription) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  return (
    <div style={{ background: '#373737', padding: '0px !important', margin: '0px !important', height: '100vh', width: 'calc(100vw-100%)' }}>
      <video ref={localVideoRef} autoPlay muted />
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