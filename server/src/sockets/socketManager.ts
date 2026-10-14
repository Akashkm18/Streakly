import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { isOriginAllowed } from '../common/middleware/security';

let io: SocketServer | null = null;

export function initializeSockets(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`WebSocket CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    // User joins a room
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
    });

    // User leaves a room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(roomId);
    });

    // Direct user room for personalized live cheers/toasts
    socket.on('register_user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      // Cleanly handled by Socket.IO
    });
  });

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

/**
 * Broadcasts a cheer notification to a specific receiver and room
 */
export function emitCheerEvent(cheer: {
  id: string;
  roomId: string;
  senderName: string;
  receiverId: string;
  emoji: string;
  message?: string | null;
}) {
  if (!io) return;
  // Send to the room feed
  io.to(cheer.roomId).emit('room_cheer', cheer);
  // Send direct notification toast to recipient
  io.to(`user:${cheer.receiverId}`).emit('cheer_received', cheer);
}

/**
 * Broadcasts habit check-in/watering event to a room
 */
export function emitRoomCheckIn(event: {
  roomId: string;
  userId: string;
  userName: string;
  habitTitle: string;
  plantStage: string;
  streak: number;
}) {
  if (!io) return;
  io.to(event.roomId).emit('room_activity', event);
}
