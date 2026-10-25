import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from './db.js';

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  role: 'interviewer' | 'candidate' | 'observer';
  joinedAt: string;
}

// In-memory room presence cache
const activeRooms = new Map<string, Map<string, Participant>>();

export function setupSocketIO(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentUser: Participant | null = null;

    // Join Interview Room
    socket.on('interview:join', (payload: { roomId: string; userId: string; userName: string; role: 'interviewer' | 'candidate' | 'observer' }) => {
      const { roomId, userId, userName, role } = payload;
      currentRoomId = roomId;
      currentUser = {
        socketId: socket.id,
        userId: userId || `guest_${socket.id.slice(0, 5)}`,
        userName: userName || 'Anonymous Peer',
        role: role || 'candidate',
        joinedAt: new Date().toISOString(),
      };

      socket.join(roomId);

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Map());
      }
      activeRooms.get(roomId)!.set(socket.id, currentUser);

      // Record event in DB
      const store = db.get();
      const room = store.interviews.find((r) => r.id === roomId);
      if (room) {
        room.events.push({
          id: `ev_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'joined',
          actorName: currentUser.userName,
          details: `${currentUser.userName} joined as ${currentUser.role}`,
        });
        db.save();
      }

      // Notify others of updated presence list
      const participantsList = Array.from(activeRooms.get(roomId)!.values());
      io.to(roomId).emit('participant:presence', {
        participants: participantsList,
        event: `${currentUser.userName} entered the room`,
      });

      // Send initial state to newly joined user
      if (room) {
        socket.emit('interview:sync_state', {
          code: room.code,
          language: room.language,
          status: room.status,
          events: room.events,
        });
      }
    });

    // Real-time Code Change Synchronization
    socket.on('code:change', (payload: { roomId: string; code: string; cursor?: any }) => {
      if (!currentRoomId || currentRoomId !== payload.roomId) return;

      // Update room in store
      const store = db.get();
      const room = store.interviews.find((r) => r.id === payload.roomId);
      if (room) {
        room.code = payload.code;
      }

      // Broadcast to other peers in room
      socket.to(payload.roomId).emit('code:change', {
        code: payload.code,
        cursor: payload.cursor,
        senderId: socket.id,
        senderName: currentUser?.userName,
      });
    });

    // Language Change
    socket.on('language:change', (payload: { roomId: string; language: string }) => {
      if (!currentRoomId) return;
      const store = db.get();
      const room = store.interviews.find((r) => r.id === payload.roomId);
      if (room) {
        room.language = payload.language;
        db.save();
      }
      io.to(payload.roomId).emit('language:change', { language: payload.language, actorName: currentUser?.userName });
    });

    // Chat Message
    socket.on('chat:message', (payload: { roomId: string; message: string }) => {
      if (!currentRoomId || !currentUser) return;
      const msgObj = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        senderName: currentUser.userName,
        senderRole: currentUser.role,
        message: payload.message,
        timestamp: new Date().toISOString(),
      };
      io.to(payload.roomId).emit('chat:message', msgObj);
    });

    // Interview Timer Control (Interviewer authority)
    socket.on('timer:control', (payload: { roomId: string; action: 'start' | 'pause' | 'extend'; minutes?: number }) => {
      const store = db.get();
      const room = store.interviews.find((r) => r.id === payload.roomId);
      if (room) {
        if (payload.action === 'start') {
          room.status = 'in-progress';
          if (!room.startTime) room.startTime = new Date().toISOString();
        } else if (payload.action === 'pause') {
          // pause
        } else if (payload.action === 'extend' && payload.minutes) {
          room.durationMinutes += payload.minutes;
        }

        room.events.push({
          id: `ev_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: payload.action === 'start' ? 'timer_start' : 'timer_pause',
          actorName: currentUser?.userName || 'Interviewer',
          details: `Timer action: ${payload.action}`,
        });
        db.save();
      }

      io.to(payload.roomId).emit('timer:update', {
        action: payload.action,
        durationMinutes: room?.durationMinutes,
        status: room?.status,
      });
    });

    // Live Execution Status Broadcast
    socket.on('submission:run', (payload: { roomId: string; status: 'running' | 'completed'; result?: any }) => {
      socket.to(payload.roomId).emit('submission:status', {
        actorName: currentUser?.userName,
        status: payload.status,
        result: payload.result,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentRoomId && activeRooms.has(currentRoomId)) {
        const roomMap = activeRooms.get(currentRoomId)!;
        roomMap.delete(socket.id);

        if (currentUser) {
          const store = db.get();
          const room = store.interviews.find((r) => r.id === currentRoomId);
          if (room) {
            room.events.push({
              id: `ev_${Date.now()}`,
              timestamp: new Date().toISOString(),
              type: 'left',
              actorName: currentUser.userName,
              details: `${currentUser.userName} left the room`,
            });
            db.save();
          }

          io.to(currentRoomId).emit('participant:presence', {
            participants: Array.from(roomMap.values()),
            event: `${currentUser.userName} left the room`,
          });
        }

        if (roomMap.size === 0) {
          activeRooms.delete(currentRoomId);
        }
      }
    });
  });
}
