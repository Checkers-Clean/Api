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