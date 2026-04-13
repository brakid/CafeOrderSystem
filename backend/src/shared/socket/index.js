const rooms = {
  kitchen: new Set(),
  pickup: new Set()
};

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_kitchen', ({ station_id }) => {
      socket.join('kitchen');
      rooms.kitchen.add(socket.id);
      console.log(`Kitchen station joined: ${station_id}, total: ${rooms.kitchen.size}`);
      socket.emit('joined', { room: 'kitchen', station_id });
    });

    socket.on('join_pickup', () => {
      socket.join('pickup');
      rooms.pickup.add(socket.id);
      console.log(`Pickup display joined, total: ${rooms.pickup.size}`);
      socket.emit('joined', { room: 'pickup' });
    });

    socket.on('leave_kitchen', () => {
      socket.leave('kitchen');
      rooms.kitchen.delete(socket.id);
    });

    socket.on('leave_pickup', () => {
      socket.leave('pickup');
      rooms.pickup.delete(socket.id);
    });

    socket.on('disconnect', () => {
      rooms.kitchen.delete(socket.id);
      rooms.pickup.delete(socket.id);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitToKitchen(io, event, data) {
  io.to('kitchen').emit(event, data);
}

export function emitToPickup(io, event, data) {
  io.to('pickup').emit(event, data);
}

export function emitToAll(io, event, data) {
  io.emit(event, data);
}
