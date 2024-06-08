const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let board = createInitialBoard();
let currentPlayer = 'B';
let players = {};

function createInitialBoard() {
  let board = Array(8).fill(null).map(() => Array(8).fill(null));
  board[3][3] = 'W';
  board[3][4] = 'B';
  board[4][3] = 'B';
  board[4][4] = 'W';
  return board;
}

function isValidMove(x, y, player) {
  if (board[x][y] !== null) return false;
  const opponent = player === 'B' ? 'W' : 'B';
  const directions = [
    [0, 1], [1, 1], [1, 0], [1, -1],
    [0, -1], [-1, -1], [-1, 0], [-1, 1]
  ];
  for (let [dx, dy] of directions) {
    let nx = x + dx;
    let ny = y + dy;
    let hasOpponent = false;
    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (board[nx][ny] === opponent) {
        hasOpponent = true;
      } else if (board[nx][ny] === player) {
        if (hasOpponent) return true;
        break;
      } else {
        break;
      }
      nx += dx;
      ny += dy;
    }
  }
  return false;
}

function applyMove(x, y, player) {
  board[x][y] = player;
  const opponent = player === 'B' ? 'W' : 'B';
  const directions = [
    [0, 1], [1, 1], [1, 0], [1, -1],
    [0, -1], [-1, -1], [-1, 0], [-1, 1]
  ];
  for (let [dx, dy] of directions) {
    let nx = x + dx;
    let ny = y + dy;
    let cellsToFlip = [];
    while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (board[nx][ny] === opponent) {
        cellsToFlip.push([nx, ny]);
      } else if (board[nx][ny] === player) {
        for (let [fx, fy] of cellsToFlip) {
          board[fx][fy] = player;
        }
        break;
      } else {
        break;
      }
      nx += dx;
      ny += dy;
    }
  }
}

io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Assign player
  let player = Object.keys(players).length < 1 ? 'B' : 'W';
  players[socket.id] = player;
  socket.emit('player', player);
  socket.emit('board', board);

  socket.on('move', (data) => {
    const { x, y } = data;
    if (players[socket.id] === currentPlayer && isValidMove(x, y, currentPlayer)) {
      applyMove(x, y, currentPlayer);
      currentPlayer = currentPlayer === 'B' ? 'W' : 'B';
      io.emit('board', board);
      io.emit('currentPlayer', currentPlayer);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    delete players[socket.id];
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
