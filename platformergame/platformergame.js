window.resetGame = resetGame;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const healthDisplay = document.getElementById("health");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");

// Fixed canvas size for consistent gameplay
function resizeCanvas() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    loadLevel(currentLevel);
}

// Game variables
let gravity = 0.5;
let score = 0;
let health = 150;
let gameOver = false;
let lastTime = 0;
let currentLevel = 1;
let isGameComplete = false;

// Player object
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

// Game objects
let platforms = [];
let hazards = [];
let collectibles = [];
let enemies = [];
let portals = [];
let checkpoints = [];
let projectiles = [];

// Create victory screen element
const victoryScreen = document.createElement("div");
victoryScreen.id = "victoryScreen";
victoryScreen.innerHTML = `
    <h1>CONGRATULATIONS!</h1>
    <p>Final Score: <span id="finalScoreVictory">0</span></p>
    <button onclick="resetGame()">Play Again</button>
`;
victoryScreen.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 30;
`;
document.body.appendChild(victoryScreen);

// Controls
let keys = {
    left: false,
    right: false,
    up: false
};

// Event listeners for keyboard controls
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;
    if (e.key === "ArrowUp") keys.up = true;
    if (e.key === "r" && (gameOver || isGameComplete)) resetGame();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowUp") keys.up = false;
});

function generateLevel(levelNum, canvas) {
    const level = {
        platforms: [],
        hazards: [],
        collectibles: [],
        enemies: [],
        portals: [],
        checkpoints: [],
        startPos: { x: 50, y: 100 }
    };

    // 1. Always create a safe starting area
    level.platforms.push({
        x: 0, y: canvas.height - 50, 
        width: 200, height: 20, 
        color: "#2ECC71", type: "normal"
    });

    // 2. Create a guaranteed path to the portal
    const pathSegments = 4 + levelNum;
    const segmentWidth = canvas.width / pathSegments;
    let lastX = 100;
    let lastY = canvas.height - 100;
    const minGap = 30;  // Minimum vertical gap between platforms
    const maxGap = 120; // Maximum vertical gap between platforms

    for (let i = 1; i < pathSegments; i++) {
        // Ensure reasonable gap between platforms
        let gap;
        if (lastY < 200) {
            // Near top - only allow downward jumps
            gap = minGap + Math.random() * (maxGap - minGap);
        } else if (lastY > canvas.height - 200) {
            // Near bottom - only allow upward jumps
            gap = -(minGap + Math.random() * (maxGap - minGap));
        } else {
            // Middle area - allow both directions
            gap = (Math.random() > 0.5 ? 1 : -1) * 
                  (minGap + Math.random() * (maxGap - minGap));
        }

        const newX = lastX + segmentWidth * (0.7 + Math.random() * 0.3);
        const newY = Math.max(
            100, // Minimum height
            Math.min(
                canvas.height - 150, // Maximum height
                lastY + gap
            )
        );


    // 3. Add the final platform leading to portal
    level.platforms.push({
        x: lastX,
        y: lastY,
        width: 150,
        height: 15,
        color: "#9B59B6",
        type: "normal"
    });

    // 4. Add decorative platforms (non-essential)
    const extraPlatforms = 7 + levelNum;
    for (let i = 0; i < extraPlatforms; i++) {
        level.platforms.push({
            x: Math.random() * (canvas.width - 100),
            y: 100 + Math.random() * (canvas.height - 250),
            width: 80 + Math.random() * 70,
            height: 15,
            color: ["#2ECC71", "#3498DB", "#9B59B6"][Math.floor(Math.random() * 3)],
            type: ["normal", "moving", "bouncy"][Math.floor(Math.random() * 3)],
            dir: Math.random() > 0.5 ? 1 : -1,
            speed: 1 + Math.random(),
            xStart: 0,
            xEnd: canvas.width - 150
        });
    }

    // 5. Place checkpoints only on solid ground
    const safePlatforms = level.platforms.filter(p => p.type === "normal");
    if (safePlatforms.length > 0) {
        const checkpointPlatform = safePlatforms[Math.floor(safePlatforms.length/2)];
        level.checkpoints.push({
            x: checkpointPlatform.x + checkpointPlatform.width/2 - 10,
            y: checkpointPlatform.y - 40,
            width: 20,
            height: 40,
            color: "#27AE60",
            activated: false
        });
    }

    
    // 6. Place collectibles only on reachable platforms - INCREASED CHANCE
    safePlatforms.forEach(platform => {
        if (Math.random() > 0.4) { // 60% chance per platform 
            level.collectibles.push({
                // Place collectibles near center of platforms
                x: platform.x + platform.width/2 - 7.5,
                y: platform.y - 25, 
                width: 15,
                height: 15,
                color: Math.random() > 0.7 ? "#E67E22" : "#F1C40F",
                type: Math.random() > 0.7 ? "health" : "coin",
                collected: false
            });
        }
    });

    // 7. Place portal at the end of the guaranteed path
    level.portals.push({
        x: lastX + 130,
        y: lastY - 60,
        width: 40,
        height: 60,
        color: "#F39C12",
        targetLevel: levelNum < 3 ? levelNum + 1 : 1,
        isFinal: levelNum >= 3
    });

      // 8. Add enemies with increased spawn chance
      const enemyChance = 0.25 + (levelNum * 0.05); // 25% base + 5% per level
      safePlatforms.forEach(platform => {
          if (!platform.isStarting && !platform.isFinal && Math.random() < enemyChance) {
              const enemyType = Math.random() > 0.7 ? "shooter" : 
                               Math.random() > 0.5 ? "jumper" : "patrol";
              
              const enemy = {
                  x: platform.x + platform.width/2 - 15,
                  y: platform.y - 40,
                  width: 30,
                  height: 40,
                  color: "#8B0000",
                  type: enemyType
              };
              
              if (enemyType === "patrol") {
                  enemy.speed = 1 + Math.random() * 2;
                  enemy.dir = Math.random() > 0.5 ? 1 : -1;
                  enemy.xStart = platform.x;
                  enemy.xEnd = platform.x + platform.width - enemy.width;
              } else if (enemyType === "shooter") {
                  enemy.fireRate = 2000 - (levelNum * 200); // Faster shooting at higher levels
                  enemy.lastShot = 0;
              } else if (enemyType === "jumper") {
                  enemy.jumpForce = -12 - (Math.random() * 3);
                  enemy.jumpDelay = 1500 + Math.random() * 1500;
                  enemy.velY = 0;
              }
              
              level.enemies.push(enemy);
          }
      });

    return level;
    }
}
// Load level function
function loadLevel(levelNum) {
    currentLevel = levelNum;
    levelDisplay.textContent = levelNum;
    
    const level = generateLevel(levelNum, canvas);
    platforms = JSON.parse(JSON.stringify(level.platforms));
    hazards = JSON.parse(JSON.stringify(level.hazards));
    collectibles = JSON.parse(JSON.stringify(level.collectibles));
    enemies = JSON.parse(JSON.stringify(level.enemies));
    portals = JSON.parse(JSON.stringify(level.portals));
    checkpoints = JSON.parse(JSON.stringify(level.checkpoints));
    projectiles = [];
    
    // Reset checkpoints
    checkpoints.forEach((cp, index) => {
        cp.activated = (currentLevel === 1 && index === 0);
    });

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

// Main game loop
function gameLoop(timestamp) {
    if (!gameOver && !isGameComplete) {
        const deltaTime = timestamp - lastTime || 0;
        lastTime = timestamp;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updatePlayer(deltaTime);
        updatePlatforms(deltaTime);
        updateEnemies(deltaTime);
        updateProjectiles(deltaTime);
        
        drawHazards();
        drawPlatforms();
        drawCollectibles();
        drawEnemies();
        drawProjectiles();
        drawPortals();
        drawCheckpoints();
        drawPlayer();
        
        healthDisplay.textContent = health;
        scoreDisplay.textContent = score;
    } else if (gameOver) {
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// Update player position and handle collisions
function updatePlayer(deltaTime) {
    
    if (player.invincible) {
        player.invincibleTimer -= deltaTime;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Checkpoint activation
    checkpoints.forEach(checkpoint => {
        if (!checkpoint.activated &&
            player.x + player.width > checkpoint.x &&
            player.x < checkpoint.x + checkpoint.width &&
            player.y + player.height > checkpoint.y &&
            player.y < checkpoint.y + checkpoint.height) {
            checkpoint.activated = true;
            checkpoint.respawnX = checkpoint.x + checkpoint.width/2 - player.width/2;
            checkpoint.respawnY = checkpoint.y - player.height;
        }
    });

    collectibles.forEach(collectible => {
        if (!collectible.collected &&
            player.x < collectible.x + collectible.width &&
            player.x + player.width > collectible.x &&
            player.y < collectible.y + collectible.height &&
            player.y + player.height > collectible.y) {
            collectible.collected = true;
            if (collectible.type === "coin") {
                score += 100;
            } else if (collectible.type === "health") {
                health = Math.min(150, health + 50); // Increased from 25 to 50
            }
        }
    });

    // Horizontal movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;

    // Jumping
    if (keys.up && !player.jumping) {
        player.velY = -15;
        player.jumping = true;
    }

    // Apply gravity
    player.velY += gravity;
    player.y += player.velY;

    // Platform collisions
    player.jumping = true;
    platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height &&
            player.velY > 0) {
            player.y = platform.y - player.height;
            player.velY = 0;
            player.jumping = false;
            
            if (platform.type === "bouncy") {
                player.velY = -20;
            }
        }
    });

    
function checkPlatformCollisions() {
    let onGround = false;
    player.jumping = true;

    platforms.forEach(platform => {
        // More precise collision check
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            player.y + player.height >= platform.y &&
            player.y < platform.y + platform.height &&
            player.velY > 0) {
            
            // Snap player to platform surface
            player.y = platform.y - player.height;
            player.velY = 0;
            player.jumping = false;
            onGround = true;

            // Bouncy platform effect
            if (platform.type === "bouncy") {
                player.velY = -20;
                player.jumping = true;
            }
        }
    });
}

    // Hazard collisions
    hazards.forEach(hazard => {
        if (player.x < hazard.x + hazard.width &&
            player.x + player.width > hazard.x &&
            player.y < hazard.y + hazard.height &&
            player.y + player.height > hazard.y &&
            !player.invincible) {
            takeDamage(hazard.type === "spikes" ? 20 : 10);
            
            if (hazard.type === "spikes") {
                player.velY = -10;
                player.x += (player.x < hazard.x + hazard.width/2) ? -30 : 30;
            }
        }
    });

    // Collectible collisions
    collectibles.forEach(collectible => {
        if (!collectible.collected &&
            player.x < collectible.x + collectible.width &&
            player.x + player.width > collectible.x &&
            player.y < collectible.y + collectible.height &&
            player.y + player.height > collectible.y) {
            collectible.collected = true;
            if (collectible.type === "coin") {
                score += 100;
            } else if (collectible.type === "health") {
                health = Math.min(100, health + 25);
            }
        }
    });

    // Portal collisions
    portals.forEach(portal => {
        if (player.x < portal.x + portal.width &&
            player.x + player.width > portal.x &&
            player.y < portal.y + portal.height &&
            player.y + player.height > portal.y) {
            if (portal.isFinal) {
                isGameComplete = true;
                document.getElementById("finalScoreVictory").textContent = score;
                victoryScreen.style.display = "flex";
                return;
            } else {
                loadLevel(portal.targetLevel);
            }
        }
    });

    // Enemy collisions
    enemies.forEach(enemy => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y &&
            !player.invincible) {
            takeDamage(5);
            player.velY = -10;
            player.x += (player.x < enemy.x + enemy.width/2) ? -30 : 30;
        }
    });

    // Projectile collisions
    projectiles.forEach((proj, index) => {
        if (player.x < proj.x + proj.width &&
            player.x + player.width > proj.x &&
            player.y < proj.y + proj.height &&
            player.y + player.height > proj.y &&
            !player.invincible) {
            takeDamage(5);
            projectiles.splice(index, 1);
            player.velY = -8;
            player.x += (proj.dir > 0) ? -20 : 20;
        }
    });

    // Boundary checks
    if (player.y > canvas.height) {
        takeDamage(10);
        resetToCheckpoint();
    }
    
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Update moving platforms
function updatePlatforms(deltaTime) {
    platforms.forEach(platform => {
        if (platform.type === "moving") {
            platform.x += platform.dir * platform.speed;
            
            if (platform.x > platform.xEnd || platform.x < platform.xStart) {
                platform.dir *= -1;
            }
        }
    });
}

// Update enemy behavior
function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        // Patrol enemy movement
        if (enemy.type === "patrol") {
            enemy.x += enemy.dir * enemy.speed;
            
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
            
            enemy.velY = (enemy.velY || 0) + gravity;
            enemy.y += enemy.velY;
            
            platforms.forEach(platform => {
                if (enemy.x < platform.x + platform.width &&
                    enemy.x + enemy.width > platform.x &&
                    enemy.y + enemy.height > platform.y &&
                    enemy.y + enemy.height < platform.y + platform.height &&
                    enemy.velY > 0) {
                    enemy.y = platform.y - enemy.height;
                    enemy.velY = 0;
                }
            });
        }
    });
}

// Update projectiles
function updateProjectiles(deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.dir * proj.speed;
        
        if (proj.x < 0 || proj.x > canvas.width) {
            projectiles.splice(i, 1);
        }
    }
}

// Handle damage to player
function takeDamage(amount) {
    if (!player.invincible) {
        health -= amount;
        player.invincible = true;
        player.invincibleTimer = 1000;
        
        if (health <= 0) {
            health = 0;
            gameOver = true;
            gameOverScreen.style.display = "flex";
            finalScoreDisplay.textContent = score;
        }
    }
}

// Reset player to last checkpoint
function resetToCheckpoint() {
    const activeCheckpoint = checkpoints.find(cp => cp.activated);
    if (activeCheckpoint) {
        player.x = activeCheckpoint.respawnX || (activeCheckpoint.x + activeCheckpoint.width/2 - player.width/2);
        player.y = activeCheckpoint.respawnY || (activeCheckpoint.y - player.height);
    } else {
        player.x = 50;
        player.y = 100;
    }
    player.velY = 0;
    player.jumping = false;
    player.invincible = true;
    player.invincibleTimer = 1000;
}

// Reset entire game
function resetGame() {
    health = 150;
    score = 0;
    currentLevel = 1;
    gameOver = false;
    isGameComplete = false;
    gameOverScreen.style.display = "none";
    victoryScreen.style.display = "none";
    loadLevel(currentLevel);
}

// Drawing functions
function drawPlayer() {
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = "#FF9999";
    } else {
        ctx.fillStyle = player.color;
    }
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
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
                ctx.beginPath();
                ctx.arc(collectible.x + collectible.width/2, collectible.y + collectible.height/2, 
                        collectible.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.beginPath();
                ctx.arc(collectible.x + collectible.width/3, collectible.y + collectible.height/3, 
                        collectible.width/4, 0, Math.PI * 2);
                ctx.fill();
            } else if (collectible.type === "health") {
                ctx.fillRect(collectible.x, collectible.y, collectible.width, collectible.height);
                
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(collectible.x + collectible.width/2 - 2, collectible.y + 2, 4, collectible.height - 4);
                ctx.fillRect(collectible.x + 2, collectible.y + collectible.height/2 - 2, collectible.width - 4, 4);
            }
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        ctx.fillStyle = "#FFFFFF";
        const eyeOffset = enemy.dir === -1 ? -5 : (enemy.dir === 1 ? 5 : 0);
        if (enemy.type === "patrol" || enemy.type === "shooter") {
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/2 + eyeOffset, enemy.y + enemy.height/3, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === "jumper") {
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.width/3, enemy.y + enemy.height/3, 3, 0, Math.PI * 2);
            ctx.arc(enemy.x + enemy.width*2/3, enemy.y + enemy.height/3, 3, 0, Math.PI * 2);
            ctx.fill();
            
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
        ctx.fillStyle = portal.color;
        ctx.beginPath();
        ctx.arc(portal.x + portal.width/2, portal.y + portal.height/2, portal.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(portal.x + portal.width/2, portal.y + portal.height/2, portal.width/4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(portal.x + portal.width/2, portal.y + portal.height/2, portal.width/3, 0, Math.PI * 1.5);
        ctx.stroke();
    });
}

function drawCheckpoints() {
    checkpoints.forEach(checkpoint => {
        ctx.fillStyle = "#7F8C8D";
        ctx.fillRect(checkpoint.x + checkpoint.width/2 - 2, checkpoint.y, 4, checkpoint.height);
        
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

// Initialize the game
function initGame() {
    resizeCanvas();
    requestAnimationFrame(gameLoop);
}

// Start the game
initGame();