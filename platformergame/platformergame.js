
window.resetGame = resetGame;
console.log("Script loaded!"); // Top of JS file

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const healthDisplay = document.getElementById("health");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    loadLevel(currentLevel);
}


// Game variables
let gravity = 0.5;
let score = 0;
let health = 100;
let gameOver = false;
let lastTime = 0;
let currentLevel = 1;
let maxLevel = 3;
let checkpoint = { x: 50, y: 100 };

// Player
const player = {
    x: 50,
    y: 100,
    width: 30,
    height: 50,
    speed: 5,
    velY: 0,
    jumping: false,
    color: "#FF0000",
    invincible: false,
    invincibleTimer: 0
};

// Game objects (will be populated by level data)
let platforms = [];
let hazards = [];
let collectibles = [];
let enemies = [];
let portals = [];
let checkpoints = [];

// Level data
const levels = {
    1: (canvas) => ({
        platforms: [
            { x: 0, y: canvas.height - 50, width: 300, height: 20, color: "#2ECC71", type: "normal" },
            { x: 350, y: canvas.height - 150, width: 200, height: 20, color: "#2ECC71", type: "normal" },
            { x: 600, y: canvas.height - 250, width: 200, height: 20, color: "#2ECC71", type: "normal" },
            { x: 300, y: canvas.height - 300, width: 150, height: 15, color: "#3498DB", type: "moving", dir: 1, speed: 2, xStart: 300, xEnd: 500 },
            { x: 650, y: canvas.height - 400, width: 150, height: 15, color: "#9B59B6", type: "bouncy" }
        ],
        hazards: [
            { x: 0, y: canvas.height - 30, width: canvas.width, height: 30, color: "#E74C3C", type: "lava" },
            { x: 200, y: canvas.height - 70, width: 100, height: 20, color: "#95A5A6", type: "spikes" },
            { x: 550, y: canvas.height - 170, width: 50, height: 20, color: "#95A5A6", type: "spikes" }
        ],
        collectibles: [
            { x: 100, y: canvas.height - 100, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 400, y: canvas.height - 200, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 700, y: canvas.height - 350, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false }
        ],
        enemies: [
            { x: 500, y: canvas.height - 100, width: 40, height: 40, color: "#8E44AD", type: "patrol", speed: 1.5, xStart: 450, xEnd: 650, dir: 1 }
        ],
        portals: [
            { x: 750, y: canvas.height - 300, width: 40, height: 60, color: "#F39C12", targetLevel: 2 }
        ],
        checkpoints: [
            { x: 50, y: 100, width: 20, height: 40, color: "#27AE60", activated: true }
        ],
        startPos: { x: 50, y: 100 }
    }),
    2: (canvas) => ({
        platforms: [
            { x: 0, y: canvas.height - 50, width: 200, height: 20, color: "#2ECC71", type: "normal" },
            { x: 250, y: canvas.height - 150, width: 150, height: 20, color: "#2ECC71", type: "normal" },
            { x: 450, y: canvas.height - 250, width: 150, height: 20, color: "#2ECC71", type: "normal" },
            { x: 650, y: canvas.height - 350, width: 150, height: 20, color: "#2ECC71", type: "normal" },
            { x: 200, y: canvas.height - 400, width: 150, height: 15, color: "#3498DB", type: "moving", dir: 1, speed: 3, xStart: 200, xEnd: 400 },
            { x: 500, y: canvas.height - 450, width: 150, height: 15, color: "#9B59B6", type: "bouncy" }
        ],
        hazards: [
            { x: 0, y: canvas.height - 30, width: canvas.width, height: 30, color: "#E74C3C", type: "lava" },
            { x: 300, y: canvas.height - 170, width: 100, height: 20, color: "#95A5A6", type: "spikes" },
            { x: 600, y: canvas.height - 370, width: 50, height: 20, color: "#95A5A6", type: "spikes" },
            { x: 400, y: canvas.height - 500, width: 100, height: 20, color: "#E74C3C", type: "lava" }
        ],
        collectibles: [
            { x: 150, y: canvas.height - 80, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 350, y: canvas.height - 180, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 550, y: canvas.height - 280, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 200, y: canvas.height - 450, width: 20, height: 20, color: "#E67E22", type: "health", collected: false }
        ],
        enemies: [
            { x: 300, y: canvas.height - 70, width: 40, height: 40, color: "#8E44AD", type: "patrol", speed: 2, xStart: 250, xEnd: 400, dir: 1 },
            { x: 600, y: canvas.height - 170, width: 40, height: 40, color: "#C0392B", type: "shooter", speed: 0, fireRate: 2000, lastShot: 0 }
        ],
        portals: [
            { x: 700, y: canvas.height - 400, width: 40, height: 60, color: "#F39C12", targetLevel: 3 }
        ],
        checkpoints: [
            { x: 50, y: 100, width: 20, height: 40, color: "#27AE60", activated: false },
            { x: 400, y: canvas.height - 200, width: 20, height: 40, color: "#27AE60", activated: false }
        ],
        startPos: { x: 50, y: 100 }
    }),
    3: (canvas) => ({
        platforms: [
            { x: 0, y: canvas.height - 50, width: 150, height: 20, color: "#2ECC71", type: "normal" },
            { x: 200, y: canvas.height - 120, width: 150, height: 20, color: "#2ECC71", type: "normal" },
            { x: 400, y: canvas.height - 190, width: 150, height: 20, color: "#2ECC71", type: "normal" },
            { x: 600, y: canvas.height - 260, width: 150, height: 20, color: "#2ECC71", type: "normal" },
            { x: 100, y: canvas.height - 350, width: 150, height: 15, color: "#3498DB", type: "moving", dir: 1, speed: 2.5, xStart: 100, xEnd: 300 },
            { x: 450, y: canvas.height - 420, width: 150, height: 15, color: "#9B59B6", type: "bouncy" }
        ],
        hazards: [
            { x: 0, y: canvas.height - 30, width: canvas.width, height: 30, color: "#E74C3C", type: "lava" },
            { x: 150, y: canvas.height - 70, width: 50, height: 20, color: "#95A5A6", type: "spikes" },
            { x: 350, y: canvas.height - 140, width: 50, height: 20, color: "#95A5A6", type: "spikes" },
            { x: 550, y: canvas.height - 210, width: 50, height: 20, color: "#95A5A6", type: "spikes" },
            { x: 300, y: canvas.height - 500, width: 200, height: 20, color: "#E74C3C", type: "lava" }
        ],
        collectibles: [
            { x: 100, y: canvas.height - 80, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 300, y: canvas.height - 150, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 500, y: canvas.height - 220, width: 15, height: 15, color: "#F1C40F", type: "coin", collected: false },
            { x: 200, y: canvas.height - 400, width: 20, height: 20, color: "#E67E22", type: "health", collected: false },
            { x: 700, y: canvas.height - 300, width: 30, height: 30, color: "#1ABC9C", type: "gem", collected: false, value: 500 }
        ],
        enemies: [
            { x: 250, y: canvas.height - 70, width: 40, height: 40, color: "#8E44AD", type: "patrol", speed: 2, xStart: 200, xEnd: 350, dir: 1 },
            { x: 500, y: canvas.height - 140, width: 40, height: 40, color: "#C0392B", type: "shooter", speed: 0, fireRate: 1500, lastShot: 0 },
            { x: 650, y: canvas.height - 300, width: 50, height: 50, color: "#16A085", type: "jumper", jumpForce: -15, jumpDelay: 2000, lastJump: 0 }
        ],
        portals: [
            { x: 700, y: canvas.height - 500, width: 40, height: 60, color: "#F39C12", targetLevel: 1, isFinal: true }
        ],
        checkpoints: [
            { x: 50, y: 100, width: 20, height: 40, color: "#27AE60", activated: false },
            { x: 300, y: canvas.height - 170, width: 20, height: 40, color: "#27AE60", activated: false },
            { x: 600, y: canvas.height - 300, width: 20, height: 40, color: "#27AE60", activated: false }
        ],
        startPos: { x: 50, y: 100 }
    })
};

// Projectiles array
let projectiles = [];

// Controls
let keys = {
    left: false,
    right: false,
    up: false
};

// Event Listeners
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;
    if (e.key === "ArrowUp") keys.up = true;
    if (e.key === "r" && gameOver) resetGame();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowUp") keys.up = false;
});

// Load level
function loadLevel(levelNum) {
    currentLevel = levelNum;
    levelDisplay.textContent = levelNum;
    
    const level = levels[levelNum](canvas);
    platforms = JSON.parse(JSON.stringify(level.platforms));
    hazards = JSON.parse(JSON.stringify(level.hazards));
    collectibles = JSON.parse(JSON.stringify(level.collectibles));
    enemies = JSON.parse(JSON.stringify(level.enemies));
    portals = JSON.parse(JSON.stringify(level.portals));
    checkpoints = JSON.parse(JSON.stringify(level.checkpoints));
    projectiles = [];
    
    // Reset all checkpoints except the first one in level 1
    if (currentLevel === 1) {
        checkpoints.forEach((cp, index) => {
            cp.activated = index === 0; // Only activate first checkpoint in level 1
        });
    } else {
        checkpoints.forEach(cp => {
            cp.activated = false;
        });
    }

    // Set player position
    const activeCheckpoint = checkpoints.find(cp => cp.activated);
    if (activeCheckpoint) {
        player.x = activeCheckpoint.x + activeCheckpoint.width/2 - player.width/2;
        player.y = activeCheckpoint.y - player.height;
    } else {
        player.x = level.startPos.x;
        player.y = level.startPos.y;
    }
    
    player.velY = 0;
    player.jumping = false;
    player.invincible = false;
    player.invincibleTimer = 0;
}
// Game Loop
function gameLoop(timestamp) {
    if (!gameOver) {
        // Calculate delta time for smooth animation
        const deltaTime = timestamp - lastTime || 0;
        lastTime = timestamp;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update game objects
        updatePlayer(deltaTime);
        updatePlatforms(deltaTime);
        updateEnemies(deltaTime);
        updateProjectiles(deltaTime);
        
        // Draw game objects
        drawHazards();
        drawPlatforms();
        drawCollectibles();
        drawEnemies();
        drawProjectiles();
        drawPortals();
        drawCheckpoints();
        drawPlayer();
        
        // Update UI
        healthDisplay.textContent = health;
        scoreDisplay.textContent = score;
    } else {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

function updatePlayer(deltaTime) {
    if (player.invincible) {
        player.invincibleTimer -= deltaTime;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }
    checkpoints.forEach(checkpoint => {
        if (
            !checkpoint.activated &&
            player.x + player.width > checkpoint.x &&
            player.x < checkpoint.x + checkpoint.width &&
            player.y + player.height > checkpoint.y &&
            player.y < checkpoint.y + checkpoint.height
        ) {
            checkpoint.activated = true;
            // Set checkpoint position for respawn
            checkpoint.respawnX = checkpoint.x + checkpoint.width/2 - player.width/2;
            checkpoint.respawnY = checkpoint.y - player.height;
        }
    });

    // Horizontal movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;

    // Jumping
    if (keys.up && !player.jumping) {
        player.velY = -15; // Jump force
        player.jumping = true;
    }

    // Apply gravity
    player.velY += gravity;
    player.y += player.velY;

    // Check platform collisions
    player.jumping = true;
    platforms.forEach(platform => {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height &&
            player.velY > 0
        ) {
            player.y = platform.y - player.height;
            player.velY = 0;
            player.jumping = false;
            
            // Bouncy platform effect
            if (platform.type === "bouncy") {
                player.velY = -20;
            }
        }
    });

    // Check hazard collisions
    hazards.forEach(hazard => {
        if (
            player.x < hazard.x + hazard.width &&
            player.x + player.width > hazard.x &&
            player.y < hazard.y + hazard.height &&
            player.y + player.height > hazard.y &&
            !player.invincible
        ) {
            takeDamage(hazard.type === "spikes" ? 20 : 10);
            
            // Knockback effect
            if (hazard.type === "spikes") {
                player.velY = -10;
                player.x += (player.x < hazard.x + hazard.width/2) ? -30 : 30;
            }
        }
    });

    // Check collectible collisions
    collectibles.forEach(collectible => {
        if (
            !collectible.collected &&
            player.x < collectible.x + collectible.width &&
            player.x + player.width > collectible.x &&
            player.y < collectible.y + collectible.height &&
            player.y + player.height > collectible.y
        ) {
            collectible.collected = true;
            if (collectible.type === "coin") {
                score += 100;
            } else if (collectible.type === "health") {
                health = Math.min(100, health + 25);
            } else if (collectible.type === "gem") {
                score += collectible.value || 500;
            }
        }
    });

    // Check checkpoint collisions
    checkpoints.forEach(checkpoint => {
        if (
            !checkpoint.activated &&
            player.x < checkpoint.x + checkpoint.width &&
            player.x + player.width > checkpoint.x &&
            player.y < checkpoint.y + checkpoint.height &&
            player.y + player.height > checkpoint.y
        ) {
            checkpoint.activated = true;
        }
    });

    // Check portal collisions
    portals.forEach(portal => {
        if (
            player.x < portal.x + portal.width &&
            player.x + player.width > portal.x &&
            player.y < portal.y + portal.height &&
            player.y + player.height > portal.y
        ) {
            if (portal.isFinal) {
                // Game completion
                score += 1000; // Bonus for completing all levels
                loadLevel(1);
            } else {
                loadLevel(portal.targetLevel);
            }
        }
    });

    // Check enemy collisions
    enemies.forEach(enemy => {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y &&
            !player.invincible
        ) {
            takeDamage(15);
            // Knockback effect
            player.velY = -10;
            player.x += (player.x < enemy.x + enemy.width/2) ? -30 : 30;
        }
    });

    // Check projectile collisions
    projectiles.forEach((proj, index) => {
        if (
            player.x < proj.x + proj.width &&
            player.x + player.width > proj.x &&
            player.y < proj.y + proj.height &&
            player.y + player.height > proj.y &&
            !player.invincible
        ) {
            takeDamage(10);
            // Remove projectile
            projectiles.splice(index, 1);
            // Knockback effect
            player.velY = -8;
            player.x += (proj.dir > 0) ? -20 : 20;
        }
    });

    // Boundary checks
    if (player.y > canvas.height) {
        takeDamage(25);
        resetToCheckpoint();
    }
    
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function updatePlatforms(deltaTime) {
    platforms.forEach(platform => {
        if (platform.type === "moving") {
            platform.x += platform.dir * platform.speed;
            
            // Reverse direction at boundaries
            if (platform.x > platform.xEnd || platform.x < platform.xStart) {
                platform.dir *= -1;
            }
        }
    });
}

function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        // Patrol enemy movement
        if (enemy.type === "patrol") {
            enemy.x += enemy.dir * enemy.speed;
            
            // Reverse direction at boundaries
            if (enemy.x > enemy.xEnd || enemy.x < enemy.xStart) {
                enemy.dir *= -1;
            }
        }
        
        // Shooter enemy behavior
        if (enemy.type === "shooter") {
            enemy.lastShot = (enemy.lastShot || 0) + deltaTime;
            if (enemy.lastShot >= enemy.fireRate) {
                enemy.lastShot = 0;
                const dir = player.x < enemy.x ? -1 : 1;
                projectiles.push({
                    x: enemy.x + enemy.width/2,
                    y: enemy.y + enemy.height/2,
                    width: 10,
                    height: 10,
                    color: "#E74C3C",
                    speed: 5,
                    dir: dir
                });
            }
        }
        
        // Jumper enemy behavior
        if (enemy.type === "jumper") {
            enemy.lastJump = (enemy.lastJump || 0) + deltaTime;
            if (enemy.lastJump >= enemy.jumpDelay) {
                enemy.lastJump = 0;
                enemy.velY = enemy.jumpForce;
            }
            
            // Apply gravity
            enemy.velY = (enemy.velY || 0) + gravity;
            enemy.y += enemy.velY;
            
            // Check platform collisions
            platforms.forEach(platform => {
                if (
                    enemy.x < platform.x + platform.width &&
                    enemy.x + enemy.width > platform.x &&
                    enemy.y + enemy.height > platform.y &&
                    enemy.y + enemy.height < platform.y + platform.height &&
                    enemy.velY > 0
                ) {
                    enemy.y = platform.y - enemy.height;
                    enemy.velY = 0;
                }
            });
        }
    });
}

function updateProjectiles(deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.dir * proj.speed;
        
        // Remove projectiles that go off-screen
        if (proj.x < 0 || proj.x > canvas.width) {
            projectiles.splice(i, 1);
        }
    }
}

function takeDamage(amount) {
    if (!player.invincible) {
        health -= amount;
        player.invincible = true;
        player.invincibleTimer = 1000; // 1 second invincibility
        
        if (health <= 0) {
            health = 0;
            gameOver = true;
            gameOverScreen.style.display = "flex";
            finalScoreDisplay.textContent = score;
        }
    }
}

function resetToCheckpoint() {
    const activeCheckpoint = checkpoints.find(cp => cp.activated);
    if (activeCheckpoint && activeCheckpoint.respawnX && activeCheckpoint.respawnY) {
        player.x = activeCheckpoint.respawnX;
        player.y = activeCheckpoint.respawnY;
    } else {
        player.x = levels[currentLevel](canvas).startPos.x;
        player.y = levels[currentLevel](canvas).startPos.y;
    }
    player.velY = 0;
    player.jumping = false;
    player.invincible = true;
    player.invincibleTimer = 1000;
}

function resetGame() {
    health = 100;
    score = 0;
    gameOver = false;
    gameOverScreen.style.display = "none";
    loadLevel(1);
    requestAnimationFrame(gameLoop);
}

function drawPlayer() {
    // Flash player when invincible
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = "#FF9999";
    } else {
        ctx.fillStyle = player.color;
    }
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw eyes to show direction
    ctx.fillStyle = "#FFFFFF";
    const eyeOffset = keys.left ? -5 : (keys.right ? 5 : 0);
    if (eyeOffset !== 0) {
        ctx.beginPath();
        ctx.arc(player.x + player.width/2 + eyeOffset, player.y + player.height/3, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Draw platform details
        if (platform.type === "bouncy") {
            ctx.fillStyle = "#FFFFFF";
            for (let i = 0; i < platform.width; i += 20) {
                ctx.beginPath();
                ctx.arc(platform.x + i + 10, platform.y + 5, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

function drawHazards() {
    hazards.forEach(hazard => {
        ctx.fillStyle = hazard.color;
        ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
        
        // Draw spike details
        if (hazard.type === "spikes") {
            ctx.fillStyle = "#7F8C8D";
            const spikeWidth = hazard.width / 5;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(hazard.x + i * spikeWidth, hazard.y + hazard.height);
                ctx.lineTo(hazard.x + (i + 0.5) * spikeWidth, hazard.y);
                ctx.lineTo(hazard.x + (i + 1) * spikeWidth, hazard.y + hazard.height);
                ctx.fill();
            }
        }
        
        // Draw lava details
        if (hazard.type === "lava") {
            ctx.fillStyle = "#C0392B";
            for (let i = 0; i < hazard.width; i += 30) {
                ctx.beginPath();
                ctx.arc(hazard.x + i + 15, hazard.y + 10, 10, 0, Math.PI);
                ctx.fill();
            }
        }
    });
}

function drawCollectibles() {
    collectibles.forEach(collectible => {
        if (!collectible.collected) {
            ctx.fillStyle = collectible.color;
            
            if (collectible.type === "coin") {
                // Draw coin
                ctx.beginPath();
                ctx.arc(collectible.x + collectible.width/2, collectible.y + collectible.height/2, 
                        collectible.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Coin shine
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.beginPath();
                ctx.arc(collectible.x + collectible.width/3, collectible.y + collectible.height/3, 
                        collectible.width/4, 0, Math.PI * 2);
                ctx.fill();
            } else if (collectible.type === "health") {
                // Draw health pack
                ctx.fillRect(collectible.x, collectible.y, collectible.width, collectible.height);
                
                // Draw plus sign
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(collectible.x + collectible.width/2 - 2, collectible.y + 2, 4, collectible.height - 4);
                ctx.fillRect(collectible.x + 2, collectible.y + collectible.height/2 - 2, collectible.width - 4, 4);
            } else if (collectible.type === "gem") {
                // Draw gem
                ctx.beginPath();
                ctx.moveTo(collectible.x + collectible.width/2, collectible.y);
                ctx.lineTo(collectible.x + collectible.width, collectible.y + collectible.height/2);
                ctx.lineTo(collectible.x + collectible.width/2, collectible.y + collectible.height);
                ctx.lineTo(collectible.x, collectible.y + collectible.height/2);
                ctx.closePath();
                ctx.fill();
                
                // Gem shine
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.beginPath();
                ctx.moveTo(collectible.x + collectible.width/2, collectible.y + 5);
                ctx.lineTo(collectible.x + collectible.width - 5, collectible.y + collectible.height/2);
                ctx.lineTo(collectible.x + collectible.width/2, collectible.y + collectible.height - 5);
                ctx.lineTo(collectible.x + 5, collectible.y + collectible.height/2);
                ctx.closePath();
                ctx.fill();
            }
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw enemy eyes
        ctx.fillStyle = "#FFFFFF";
        const eyeOffset = enemy.dir === -1 ? -5 : (enemy.dir === 1 ? 5 : 0);
        if (enemy.type === "patrol" || enemy.type === "shooter") {
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2 + eyeOffset, enemy.y + enemy.height/3, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === "jumper") {
            // Draw jumper enemy with mouth
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/3, enemy.y + enemy.height/3, 3, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width*2/3, enemy.y + enemy.height/3, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height*2/3, 5, 0, Math.PI);
            ctx.fill();
        }
    });
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.width/2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPortals() {
    portals.forEach(portal => {
        // Portal outer ring
        ctx.fillStyle = portal.color;
        ctx.beginPath();
        ctx.arc(portal.x + portal.width/2, portal.y + portal.height/2, portal.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal inner ring
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(portal.x + portal.width/2, portal.y + portal.height/2, portal.width/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal swirl
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(portal.x + portal.width/2, portal.y + portal.height/2, portal.width/3, 0, Math.PI * 1.5);
        ctx.stroke();
    });
}

function drawCheckpoints() {
    checkpoints.forEach(checkpoint => {
        // Flag pole
        ctx.fillStyle = "#7F8C8D";
        ctx.fillRect(checkpoint.x + checkpoint.width/2 - 2, checkpoint.y, 4, checkpoint.height);
        
        // Flag
        ctx.fillStyle = checkpoint.activated ? "#27AE60" : "#95A5A6";
        ctx.beginPath();
        ctx.moveTo(checkpoint.x + checkpoint.width/2, checkpoint.y);
        ctx.lineTo(checkpoint.x + checkpoint.width/2, checkpoint.y + checkpoint.height/3);
        ctx.lineTo(checkpoint.x + checkpoint.width, checkpoint.y + checkpoint.height/4);
        ctx.closePath();
        ctx.fill();
    });
}

function drawGameOver() {
    // Handled by HTML element
}

function initGame() {
    resizeCanvas(); 
    requestAnimationFrame(gameLoop);
}

initGame();



