// Game constants
const TILE_SIZE = 32;
const MAP_WIDTH = 19;
const MAP_HEIGHT = 13;
const TRAP_DAMAGE = 15;

// Physics constants
const GRAVITY = 0.4;
const JUMP_FORCE = 1;
const MOVE_SPEED = 1;

// Game state
const gameState = {

    physics: {
        friction: 0.8,  // Friction when not pressing movement keys
        airResistance: 0.95,  // Less control in air
        maxSpeed: 3,  // Maximum horizontal speed
        groundAcceleration: 0.5,  // How quickly you accelerate on ground
        airAcceleration: 0.2  // How quickly you accelerate in air
    },

    player: { 
        x: 1, 
        y: 1, 
        dx: 0, // Horizontal velocity
        dy: 0, // Vertical velocity
        health: 100, 
        gold: 0,
        isJumping: false,
        facingRight: true
    },
    level: 1,
    dungeon: [],
    exit: { x: 0, y: 0 },
    treasures: [],
    traps: [],
    gameOver: false,
    keys: {
        left: false,
        right: false,
        up: false
    }
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Generate initial dungeon
generateValidDungeon();

// Main game loop
function gameLoop() {
    if (!gameState.gameOver) {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
}

// Update game state
function update() {
    const player = gameState.player;
    const physics = gameState.physics;
    
    // Apply gravity
    player.dy += GRAVITY;
    
    // Handle horizontal movement with acceleration and friction
    if (gameState.keys.left) {
        const accel = player.isJumping ? physics.airAcceleration : physics.groundAcceleration;
        player.dx = Math.max(player.dx - accel, -physics.maxSpeed);
    } 
    else if (gameState.keys.right) {
        const accel = player.isJumping ? physics.airAcceleration : physics.groundAcceleration;
        player.dx = Math.min(player.dx + accel, physics.maxSpeed);
    }
    else {
        // Apply friction when no keys are pressed
        const friction = player.isJumping ? physics.airResistance : physics.friction;
        player.dx *= friction;
        
        // Stop completely if moving very slowly
        if (Math.abs(player.dx) < 0.1) player.dx = 0;
    }
    
    // Jump if on ground and up key pressed
    if (gameState.keys.up && !player.isJumping) {
        player.dy = JUMP_FORCE;
        player.isJumping = true;
    
    // Calculate new position
    let newX = player.x + player.dx;
    let newY = player.y + player.dy;
    
    // Check horizontal collision
    if (player.dx !== 0) {
        const checkX = player.dx > 0 ? Math.ceil(newX) : Math.floor(newX);
        const checkY1 = Math.floor(player.y);
        const checkY2 = Math.ceil(player.y);
        
        if (isSolid(checkX, checkY1) || isSolid(checkX, checkY2)) {
            newX = player.dx > 0 ? Math.floor(newX) : Math.ceil(newX);
            player.dx = 0;
        }
    }
    
    // Check vertical collision
    if (player.dy !== 0) {
        const checkY = player.dy > 0 ? Math.ceil(newY) : Math.floor(newY);
        const checkX1 = Math.floor(newX);
        const checkX2 = Math.ceil(newX);
        
        if (isSolid(checkX1, checkY) || isSolid(checkX2, checkY)) {
            if (player.dy > 0) {
                // Landed on ground
                player.isJumping = false;
            }
            newY = player.dy > 0 ? Math.floor(newY) : Math.ceil(newY);
            player.dy = 0;
        } else {
            player.isJumping = true;
        }
    }
    
    // Update player position
    player.x = newX;
    player.y = newY;
    
    // Check for treasures
    const treasureIndex = gameState.treasures.findIndex(t => 
        Math.abs(t.x - player.x) < 0.5 && Math.abs(t.y - player.y) < 0.5
    );
    if (treasureIndex !== -1) {
        gameState.treasures.splice(treasureIndex, 1);
        gameState.player.gold += 10;
    }
    
    // Check for traps
    const trapIndex = gameState.traps.findIndex(t => 
        Math.abs(t.x - player.x) < 0.5 && Math.abs(t.y - player.y) < 0.5
    );
    if (trapIndex !== -1 && !gameState.traps[trapIndex].revealed) {
        gameState.traps[trapIndex].revealed = true;
        gameState.player.health -= TRAP_DAMAGE;
        
        if (gameState.player.health <= 0) {
            gameState.player.health = 0;
            gameState.gameOver = true;
            alert(`Game Over! You reached level ${gameState.level} with ${gameState.player.gold} gold.`);
        } else {
            alert(`Ouch! Trap hit for ${TRAP_DAMAGE} damage!`);
        }
    }
    
    // Check for exit
    if (Math.abs(gameState.exit.x - player.x) < 0.5 && 
        Math.abs(gameState.exit.y - player.y) < 0.5) {
        if (gameState.treasures.length === 0) {
            gameState.level++;
            generateValidDungeon();
            // Reset player physics when changing levels
            gameState.player.dx = 0;
            gameState.player.dy = 0;
            gameState.player.isJumping = false;
        } else {
            alert("Collect all treasures before exiting!");
        }
    }
}

// Check if a tile is solid (wall)
function isSolid(x, y) {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
        return true;
    }
    return gameState.dungeon[Math.floor(y)][Math.floor(x)] === 0;
}

// Improved dungeon generation with path validation
function generateValidDungeon() {
    let validDungeon = false;
    
    while (!validDungeon) {
        // Reset dungeon grid (0 = wall, 1 = floor)
        gameState.dungeon = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(0));
        gameState.traps = [];
        
        // Random walk algorithm to carve paths
        let x = Math.floor(MAP_WIDTH / 2);
        let y = Math.floor(MAP_HEIGHT / 2);
        gameState.dungeon[y][x] = 1;
        
        for (let i = 0; i < 300; i++) {
            const dir = Math.floor(Math.random() * 4);
            switch (dir) {
                case 0: if (x > 1) x--; break;
                case 1: if (x < MAP_WIDTH - 2) x++; break;
                case 2: if (y > 1) y--; break;
                case 3: if (y < MAP_HEIGHT - 2) y++; break;
            }
            gameState.dungeon[y][x] = 1;
        }
        
        // Place player near center (on ground)
        gameState.player.x = Math.floor(MAP_WIDTH / 2);
        gameState.player.y = Math.floor(MAP_HEIGHT / 2) - 1;
        
        // Ensure there's ground below player
        gameState.dungeon[Math.floor(gameState.player.y) + 1][Math.floor(gameState.player.x)] = 1;
        
        // Place exit in a corner
        gameState.exit.x = Math.random() > 0.5 ? 1 : MAP_WIDTH - 2;
        gameState.exit.y = Math.random() > 0.5 ? 1 : MAP_HEIGHT - 2;
        gameState.dungeon[gameState.exit.y][gameState.exit.x] = 1;
        
        // Place some treasures
        gameState.treasures = [];
        for (let i = 0; i < 5; i++) {
            let tx, ty;
            do {
                tx = 1 + Math.floor(Math.random() * (MAP_WIDTH - 2));
                ty = 1 + Math.floor(Math.random() * (MAP_HEIGHT - 2));
            } while (gameState.dungeon[ty][tx] !== 1 || 
                   (Math.abs(tx - gameState.player.x) < 1 && Math.abs(ty - gameState.player.y) < 1) ||
                   (tx === gameState.exit.x && ty === gameState.exit.y));
            
            gameState.treasures.push({ x: tx, y: ty });
        }
        
        // Place some traps (hidden until stepped on)
        for (let i = 0; i < 3 + gameState.level; i++) {
            let tx, ty;
            do {
                tx = 1 + Math.floor(Math.random() * (MAP_WIDTH - 2));
                ty = 1 + Math.floor(Math.random() * (MAP_HEIGHT - 2));
            } while (gameState.dungeon[ty][tx] !== 1 || 
                   (Math.abs(tx - gameState.player.x) < 1 && Math.abs(ty - gameState.player.y) < 1) ||
                   (tx === gameState.exit.x && ty === gameState.exit.y) ||
                   gameState.treasures.some(t => t.x === tx && t.y === ty));
            
            gameState.traps.push({ x: tx, y: ty, revealed: false });
        }
        
        // Validate that all treasures and exit are reachable
        validDungeon = validateDungeon();
    }
}

// Pathfinding validation using BFS (updated for physics)
function validateDungeon() {
    const visited = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false));
    const queue = [{ x: Math.floor(gameState.player.x), y: Math.floor(gameState.player.y) }];
    let treasuresFound = 0;
    let exitFound = false;
    
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        
        if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) continue;
        if (visited[y][x] || gameState.dungeon[y][x] === 0) continue;
        
        visited[y][x] = true;
        
        // Check for treasures
        if (gameState.treasures.some(t => Math.floor(t.x) === x && Math.floor(t.y) === y)) {
            treasuresFound++;
        }
        
        // Check for exit
        if (x === Math.floor(gameState.exit.x) && y === Math.floor(gameState.exit.y)) {
            exitFound = true;
        }
        
        // Add neighbors to queue (only horizontal movement for validation)
        queue.push({ x: x+1, y });
        queue.push({ x: x-1, y });
        
        // Can move down if there's ground below
        if (y < MAP_HEIGHT - 1 && gameState.dungeon[y+1][x] === 1) {
            queue.push({ x, y: y+1 });
        }
        
        // Can move up if there's ground above (for jumping validation)
        if (y > 0 && gameState.dungeon[y-1][x] === 1) {
            queue.push({ x, y: y-1 });
        }
    }
    
    return exitFound && treasuresFound === gameState.treasures.length;
}

// Render everything
function render() {
    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate offset to center the dungeon
    const offsetX = (canvas.width - MAP_WIDTH * TILE_SIZE) / 2;
    const offsetY = (canvas.height - MAP_HEIGHT * TILE_SIZE) / 2;
    
    // Draw dungeon
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (gameState.dungeon[y][x] === 0) {
                // Wall
                ctx.fillStyle = '#443322';
                ctx.fillRect(offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#332211';
                ctx.strokeRect(offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else {
                // Floor
                ctx.fillStyle = '#554433';
                ctx.fillRect(offsetX + x * TILE_SIZE, offsetY + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Draw exit
    ctx.fillStyle = '#ff9900';
    ctx.font = '24px Arial';
    ctx.fillText('⮝', offsetX + gameState.exit.x * TILE_SIZE + 8, offsetY + gameState.exit.y * TILE_SIZE + 24);
    
    // Draw treasures
    ctx.fillStyle = '#ffcc00';
    ctx.font = '20px Arial';
    gameState.treasures.forEach(t => {
        ctx.fillText('★', offsetX + t.x * TILE_SIZE + 8, offsetY + t.y * TILE_SIZE + 22);
    });
    
    // Draw traps (only revealed ones)
    ctx.fillStyle = '#ff0000';
    ctx.font = '20px Arial';
    gameState.traps.forEach(trap => {
        if (trap.revealed) {
            ctx.fillText('✖', offsetX + trap.x * TILE_SIZE + 8, offsetY + trap.y * TILE_SIZE + 22);
        }
    });
    
    // Draw player (now with direction)
    ctx.fillStyle = '#66ccff';
    ctx.beginPath();
    ctx.arc(
        offsetX + gameState.player.x * TILE_SIZE + TILE_SIZE/2,
        offsetY + gameState.player.y * TILE_SIZE + TILE_SIZE/2,
        TILE_SIZE/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Draw player direction indicator
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
        offsetX + gameState.player.x * TILE_SIZE + TILE_SIZE/2 + (gameState.player.facingRight ? 6 : -6),
        offsetY + gameState.player.y * TILE_SIZE + TILE_SIZE/2,
        4,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Update UI
    document.getElementById('health').textContent = gameState.player.health;
    document.getElementById('gold').textContent = gameState.player.gold;
    document.getElementById('level').textContent = gameState.level;
}

// Keyboard event listeners
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft': gameState.keys.left = true; break;
        case 'ArrowRight': gameState.keys.right = true; break;
        case 'ArrowUp': gameState.keys.up = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft': gameState.keys.left = false; break;
        case 'ArrowRight': gameState.keys.right = false; break;
        case 'ArrowUp': gameState.keys.up = false; break;
    }
});

// Start the game
gameLoop();