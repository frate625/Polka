// Хук для WebRTC соединения
import { useState, useRef, useEffect } from 'react';
import { Platform } from 'react-native';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export default function useWebRTC(socket, userId) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const peerConnection = useRef(null);
  const currentCallId = useRef(null);

  // Инициализация локального потока
  const startLocalStream = async (isVideo) => {
    if (Platform.OS !== 'web') {
      console.error('Звонки доступны только в веб-версии');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? { width: 1280, height: 720 } : false
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Ошибка получения медиа:', error);
      return null;
    }
  };

  // Создание peer connection
  const createPeerConnection = () => {
    console.log('🔧 Создание peer connection с ICE серверами:', ICE_SERVERS);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Получение ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && currentCallId.current) {
        console.log('🧊 Отправка ICE candidate:', event.candidate.type);
        socket.emit('ice_candidate', {
          callId: currentCallId.current,
          candidate: event.candidate
        });
      } else if (!event.candidate) {
        console.log('✅ Все ICE candidates отправлены');
      }
    };

    // ICE gathering state
    pc.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', pc.iceGatheringState);
    };

    // ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error('❌ ICE connection failed');
      }
    };

    // Получение удаленного потока
    pc.ontrack = (event) => {
      console.log('📺 Получен удаленный поток, треки:', event.streams[0].getTracks().map(t => `${t.kind}: ${t.enabled}`));
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        
        // Дополнительная проверка аудио треков
        const audioTracks = event.streams[0].getAudioTracks();
        console.log('🔊 Аудио треки в удаленном потоке:', audioTracks.length);
        audioTracks.forEach((track, index) => {
          console.log(`  Трек ${index}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ Соединение установлено!');
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.error('❌ Соединение разорвано или не удалось');
        endCall();
      }
    };

    return pc;
  };

  // Инициация звонка
  const makeCall = async (chatId, recipientId, isVideo) => {
    console.log('📞 Инициация звонка:', { chatId, recipientId, isVideo, userId });

    if (!socket) {
      console.error('❌ Socket не подключен');
      alert('Ошибка: нет соединения с сервером');
      return;
    }

    const stream = await startLocalStream(isVideo);
    if (!stream) {
      alert('Не удалось получить доступ к камере/микрофону');
      return;
    }

    const pc = createPeerConnection();
    peerConnection.current = pc;

    // Добавляем локальные треки
    stream.getTracks().forEach(track => {
      console.log('➕ Добавляем трек:', track.kind);
      pc.addTrack(track, stream);
    });

    // Создаем offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('📤 Отправляем offer');

    // Отправляем offer через сокет
    const callId = `${userId}_${recipientId}_${Date.now()}`;
    currentCallId.current = callId;

    socket.emit('call_initiate', {
      callId,
      chatId,
      recipientId,
      callerId: userId,
      isVideo,
      offer: offer
    });

    console.log('✅ Call initiate отправлен');
    setIsCallActive(true);
  };

  // Ответ на звонок
  const answerCall = async (callData) => {
    console.log('✅ Ответ на звонок:', callData);

    const stream = await startLocalStream(callData.isVideo);
    if (!stream) return;

    const pc = createPeerConnection();
    peerConnection.current = pc;
    currentCallId.current = callData.callId;

    // Добавляем локальные треки
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Устанавливаем удаленное описание (offer)
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

    // Создаем answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Отправляем answer
    socket.emit('call_answer', {
      callId: callData.callId,
      answer: answer
    });

    setIsCallActive(true);
    setIncomingCall(null);
  };

  // Завершение звонка
  const endCall = () => {
    console.log('📵 Завершение звонка');

    // Останавливаем все треки
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Закрываем peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Уведомляем другую сторону
    if (currentCallId.current) {
      socket.emit('call_end', { callId: currentCallId.current });
      currentCallId.current = null;
    }

    setRemoteStream(null);
    setIsCallActive(false);
    setIncomingCall(null);
  };

  // Отклонение звонка
  const declineCall = (callId) => {
    console.log('❌ Отклонение звонка');
    socket.emit('call_decline', { callId });
    setIncomingCall(null);
  };

  // Обработка сокет событий
  useEffect(() => {
    if (!socket) return;

    // Входящий звонок
    socket.on('incoming_call', (data) => {
      console.log('📞 Входящий звонок:', data);
      setIncomingCall(data);
    });

    // Ответ на звонок получен
    socket.on('call_answered', async (data) => {
      console.log('✅ Звонок принят:', data);
      if (peerConnection.current && data.answer) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    // ICE candidate
    socket.on('ice_candidate', async (data) => {
      if (peerConnection.current && data.candidate) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });

    // Звонок завершен
    socket.on('call_ended', () => {
      console.log('📵 Звонок завершен удаленной стороной');
      endCall();
    });

    // Звонок отклонен
    socket.on('call_declined', () => {
      console.log('❌ Звонок отклонен');
      endCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('ice_candidate');
      socket.off('call_ended');
      socket.off('call_declined');
    };
  }, [socket]);

  return {
    localStream,
    remoteStream,
    isCallActive,
    incomingCall,
    makeCall,
    answerCall,
    endCall,
    declineCall
  };
}
