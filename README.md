# Node

# USER
### POST api/createUser 
Registro de usuarios 

```json
{     
	"name": "Ejemplo Usuario",     
	"email": "usuario@example.com",     
	"password": "contraseñaSegura123" 
}
```

### POST api/login
```json
{
	"name": "Ejemplo Usuario",     
	"password": "contraseñaSegura123" 
}
```

# GAME
### POST api/game/create

```json
{
	"email": "usuario@example.com",
	"time": "10-2-1"
}
```

### GET api/game/boardId

```json
{
	"id_board" : "xxxxxxxxxxx"
}
```

### GET api/game/iniciarPartida
Una vez los 2 jugadores estén registrados en un board 

```json
{
	"turn" : "usuarioRed@example.com",
	"red" : "usuarioRed@example.com",
	"black" : "usuarioBlack@example.com"
}
```

### GET api/game/actualizacionDeTablero
Cada vez que un jugador mueva una ficha se actualiza el tablero

```json
{
	"board":"[][][][]"
}
```

### POST api/game/move

```json
{
	"email": "usuario@example.com",
	"selectedPiece" : "x1",
	"currentPosition" : "x2",
	"newPosition" : "x3",
	"newPositionName" : "x4",
	"n" : "bool",
}
```
