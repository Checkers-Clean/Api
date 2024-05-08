const jwt = require('jsonwebtoken');
const secretKey = "d4cc015d7c0ddbf6c07893515c5e7d5b9240e28e9433cd9a1960591fd97606a0";
const Game = require("../api/models/game");
const User = require("../api/models/user");


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
        players: { player1: userId },
        socket_ids: { player1: socket.id } // Agregar el socket.id del jugador 1
      };

      Game.create(gameData)
        .then((game) => {
          console.log("Evento 'sala-creada' enviado al cliente. ID de partida:", game._id);
          io.to(socket.id).emit("sala-creada", { gameId: game._id, userId: userId });

          const updatedToken = addIdGameToToken(token, game._id);
          io.to(socket.id).emit("token-actualizado-id-game", updatedToken);
        })
        .catch((error) => {
          console.error("Error creating game:", error);
          io.to(socket.id).emit("error-creacion-sala", "Error creating game");
        });
    });

    socket.on("unirse-a-sala", async (data) => {
      console.log("Mensaje recibido en 'unirse-a-sala':", data);
  
      const { id_game: gameId, token } = data;
      console.log("Token recibido:", token);
  
      const userId = getUserIdFromToken(token, secretKey);
      console.log("UserID obtenido del token:", userId);
  
      if (!userId) {
          console.log("Error: Usuario no autenticado.");
          io.to(socket.id).emit("error-unirse-sala", "Error: Usuario no autenticado.");
          return;
      }
  
      console.log("Usuario autenticado. ID:", userId);
  
      try {
          const game = await Game.findById(gameId).populate('players.player1');
  
          if (!game) {
              console.log("Error: Juego no encontrado.");
              io.to(socket.id).emit("error-unirse-sala", "Error: Juego no encontrado.");
              return;
          }
  
          console.log("Juego encontrado. ID:", game._id);
  
          if (game.state !== "waiting_for_opponent") {
              console.log("Error: El juego no está disponible para unirse en este momento.");
              io.to(socket.id).emit("error-unirse-sala", "Error: El juego no está disponible para unirse en este momento.");
              return;
          }

          console.log("El juego está disponible para unirse. Estado:", game.state);

          // Insertar el ID del usuario como nuevo participante en la sala del juego
          game.players.player2 = userId; // Establecer al nuevo jugador como player2
          // Establecer el socket ID del jugador
          game.socket_ids.player2 = socket.id;
          // Cambiar el estado del juego a "jugando"
          game.state = "jugando";
          const updatedGame = await game.save();

          if (updatedGame) {
              console.log("El usuario se ha unido exitosamente a la sala de juego. ID del juego:", updatedGame._id);
              io.to(socket.id).emit("jugador-unido-sala", updatedGame._id);
  
              // Obtener los correos electrónicos de los jugadores
              const player1Email = game.players.player1.name;
              const player2 = await User.findById(userId);
              const player2Email = player2.name;
  
              // Crear el JSON con los correos electrónicos de los jugadores
              const playersJson = {
                  "player1": player1Email,
                  "player2": player2Email
              };
              
              const updatedToken = addIdGameToToken(token, gameId);

              // Enviar el JSON a ambos jugadores
              io.to(updatedGame.socket_ids.player1).emit("inicio-de-partida", playersJson);
              io.to(updatedGame.socket_ids.player2).emit("inicio-de-partida", playersJson);

              io.to(updatedGame.socket_ids.player2).emit("token-actualizado-id-game", updatedToken);
          }
      } catch (error) {
          console.error("Error al unirse a la sala:", error);
          io.to(socket.id).emit("error-unirse-sala", "Error al unirse a la sala.");
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

    socket.on("prueba", (mensaje) => {
      console.log("Mensaje recibido del cliente:", mensaje);
      // Enviar "Hola" de vuelta al cliente
      socket.emit("juan", "Hola");
    });

    //Juego
    socket.on("move", async (data) => {
      try {
        console.log("Movimiento recibido:", data);
        
        // Descifrar el token
        const decodedToken = jwt.verify(data.token, secretKey);
        console.log("Token decodificado:", decodedToken);
        
        // Obtener userId e id_game del token decodificado
        const { userId, id_game: gameId } = decodedToken;
        
        // Buscar el juego en la base de datos
        const game = await Game.findById(gameId);
        
        // Verificar si el juego existe y está en curso
        if (game && game.state === "jugando") {
          // Obtener los datos del contrincante
          const opponentId = game.players.player1.toString() === userId ? game.players.player2 : game.players.player1;
          const opponentSocketId = game.socket_ids.player1.toString() === socket.id ? game.socket_ids.player1 : game.socket_ids.player2;
          
          // Enviar el movimiento al contrincante
          io.to(opponentSocketId).emit("move", data);
          
          // Si el jugador sigue jugando, enviar el evento "tu-turno" al contrincante
          if (!data.sigueJugando) {
            io.to(opponentSocketId).emit("tu-turno");
          }
        } else {
          console.log("Error: El juego no está disponible o no existe.");
        }
      } catch (error) {
        console.error("Error al procesar el movimiento:", error);
      }
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
      return jwt.sign(decodedToken, secretKey);
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return null;
    }
  }

  function addIdGameToToken(token, gameId) {
    try {
      const decodedToken = jwt.verify(token, secretKey);
      decodedToken.id_game = gameId;
      return jwt.sign(decodedToken, secretKey);
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return null;
    }
  }
}