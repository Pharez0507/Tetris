const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const themeButton = document.getElementById('theme-button');
const highScoreElement = document.getElementById('high-score');

// Touch control buttons
const touchLeftBtn = document.getElementById('touch-left');
const touchRightBtn = document.getElementById('touch-right');
const touchRotateBtn = document.getElementById('touch-rotate');
const touchDownBtn = document.getElementById('touch-down');
const touchDropBtn = document.getElementById('touch-drop');

const BLOCK_SIZE = 20;
const ROWS = 20;
const COLS = 12;
let score = 0;
let level = 1;
let gameLoop;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;
let isPaused = false;
let highScore = 0;

// Tetromino shapes
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

const COLORS = [
    '#00f0f0', // cyan
    '#f0f000', // yellow
    '#a000f0', // purple
    '#f0a000', // orange
    '#0000f0', // blue
    '#00f000', // green
    '#f00000'  // red
];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece = null;
let nextPiece = null;

class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.x = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
        this.y = 0;
    }
}

function createPiece() {
    const index = Math.floor(Math.random() * SHAPES.length);
    return new Piece(SHAPES[index], COLORS[index]);
}

function drawBlock(x, y, color, context = ctx) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = '#000';
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
}

function drawPiece(piece, context = ctx, offsetX = 0, offsetY = 0) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                drawBlock(piece.x + x + offsetX, piece.y + y + offsetY, piece.color, context);
            }
        });
    });
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const offsetX = (nextCanvas.width / BLOCK_SIZE - nextPiece.shape[0].length) / 2;
        const offsetY = (nextCanvas.height / BLOCK_SIZE - nextPiece.shape.length) / 2;
        drawPiece(nextPiece, nextCtx, offsetX - nextPiece.x, offsetY - nextPiece.y);
    }
}

function collision(piece, offsetX = 0, offsetY = 0) {
    return piece.shape.some((row, y) => {
        return row.some((value, x) => {
            const newX = piece.x + x + offsetX;
            const newY = piece.y + y + offsetY;
            return (
                value &&
                (newX < 0 ||
                 newX >= COLS ||
                 newY >= ROWS ||
                 (newY >= 0 && board[newY][newX]))
            );
        });
    });
}

function merge(piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[piece.y + y][piece.x + x] = piece.color;
            }
        });
    });
}

function rotate(piece) {
    const newShape = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );
    const oldShape = piece.shape;
    piece.shape = newShape;
    if (collision(piece)) {
        piece.shape = oldShape;
    }
}

function createSparkle(container) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    
    // Random position around the notification
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 50;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    sparkle.style.left = `calc(50% + ${x}px)`;
    sparkle.style.top = `calc(50% + ${y}px)`;
    sparkle.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    container.appendChild(sparkle);
    
    // Remove sparkle after animation
    setTimeout(() => sparkle.remove(), 500);
}

function showLevelUpNotification() {
    // Remove any existing notifications first
    const existingNotification = document.querySelector('.level-up-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.textContent = `LEVEL ${level}!`;
    document.body.appendChild(notification);
    
    // Create sparkles function
    function createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        
        // Random position around the notification
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 50;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        sparkle.style.left = `calc(50% + ${x}px)`;
        sparkle.style.top = `calc(50% + ${y}px)`;
        
        notification.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => sparkle.remove(), 800);
    }
    
    // Create multiple waves of sparkles
    for (let wave = 0; wave < 5; wave++) {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => createSparkle(), wave * 400 + i * 100);
        }
    }
    
    // Remove notification after animation
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 2000);
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(value => value)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        const points = {
            1: 100,
            2: 300,
            3: 500,
            4: 800
        };
        const newScore = score + (points[linesCleared] || 0) * level;
        updateScore(newScore);
        
        // Check for level up
        const newLevel = Math.floor(newScore / 1000) + 1;
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
            showLevelUpNotification(); // Show the level up animation
        }
    }
}

function gameStep(timestamp) {
    if (isPaused) return;
    
    const deltaTime = timestamp - lastTime;
    
    if (deltaTime > dropInterval) {
        drop();
        lastTime = timestamp;
    }
    
    draw();
    if (!gameOver) {
        gameLoop = requestAnimationFrame(gameStep);
    }
}

function drop() {
    if (!currentPiece) return;
    
    if (!collision(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        merge(currentPiece);
        clearLines();
        if (currentPiece.y === 0) {
            gameOver = true;
            alert('Game Over! Score: ' + score);
            return;
        }
        currentPiece = nextPiece;
        nextPiece = createPiece();
    }
}

function hardDrop() {
    while (!collision(currentPiece, 0, 1)) {
        currentPiece.y++;
    }
    drop();
}

function move(dir) {
    if (!collision(currentPiece, dir, 0)) {
        currentPiece.x += dir;
    }
}

function drawGhostPiece() {
    if (!currentPiece) return;
    
    const ghost = {
        shape: currentPiece.shape,
        color: 'rgba(255, 255, 255, 0.2)',
        x: currentPiece.x,
        y: currentPiece.y
    };
    
    while (!collision(ghost, 0, 1)) {
        ghost.y++;
    }
    
    drawPiece(ghost);
}

function draw() {
    drawBoard();
    drawGhostPiece();
    if (currentPiece) {
        drawPiece(currentPiece);
    }
    drawNextPiece();
}

function updateScore(newScore) {
    score = newScore;
    scoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
}

function togglePause() {
    if (gameOver) return;
    
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    
    if (!isPaused) {
        gameLoop = requestAnimationFrame(gameStep);
    }
}

function startGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    level = 1;
    dropInterval = 1000;
    gameOver = false;
    isPaused = false;
    
    scoreElement.textContent = '0';
    levelElement.textContent = '1';
    pauseButton.textContent = 'Pause';
    
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    if (gameLoop) {
        cancelAnimationFrame(gameLoop);
    }
    gameLoop = requestAnimationFrame(gameStep);
}

// Event Listeners
document.addEventListener('keydown', event => {
    if (gameOver) return;
    
    switch (event.keyCode) {
        case 37: // Left
            move(-1);
            break;
        case 39: // Right
            move(1);
            break;
        case 40: // Down
            drop();
            break;
        case 38: // Up
            rotate(currentPiece);
            break;
        case 32: // Space
            hardDrop();
            break;
    }
});

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
themeButton.addEventListener('click', toggleTheme);

// Touch controls
touchLeftBtn.addEventListener('click', () => move(-1));
touchRightBtn.addEventListener('click', () => move(1));
touchRotateBtn.addEventListener('click', () => rotate(currentPiece));
touchDownBtn.addEventListener('click', () => drop());
touchDropBtn.addEventListener('click', () => hardDrop());

// Add touch gesture handling
let touchStartX = null;
let touchStartY = null;
const MIN_SWIPE = 20; // Reduced minimum swipe distance
let lastTap = 0;

// Prevent scrolling when touching the canvas
document.body.addEventListener('touchmove', function(e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

// Touch start
canvas.addEventListener('touchstart', function(e) {
    if (gameOver || isPaused) return;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    e.preventDefault();
}, { passive: false });

// Touch move
canvas.addEventListener('touchmove', function(e) {
    if (gameOver || isPaused || touchStartX === null) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > MIN_SWIPE) {
        if (deltaX > 0) {
            move(1); // Right
        } else {
            move(-1); // Left
        }
        // Update touch start for continuous movement
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
    // Handle downward swipes
    else if (deltaY > MIN_SWIPE) {
        drop();
        // Update touch start for continuous movement
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }
}, { passive: false });

// Touch end
canvas.addEventListener('touchend', function(e) {
    if (gameOver || isPaused) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Handle taps for rotation
    if (Math.abs(deltaX) < MIN_SWIPE && Math.abs(deltaY) < MIN_SWIPE) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            // Double tap - Hard drop
            hardDrop();
        } else {
            // Single tap - Rotate
            rotate(currentPiece);
        }
        lastTap = currentTime;
    }
    
    touchStartX = null;
    touchStartY = null;
}, { passive: false });

// Initialize the game
startGame();
