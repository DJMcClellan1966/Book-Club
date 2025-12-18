import React, { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { useSocket } from '../context/SocketContext';
import './VideoChat.css';

const VideoChat = ({ roomId }) => {
  const [peers, setPeers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const { socket } = useSocket();
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        if (socket) {
          socket.emit('join-video-room', roomId);

          socket.on('all-users', users => {
            const newPeers = [];
            users.forEach(userID => {
              const peer = createPeer(userID, socket.id, stream);
              peersRef.current.push({
                peerID: userID,
                peer,
              });
              newPeers.push({
                peerID: userID,
                peer,
              });
            });
            setPeers(newPeers);
          });

          socket.on('user-joined-signal', payload => {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peersRef.current.push({
              peerID: payload.callerID,
              peer,
            });
            setPeers(users => [...users, { peerID: payload.callerID, peer }]);
          });

          socket.on('receiving-returned-signal', payload => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            if (item) {
              item.peer.signal(payload.signal);
            }
          });

          socket.on('user-left-video', id => {
            const peerObj = peersRef.current.find(p => p.peerID === id);
            if (peerObj) {
              peerObj.peer.destroy();
            }
            const peers = peersRef.current.filter(p => p.peerID !== id);
            peersRef.current = peers;
            setPeers(peers);
          });
        }
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(peerObj => {
        peerObj.peer.destroy();
      });
    };
  }, [socket, roomId]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('sending-signal', { userToSignal, callerID, signal });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('returning-signal', { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const leaveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    peersRef.current.forEach(peerObj => {
      peerObj.peer.destroy();
    });
    window.location.reload();
  };

  return (
    <div className="video-chat-container">
      <div className="video-grid">
        <div className="video-wrapper">
          <video ref={userVideo} autoPlay muted playsInline className="user-video" />
          <div className="video-label">You</div>
        </div>
        {peers.map((peer, index) => (
          <Video key={peer.peerID} peer={peer.peer} />
        ))}
      </div>
      
      <div className="video-controls">
        <button 
          onClick={toggleVideo} 
          className={`btn ${isVideoEnabled ? 'btn-primary' : 'btn-danger'}`}
        >
          {isVideoEnabled ? '📹 Video On' : '📹 Video Off'}
        </button>
        <button 
          onClick={toggleAudio} 
          className={`btn ${isAudioEnabled ? 'btn-primary' : 'btn-danger'}`}
        >
          {isAudioEnabled ? '🎤 Mic On' : '🎤 Mic Off'}
        </button>
        <button onClick={leaveCall} className="btn btn-danger">
          📞 Leave Call
        </button>
      </div>
    </div>
  );
};

const Video = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div className="video-wrapper">
      <video ref={ref} autoPlay playsInline className="peer-video" />
    </div>
  );
};

export default VideoChat;
