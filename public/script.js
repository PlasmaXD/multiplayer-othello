const socket = io();
let opponent;
let color;
let currentTurn;
let board;

socket.emit('joinGame');

socket.on('startGame', (data) => {
    opponent = data.opponent;
    color = data.color;
    currentTurn = 'B';
    board = data.board;
    updateBoard(board, []);
    updateStatus();
});

socket.on('updateBoard', (data) => {
    console.log('Board updated', data.board);
    board = data.board;
    updateBoard(board, data.validMoves);
    currentTurn = data.color;
    updateStatus();
    if (currentTurn !== color) {
        disableBoard();
    }
});

socket.on('opponentDisconnected', () => {
    alert('Opponent disconnected. You win by default!');
});
function disableBoard() {
    const cells = document.querySelectorAll('td');
    cells.forEach(cell => {
        cell.style.pointerEvents = 'none';
    });
}
function updateBoard(board, validMoves) {
    const table = document.createElement('table');
    for (let i = 0; i < 8; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < 8; j++) {
            const td = document.createElement('td');
            td.textContent = board[i][j] === 'B' ? '●' : board[i][j] === 'W' ? '○' : '';
            td.className = board[i][j];
            if (validMoves.some(([row, col]) => row === i && col === j)) {
                td.classList.add('valid-move');
                if (currentTurn === color) {
                    td.onclick = () => makeMove(i, j);
                    td.style.cursor = 'pointer';
                } else {
                    td.style.cursor = 'not-allowed';
                }
            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = '';
    boardDiv.appendChild(table);
}

function makeMove(row, col) {
    if (currentTurn === color) {
        console.log(`Attempting to make move at row: ${row}, col: ${col}`);
        socket.emit('move', { row, col });
    } else {
        console.log("Not your turn.");
    }
}
function updateStatus() {
    document.getElementById('status').innerText = `You are ${color}. ${currentTurn === color ? 'Your' : "Opponent's"} turn.`;
}