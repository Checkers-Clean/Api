module.exports = function(io) {
  // Objeto para almacenar las salas y los jugadores en cada sala
  const salas = {};

  // Manejar conexiones de clientes
  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);
    // Unirse a una sala existente o crear una nueva
    socket.on("unirse-a-sala", (nombreSala) => {
      console.log("Mensaje recibido en 'unirse-a-sala':", nombreSala); // Imprimir el mensaje recibido en la consola del servidor

      if (salas[nombreSala] && salas[nombreSala].length < 2) {
        // La sala existe y tiene menos de 2 jugadores
        socket.join(nombreSala);
        salas[nombreSala].push(socket.id);
        io.to(nombreSala).emit("jugador-unido", nombreSala, salas[nombreSala]);
      } else {
        // La sala no existe o está llena, crear una nueva sala
        const nuevaSala = "sala-" + Math.random().toString(36).substr(2, 5); // Generar un nombre aleatorio para la sala
        socket.join(nuevaSala);
        salas[nuevaSala] = [socket.id];
        io.to(nuevaSala).emit("jugador-unido", nuevaSala, salas[nuevaSala]);
      }
    });

    // Salir de la sala
    socket.on("salir-de-sala", (nombreSala) => {
      if (salas[nombreSala]) {
        const index = salas[nombreSala].indexOf(socket.id);
        if (index !== -1) {
          salas[nombreSala].splice(index, 1);
          socket.leave(nombreSala);
          io.to(nombreSala).emit("jugador-salido", nombreSala, salas[nombreSala]);
        }
      }
    });

    // Manejar desconexiones de clientes
    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
      // Eliminar al jugador de todas las salas en las que esté
      for (const nombreSala in salas) {
        const index = salas[nombreSala].indexOf(socket.id);
        if (index !== -1) {
          salas[nombreSala].splice(index, 1);
          io.to(nombreSala).emit("jugador-salido", nombreSala, salas[nombreSala]);
        }
      }
    });
  });
}
