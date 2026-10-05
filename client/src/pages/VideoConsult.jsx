import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { usePatient } from '../context/PatientContext.jsx';
import { useNetworkSpeed, getSimulatedNetworkSpeed } from '../hooks/useNetworkSpeed.js';
import socket from '../services/socket.js';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Wifi,
  WifiOff,
  Send,
  AlertTriangle,
  User,
  Activity,
  FileText,
  Volume2
} from 'lucide-react';
import './VideoConsult.css';

export default function VideoConsult() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'patient'; // 'patient' or 'doctor'

  const { patientData, triageResult, speakText } = usePatient();
  const { speed, isOffline, simulateSpeed } = useNetworkSpeed();
  const currentSimSpeed = getSimulatedNetworkSpeed();

  const isEmergency = location.state?.emergency || (triageResult && triageResult.level === 'RED');

  // Media states
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [forceVoiceOnly, setForceVoiceOnly] = useState(false);
  const [callConnected, setCallConnected] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'Dr. Sharma (On-Call Specialist)',
      text: 'Namaskar. I can review your triage data and vitals. Please describe what you are feeling.',
      time: 'Just now',
      isDoctor: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const roomId = 'kiosk-room-majuli';

  // Network condition dictates voice-only adaptation
  const isAudioOnlyMode = forceVoiceOnly || speed === 'very-slow' || speed === 'offline';

  // Fallback synthetic stream (canvas) if camera not available
  const createMockVideoStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      ctx.fillStyle = role === 'doctor' ? '#143829' : '#1f4534';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        role === 'doctor' ? '👨‍⚕️ Dr. Sharma (MD)' : '👤 Kiosk Patient (Majuli)',
        canvas.width / 2,
        canvas.height / 2 - 20
      );
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#a8d8be';
      ctx.fillText(`Live Stream • Frame ${frame}`, canvas.width / 2, canvas.height / 2 + 30);
    }, 100);

    const stream = canvas.captureStream(25);
    // Add mock audio track via web audio api oscillator
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = osc.connect(audioCtx.createMediaStreamDestination());
      osc.start();
      const audioTrack = dst.stream.getAudioTracks()[0];
      stream.addTrack(audioTrack);
    } catch (e) {
      console.warn('Mock audio oscillator skipped:', e);
    }

    stream._cleanup = () => clearInterval(interval);
    return stream;
  };

  // Setup Local Stream & WebRTC
  useEffect(() => {
    let streamInstance = null;

    async function startMedia() {
      try {
        // Attempt real webcam/mic
        const media = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamInstance = media;
      } catch (err) {
        console.warn('Real webcam not accessible; activating resilient Kiosk Media Simulator:', err.message);
        streamInstance = createMockVideoStream();
      }

      setLocalStream(streamInstance);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamInstance;
      }

      // Initialize WebRTC PeerConnection
      setupWebRTC(streamInstance);
    }

    startMedia();

    // Voice announcement
    if (isEmergency) {
      speakText('Emergency consultation initiated. Doctor is joining the live call.');
    }

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((t) => t.stop());
        if (streamInstance._cleanup) streamInstance._cleanup();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  // WebRTC Connection Setup
  const setupWebRTC = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.streams[0]);
      setRemoteStream(event.streams[0]);
      setCallConnected(true);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signal', {
          roomId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    // Join Socket Room
    socket.emit('join-room', {
      roomId,
      role,
      userName: role === 'doctor' ? 'Dr. Sharma' : patientData.name
    });

    // Listen for signaling events
    socket.on('user-joined', async () => {
      console.log('[WebRTC] Peer joined room; creating offer...');
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('signal', { roomId, signal: offer });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    });

    socket.on('signal', async ({ signal }) => {
      try {
        if (signal.type === 'offer') {
          console.log('[WebRTC] Handling offer...');
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { roomId, signal: answer });
          setCallConnected(true);
        } else if (signal.type === 'answer') {
          console.log('[WebRTC] Handling answer...');
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          setCallConnected(true);
        } else if (signal.type === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('Signaling error:', err);
      }
    });

    // Chat listener
    socket.on('chat-message', (data) => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: data.sender,
          text: data.message,
          time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDoctor: data.sender.includes('Dr.')
        }
      ]);
    });
  };

  // Toggle Video Track
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Send Chat Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const senderName = role === 'doctor' ? 'Dr. Sharma' : `${patientData.name} (Kiosk)`;
    socket.emit('chat-message', {
      roomId,
      sender: senderName,
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleEndCall = () => {
    if (role === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/prescription');
    }
  };

  return (
    <div className="consult-container">
      {/* Top Emergency Strip */}
      {isEmergency && (
        <div className="consult-emergency-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} />
            <span>CRITICAL EMERGENCY CALL: Priority alert broadcasted to tele-ICU network.</span>
          </div>
          <span style={{ fontSize: '0.95rem' }}>Response Code: RED-01</span>
        </div>
      )}

      {/* Header */}
      <header className="consult-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
            {role === 'doctor' ? '👨‍⚕️ Doctor Teleconsult Console' : '🏥 Kiosk Teleconsult Room'}
          </h2>
          <span style={{ background: '#254434', color: '#5eead4', padding: '4px 12px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700 }}>
            {callConnected ? '● Call Connected' : '○ Waiting for Doctor / Peer'}
          </span>
        </div>

        {/* Network Quality Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {speed === 'offline' ? <WifiOff size={18} style={{ color: '#ef4444' }} /> : <Wifi size={18} style={{ color: '#2dd4bf' }} />}
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            Network: <strong>{speed.toUpperCase()}</strong>
          </span>
        </div>
      </header>

      {/* Main Grid: Video Stream + Side Panel */}
      <div className="consult-main-grid">
        <div className="video-stage-container">
          {isAudioOnlyMode ? (
            /* Audio-Only Fallback Screen */
            <div className="audio-only-screen">
              <div className="doctor-avatar-circle">
                <User size={64} />
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.7rem' }}>
                {role === 'doctor' ? patientData.name : 'Dr. A. Sharma, MD'}
              </h2>
              <p style={{ color: '#6ee7b7', fontSize: '1.15rem', margin: 0 }}>
                🎙️ Audio-Only Mode Active (Bandwidth Saving Enabled)
              </p>
              <div className="audio-pulse-bars">
                <div className="pulse-bar"></div>
                <div className="pulse-bar"></div>
                <div className="pulse-bar"></div>
                <div className="pulse-bar"></div>
                <div className="pulse-bar"></div>
              </div>
              <small style={{ color: '#94a3b8', marginTop: '16px' }}>
                Video is suspended automatically to preserve audio clarity on rural 2G/3G connections.
              </small>
            </div>
          ) : (
            /* Normal WebRTC Video Stage */
            <>
              {remoteStream ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <Video size={56} style={{ opacity: 0.5, marginBottom: '12px' }} />
                  <h3>Connecting WebRTC Video Stream...</h3>
                  <p>Open another tab at <code>/consult?role=doctor</code> to test peer-to-peer!</p>
                </div>
              )}

              {/* Local PiP Video */}
              <div className="local-video-pip">
                <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
              </div>
            </>
          )}
        </div>

        {/* Side Panel: Patient Clinical Summary & Chat */}
        <aside className="consult-side-panel">
          <div className="clinical-summary-box">
            <h3 style={{ margin: '0 0 10px 0', color: '#fde047', fontSize: '1.15rem' }}>
              Clinical Kiosk Snapshot
            </h3>
            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}>
              <strong>Patient:</strong> {patientData.name} ({patientData.age} {patientData.gender})
            </p>
            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}>
              <strong>Symptoms:</strong> {patientData.symptoms.join(', ') || 'Chest Pain, Breathlessness'}
            </p>
            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}>
              <strong>SpO2:</strong> {patientData.vitals.spo2}% | <strong>BP:</strong> {patientData.vitals.systolicBP}/{patientData.vitals.diastolicBP}
            </p>
            {triageResult && (
              <span style={{ display: 'inline-block', marginTop: '6px', background: triageResult.level === 'RED' ? '#b3261e' : '#ca8a04', color: 'white', padding: '3px 10px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>
                AI Score: {triageResult.level} ({triageResult.score}/10)
              </span>
            )}
          </div>

          {/* Chat Fallback Box */}
          <div className="consult-chat-box">
            <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Live Consultation Chat</h4>
            <div className="chat-message-list">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.isDoctor ? 'doctor' : ''}`}>
                  <strong style={{ fontSize: '0.85rem', color: msg.isDoctor ? '#5eead4' : '#fef08a' }}>
                    {msg.sender}
                  </strong>
                  <p style={{ margin: '4px 0 0 0' }}>{msg.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-row">
              <input
                type="text"
                placeholder="Type fallback message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="chat-input"
              />
              <button type="submit" className="chat-send-btn">
                <Send size={18} />
              </button>
            </form>
          </div>
        </aside>
      </div>

      {/* Bottom Call Controls & Bandwidth Simulation */}
      <footer className="call-controls-bar">
        {/* Mute Mic */}
        <button
          className={`call-btn ${isAudioMuted ? 'active' : ''}`}
          onClick={toggleAudio}
          title="Toggle Microphone"
        >
          {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Toggle Video */}
        <button
          className={`call-btn ${isVideoMuted ? 'active' : ''}`}
          onClick={toggleVideo}
          title="Toggle Camera"
        >
          {isVideoMuted ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        {/* Force Voice Only Button */}
        <button
          className={`call-btn ${forceVoiceOnly ? 'active' : ''}`}
          onClick={() => setForceVoiceOnly(!forceVoiceOnly)}
          title="Voice Only Bandwidth Saver"
        >
          <Volume2 size={24} />
        </button>

        {/* End Call / View Prescription */}
        <button className="call-btn end-btn" onClick={handleEndCall}>
          <PhoneOff size={22} />
          <span>{role === 'doctor' ? 'Finish & Write RX' : 'Proceed to Prescription'}</span>
        </button>

        {/* On-Demand Bandwidth Simulation for Judges */}
        <div className="call-sim-box">
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Demo Bandwidth:</span>
          <button
            className={`call-sim-btn ${currentSimSpeed === 'good' ? 'active' : ''}`}
            onClick={() => simulateSpeed('good')}
          >
            Good (Video)
          </button>
          <button
            className={`call-sim-btn ${currentSimSpeed === 'very-slow' ? 'active' : ''}`}
            onClick={() => simulateSpeed('very-slow')}
          >
            Slow (Audio Only)
          </button>
          <button
            className={`call-sim-btn ${currentSimSpeed === 'offline' ? 'active' : ''}`}
            onClick={() => simulateSpeed('offline')}
          >
            Offline
          </button>
        </div>
      </footer>
    </div>
  );
}
