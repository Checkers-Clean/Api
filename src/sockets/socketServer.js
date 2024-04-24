const jwt = require('jsonwebtoken');
const secretKey = "d4cc015d7c0ddbf6c07893515c5e7d5b9240e28e9433cd9a1960591fd97606a0";
const Game = require("../api/models/game");

module.exports = function(io) {
  // Objeto para almacenar las salas y los jugadores en cada sala
  const salas = {};

  // Manejar conexiones de clientes
  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);
    // Unirse a una sala existente o crear una nueva

    socket.on('token', (token) => {
      const updatedToken = addSocketIdToToken(token, socket.id);
      console.log(`Se agregó el socket.id al token y se asignó como el ID del socket: ${socket.id}`);
      socket.emit('tokenUpdated', updatedToken);
    });

    socket.on("crear-sala", (token) => {
      const userId = getUserIdFromToken(token, secretKey);
      if (!userId) {
        io.to(socket.id).emit("error-creacion-sala", "Error: No se pudo obtener el ID de usuario del token");
        return;
      }

      // Crear una nueva partida en la base de datos
      const gameData = {
        state: "waiting_for_opponent", 
        winner_id: null, 
        players: [userId], 
      };

      Game.create(gameData)
        .then((game) => {
          console.log("Evento 'sala-creada' enviado al cliente. ID de partida:", game._id);
          io.to(socket.id).emit("sala-creada", { gameId: game._id, userId: userId });
        })
        .catch((error) => {
          console.error("Error creating game:", error);
          io.to(socket.id).emit("error-creacion-sala", "Error creating game");
        });
    });

    socket.on("unirse-a-sala", (data) => {
      console.log("Mensaje recibido en 'unirse-a-sala':", data);
    
      const { id_game: gameId, token } = data; // Accedemos a id_game y token del objeto data
      const userId = getUserIdFromToken(token, secretKey);
      
      if (!userId) {
        io.to(socket.id).emit("error-unirse-sala", "Error: Usuario no autenticado.");
        return;
      }
    
      Game.findById(gameId)
        .then((game) => {
          if (!game) {
            io.to(socket.id).emit("error-unirse-sala", "Error: Juego no encontrado.");
            return;
          }
          
          if (game.state !== "waiting_for_opponent") {
            io.to(socket.id).emit("error-unirse-sala", "Error: El juego no está disponible para unirse en este momento.");
            return;
          }
          
          // Insertar el ID del usuario como nuevo participante en la sala del juego
          game.players.push(userId);
          // Cambiar el estado del juego a "jugando"
          game.state = "jugando";
          return game.save();
        })
        .then((updatedGame) => {
          if (updatedGame) {
            console.log("El usuario se ha unido exitosamente a la sala de juego. ID del juego:", updatedGame._id);
            io.to(socket.id).emit("jugador-unido-sala", updatedGame._id);
        
            // Verificar si hay dos jugadores en la sala y el juego está en estado "jugando"
            if (updatedGame.players.length === 2 && updatedGame.state === "jugando") {
              // Enviar un mensaje a todos los jugadores en la sala
              io.to(updatedGame.players[0]).emit("inicio-de-partida");
              io.to(updatedGame.players[1]).emit("inicio-de-partida");
            }
          }
        })
                .catch((error) => {
          console.error("Error al unirse a la sala:", error);
          io.to(socket.id).emit("error-unirse-sala", "Error al unirse a la sala.");
        });
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

    socket.on("prueba", (mensaje) => {
      console.log("Mensaje recibido del cliente:", mensaje);
      // Enviar "Hola" de vuelta al cliente
      socket.emit("juan", "Hola");
    });
  });

  function getUserIdFromToken(token, secretKey) {
    try {
      const decodedToken = jwt.verify(token, secretKey);
      return decodedToken.userId;
    } catch (error) {
      console.error("Error descifrando el token:", error);
      return null; 
    }
  }

  function addSocketIdToToken(token, socketId) {
    try {
      const decodedToken = jwt.verify(token, secretKey);
      
      decodedToken.socketId = socketId;
      
      return jwt.sign(decodedToken, secretKey, { expiresIn: '1h' });
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return null;
    }
  }
}