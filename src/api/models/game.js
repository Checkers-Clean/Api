const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
    state: { 
        type: String, 
        required: true
    }, 
    winner_id: { 
        type: String, // Cambiar el tipo a String para almacenar el nombre del jugador ganador
        default: null 
    }, 
    players: {
        player1: { 
            type: String, 
            ref: "User" 
        },
        player2: {
            type: String,
            ref: "User"
        }
    }, 
    socket_ids: {
        player1: {
            type: String
        },
        player2: {
            type: String
        }
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    }, 
});

module.exports = mongoose.model("Game", gameSchema);


/*
const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
    state: { 
        type: String, 
        required: true
    }, 
    winner_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        default: null 
    }, 
    players: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        }
    ], 
    created_at: { 
        type: Date, 
        default: Date.now 
    }, 
});

module.exports = mongoose.model("Game", gameSchema);
*/