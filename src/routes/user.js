const express = require("express");
const userSchema = require("../models/user");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');
const router = express.Router();

// create user
router.post("/users", (req, res) => {
  const user = userSchema(req.body);
  user
    .save()
    .then((data) => res.status(200).json(data)) 
    .catch((error) => res.status(500).json({ message: error })); 
});

// login user
router.post("/authenticate", (req, res) => {
  const { email, password } = req.body;

  // Buscar el usuario por su correo electrónico
  userSchema.findOne({ email }, (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
    if (!user) {
      return res.status(401).json({ message: "Incorrect email" });
    }
    // Verificar si la contraseña proporcionada es correcta
    user.isCorrectPassword(password, (err, same) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      if (!same) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      // Si la contraseña es correcta, enviar respuesta de éxito
      //res.status(200).json({ message: "Logged in successfully" });

      // Si la contraseña es correcta, generar un token JWT
      const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

      // Enviar el token JWT como respuesta
      res.status(200).json({ message: "Logged in successfully", token });
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////
// get all users
router.get("/users", (req, res) => {
  userSchema
    .find()
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// get a user
router.get("/users/:id", (req, res) => {
  const { id } = req.params;
  userSchema
    .findById(id)
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// delete a user
router.delete("/users/:id", (req, res) => {
  const { id } = req.params;
  userSchema
    .remove({ _id: id })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

// update a user
router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  userSchema
    .updateOne({ _id: id }, { $set: { name, email, password } })
    .then((data) => res.json(data))
    .catch((error) => res.json({ message: error }));
});

module.exports = router;