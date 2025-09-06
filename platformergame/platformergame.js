// Game Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const healthDisplay = document.getElementById("health");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const victoryScreen = document.getElementById("victoryScreen");

// Audio elements
const jumpSound = document.getElementById("jumpSound");
const coinSound = document.getElementById("coinSound");
const hurtSound = document.getElementById("hurtSound");
const levelSound = document.getElementById("levelSound");
const bgMusic = document.getElementById("bgMusic");

// Game Variables
let gravity = 0.5;
let score = 0;
let health = 150;
let gameOver = false;
let lastTime = 0;
let currentLevel = 1;
let isGameComplete = false;
let cameraOffset = { x: 0, y: 0 };

// Player Object
const player = {
    x: 50,
    y: 100,
    width: 30,
    height: 50,
    speed: 5,
    velY: 0,
    jumping: false,
    color: "#FF5555",
    invincible: false,
    invincibleTimer: 0,
    facing: 1, // 1 for right, -1 for left
    jumpEffect: false,
    shoveCooldown: 0,
    shovePower: 15,
    shoveRadius: 60,
};

// Game Objects
let platforms = [];
let hazards = [];
let collectibles = [];
let enemies = [];
let portals = [];
let checkpoints = [];
let projectiles = [];
let particles = [];

// Controls
let keys = {
    left: false,
    right: false,
    up: false
};

const GRAVITY = 0.5;
const MAX_FALL_SPEED = 15;
const JUMP_FORCE = -12;

// Event Listeners
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;
    if (e.key === "ArrowUp") keys.up = true;
    if (e.key === "r" && (gameOver || isGameComplete)) resetGame();
    if (e.key === "m") toggleMusic();
    if (e.key === "f") attemptShove();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowUp") keys.up = false;
});

function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play();
    } else {
        bgMusic.pause();
    }
}

// Particle system
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 2,
            color: color,
            speedX: Math.random() * 6 - 3,
            speedY: Math.random() * 6 - 3,
            life: 30 + Math.random() * 20
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x - cameraOffset.x, p.y - cameraOffset.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Predefined Levels 
function generateLevel(levelNum) {
    const level = {
        platforms: [],
        hazards: [],
        collectibles: [],
        enemies: [],
        portals: [],
        checkpoints: [],
        startPos: { x: 50, y: 100 }
    };

    // Base platform for all levels
    level.platforms.push({
        x: 0, y: canvas.height - 50, 
        width: 200, 
        height: 20, 
        color: "#2ECC71", 
        type: "normal"
    });

    // Add checkpoint
    level.checkpoints.push({
        x: canvas.width - 100,
        y: canvas.height - 150,
        width: 30,
        height: 50,
        activated: false
    });

    // Level-specific designs
    if (levelNum === 1) {
        // Level 1 - Basic introduction
        level.platforms.push(
            { x: 200, y: canvas.height - 100, width: 100, height: 15, color: "#2ECC71", type: "normal" },
            { x: 350, y: canvas.height - 150, width: 100, height: 15, color: "#3498DB", type: "normal" },
            { x: 500, y: canvas.height - 200, width: 100, height: 15, color: "#ec932cff", type: "normal" },
            { x: 650, y: canvas.height - 250, width: 100, height: 15, color: "#2ECC71", type: "normal" }
        );

        // Collectibles
        level.collectibles.push(
            { x: 250, y: canvas.height - 125, width: 20, height: 20, color: "#F1C40F", type: "coin", collected: false, rotation: 0 },
            { x: 400, y: canvas.height - 175, width: 20, height: 20, color: "#F1C40F", type: "coin", collected: false, rotation: 0 },
            { x: 550, y: canvas.height - 225, width: 20, height: 20, color: "#E67E22", type: "health", collected: false, rotation: 0 }
        );

        // Simple patrol enemy
        level.enemies.push({
            x: 400, y: canvas.height - 190, width: 30, height: 40, color: "#8B0000", type: "patrol",
            speed: 1.5, dir: 1, xStart: 350, xEnd: 450
        });

        // Portal at the end
        level.portals.push({
            x: 700, y: canvas.height - 310, width: 40, height: 60, color: "#F39C12",
            targetLevel: 2, isFinal: false
        });

    } else if (levelNum === 2) {
        // Level 2 - More challenging with moving platforms
        level.platforms.push(
            { x: 200, y: canvas.height - 100, width: 80, height: 15, color: "#3498DB", type: "moving", dir: 1, speed: 1.5, xStart: 200, xEnd: 350 },
            { x: 400, y: canvas.height - 150, width: 80, height: 15, color: "#9B59B6", type: "bouncy" },
            { x: 550, y: canvas.height - 200, width: 80, height: 15, color: "#2ECC71", type: "moving", dir: -1, speed: 1.5, xStart: 450, xEnd: 600 },
            { x: 700, y: canvas.height - 250, width: 80, height: 15, color: "#3498DB", type: "normal" }
        );

        // Collectibles
        level.collectibles.push(
            { x: 225, y: canvas.height - 125, width: 20, height: 20, color: "#F1C40F", type: "coin", collected: false, rotation: 0 },
            { x: 425, y: canvas.height - 175, width: 20, height: 20, color: "#22e67aff", type: "health", collected: false, rotation: 0 },
            { x: 575, y: canvas.height - 225, width: 20, height: 20, color: "#F1C40F", type: "coin", collected: false, rotation: 0 }
        );

        // Enemies
        level.enemies.push(
            {
                x: 425, y: canvas.height - 190, width: 30, height: 40, color: "#8B0000", type: "jumper",
                jumpForce: -14, jumpDelay: 2000, velY: 0, lastJump: Date.now()
            },
            {
                x: 725, y: canvas.height - 290, width: 30, height: 40, color: "#8B0000", type: "patrol",
                speed: 2, dir: -1, xStart: 650, xEnd: 750
            }
        );

        // Portal at the end
        level.portals.push({
            x: 750, y: canvas.height - 310, width: 40, height: 60, color: "#F39C12",
            targetLevel: 3, isFinal: false
        });

    } else if (levelNum === 3) {
        // Level 3 - Final challenge with shooter enemy
        level.platforms.push(
            { x: 200, y: canvas.height - 120, width: 70, height: 15, color: "#9B59B6", type: "bouncy" },
            { x: 350, y: canvas.height - 180, width: 70, height: 15, color: "#3498DB", type: "normal" },
            { x: 500, y: canvas.height - 240, width: 70, height: 15, color: "#2ECC71", type: "moving", dir: 1, speed: 2, xStart: 450, xEnd: 550 },
            { x: 650, y: canvas.height - 300, width: 70, height: 15, color: "#9B59B6", type: "bouncy" }
        );

        // Collectibles
        level.collectibles.push(
            { x: 225, y: canvas.height - 145, width: 20, height: 20, color: "#F1C40F", type: "coin", collected: false, rotation: 0 },
            { x: 375, y: canvas.height - 205, width: 20, height: 20, color: "#E67E22", type: "health", collected: false, rotation: 0 },
            { x: 525, y: canvas.height - 265, width: 20, height: 20, color: "#F1C40F", type: "coin", collected: false, rotation: 0 },
            { x: 675, y: canvas.height - 325, width: 20, height: 20, color: "#F1C40F", type: "coin", collected: false, rotation: 0 }
        );

        // Enemies
        level.enemies.push(
            {
                x: 375, y: canvas.height - 220, width: 30, height: 40, color: "#8B0000", type: "shooter",
                fireRate: 1500, lastShot: 0
            },
            {
                x: 675, y: canvas.height - 340, width: 30, height: 40, color: "#8B0000", type: "jumper",
                jumpForce: -16, jumpDelay: 1500, velY: 0, lastJump: Date.now()
            }
        );

        // Final portal
        level.portals.push({
            x: 700, y: canvas.height - 360, width: 40, height: 60, color: "#F39C12",
            targetLevel: 1, isFinal: true
        });
    }

    return level;
}

function attemptShove() {
    if (player.shoveCooldown > 0) return;
    
    // Play shove sound if available
    if (hurtSound) {
        hurtSound.currentTime = 0;
        hurtSound.play();
    }
    
    // Create shove particles
    createParticles(
        player.x + (player.facing > 0 ? player.width : 0), 
        player.y + player.height/2, 
        "#FF5555", 
        10
    );
    
    // Check for enemies in shove range
    let shovedEnemy = false;
    enemies.forEach(enemy => {
        const distX = enemy.x - player.x;
        const distY = enemy.y - player.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        
        // Check if enemy is in front of player and within radius
        if (distance < player.shoveRadius && 
            (player.facing > 0 ? distX > 0 : distX < 0)) {
            
            // Apply shove force
            enemy.x += player.facing * player.shovePower;
            enemy.velY = -5; // Small upward bump
            
            // For patrol enemies, reverse their direction
            if (enemy.type === "patrol") {
                enemy.dir *= -1;
            }
            
            // For shooter enemies, interrupt their shooting
            if (enemy.type === "shooter") {
                enemy.lastShot = Date.now();
            }
            
            shovedEnemy = true;
            createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, "#FF0000", 15);
        }
    });
    
    if (shovedEnemy) {
        player.shoveCooldown = 500; // 0.5 second cooldown
    }
}

// Camera system
function updateCamera() {
    // Center camera on player with some lead space
    const targetX = player.x - canvas.width/3;
    const targetY = player.y - canvas.height/2;
    
    // Smooth camera movement
    cameraOffset.x += (targetX - cameraOffset.x) * 0.1;
    cameraOffset.y += (targetY - cameraOffset.y) * 0.1;
    
    // Keep camera within bounds
    cameraOffset.x = Math.max(0, cameraOffset.x);
    cameraOffset.y = Math.max(0, cameraOffset.y);
}

// Load Level
function loadLevel(levelNum) {
    currentLevel = levelNum;
    levelDisplay.textContent = levelNum;
    levelSound.currentTime = 0;
    levelSound.play();
    
    const level = generateLevel(levelNum);
    platforms = JSON.parse(JSON.stringify(level.platforms));
    hazards = JSON.parse(JSON.stringify(level.hazards));
    collectibles = JSON.parse(JSON.stringify(level.collectibles));
    enemies = JSON.parse(JSON.stringify(level.enemies));
    portals = JSON.parse(JSON.stringify(level.portals));
    checkpoints = JSON.parse(JSON.stringify(level.checkpoints));
    projectiles = [];
    particles = [];
    
    // Set player position
    player.x = level.startPos.x;
    player.y = level.startPos.y;
    player.velY = 0;
    player.jumping = false;
    player.invincible = false;
    player.invincibleTimer = 0;
    
    // Reset camera
    cameraOffset = { x: 0, y: 0 };
}

// Game Loop
function gameLoop(timestamp) {
    if (!gameOver && !isGameComplete) {
        const deltaTime = timestamp - lastTime || 0;
        lastTime = timestamp;

        // Update player cooldowns
        if (player.shoveCooldown > 0) {
            player.shoveCooldown -= deltaTime;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Core game loop updates
        updateCamera();
        updateParallax();
        updatePlayer(deltaTime);
        updatePlatforms(deltaTime);
        updateEnemies(deltaTime);
        updateProjectiles(deltaTime);
        updateParticles();
        
        // Draw game elements
        drawPlatforms();
        drawCollectibles();
        drawEnemies();
        drawProjectiles();
        drawPortals();
        drawCheckpoints();
        drawPlayer();
        drawParticles();
        
        // Update UI
        healthDisplay.textContent = health;
        scoreDisplay.textContent = score;
        
    } else if (gameOver) {
        drawGameOver();
        gameOverScreen.style.display = "flex";
        finalScoreDisplay.textContent = score;
    } else if (isGameComplete) {
        victoryScreen.style.display = "flex";
        document.getElementById("finalScoreVictory").textContent = score;
    }

    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Add parallax effect
function updateParallax() {
    const layers = document.querySelectorAll('.bg-layer');
    const cameraX = cameraOffset.x;
    
    layers.forEach((layer, index) => {
        const speed = (index + 1) * 0.2;
        layer.style.transform = `translateX(${-cameraX * speed}px)`;
    });
}

// Update the gameLoop to include parallax
function gameLoop(timestamp) {
    if (!gameOver && !isGameComplete) {
        // ...existing code...
        updateParallax();
        // ...rest of gameLoop code...
    }
    requestAnimationFrame(gameLoop);
}

// Player Update
function updatePlayer(deltaTime) {
    if (player.invincible) {
        player.invincibleTimer -= deltaTime;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Horizontal movement
    if (keys.left) {
        player.x -= player.speed;
        player.facing = -1;
    }
    if (keys.right) {
        player.x += player.speed;
        player.facing = 1;
    }

    // Handle touch controls
    if (isTouchingLeft) keys.left = true;
    if (isTouchingRight) keys.right = true;

    // Apply gravity with terminal velocity
    player.velY = Math.min(player.velY + GRAVITY, MAX_FALL_SPEED);
    player.y += player.velY;

    // Jumping
    if (keys.up && !player.jumping) {
        player.velY = JUMP_FORCE;
        player.jumping = true;
        player.jumpEffect = true;
        setTimeout(() => player.jumpEffect = false, 300);
        jumpSound.currentTime = 0;
        jumpSound.play();
        createParticles(player.x + player.width/2, player.y + player.height, "#6e8efb", 10);
    }

    // Platform collisions
    player.jumping = true;
    platforms.forEach(platform => {
        // Check if player is above platform and falling
        if (player.velY > 0 && 
            player.y + player.height > platform.y && 
            player.y < platform.y &&
            player.x + player.width > platform.x && 
            player.x < platform.x + platform.width) {
            
            // Snap player to platform top
            player.y = platform.y - player.height;
            player.velY = 0;
            player.jumping = false;
            
            if (platform.type === "bouncy") {
                player.velY = -20;
                createParticles(player.x + player.width/2, player.y + player.height, "#a777e3", 15);
            }
        }
    });

    // Collectible collisions
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        if (!c.collected &&
            player.x + player.width > c.x &&
            player.x < c.x + c.width &&
            player.y + player.height > c.y &&
            player.y < c.y + c.height) {
            
            c.collected = true;
            if (c.type === "coin") {
                score += 100;
                coinSound.currentTime = 0;
                coinSound.play();
                createParticles(c.x + c.width/2, c.y + c.height/2, "#F1C40F", 15);
            } else if (c.type === "health") {
                health = Math.min(150, health + 50);
                coinSound.currentTime = 0;
                coinSound.play();
                createParticles(c.x + c.width/2, c.y + c.height/2, "#2ECC71", 15);
            }
            collectibles.splice(i, 1);
        }
    }

    // Enemy collisions
    enemies.forEach(enemy => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y &&
            !player.invincible) {
            takeDamage(10);
            player.velY = -10;
            player.x += (player.x < enemy.x + enemy.width/2) ? -30 : 30;
            createParticles(player.x + player.width/2, player.y + player.height/2, "#E74C3C", 20);
        }
    });

        
    portals.forEach(portal => {
        
        const portalX = portal.x - cameraOffset.x;
        const portalY = portal.y - cameraOffset.y;
        
        if (player.x < portalX + portal.width &&
            player.x + player.width > portalX &&
            player.y < portalY + portal.height &&
            player.y + player.height > portalY) {
            if (portal.isFinal) {
                isGameComplete = true;
                document.getElementById("finalScoreVictory").textContent = score;
                bgMusic.pause();
            } else {
                loadLevel(portal.targetLevel);
            }
        }
    });

    checkpoints.forEach(checkpoint => {
        // Apply camera offset to checkpoint position
        const checkpointX = checkpoint.x - cameraOffset.x;
        const checkpointY = checkpoint.y - cameraOffset.y;
        
        if (!checkpoint.activated &&
            player.x < checkpointX + checkpoint.width &&
            player.x + player.width > checkpointX &&
            player.y < checkpointY + checkpoint.height &&
            player.y + player.height > checkpointY) {
            checkpoint.activated = true;
            createParticles(checkpoint.x + checkpoint.width/2, checkpoint.y, "#27AE60", 30);
        }
    });

    // Projectile collisions (handled in updateProjectiles)
  
    if (player.y > canvas.height) {
        takeDamage(10);
        if (health > 0) {
            const spawnPoint = checkpoints.find(c => c.activated) || 
                            { x: 50, y: 100 };
            player.x = spawnPoint.x;
            player.y = spawnPoint.y;
            player.velY = 0;
        }
    }
    
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}


     for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        let onPlatform = false;
        
        platforms.forEach(platform => {
            if (enemy.x + enemy.width > platform.x && 
                enemy.x < platform.x + platform.width &&
                enemy.y + enemy.height >= platform.y && 
                enemy.y + enemy.height <= platform.y + platform.height) {
                onPlatform = true;
            }
        });
        
        if (!onPlatform && enemy.y < canvas.height) {
            enemy.velY += gravity;
            enemy.y += enemy.velY;
        }
        
        // Remove enemies that fall off screen
        if (enemy.y > canvas.height + 100) {
            enemies.splice(i, 1);
            score += 50; // Bonus for shoving off
            createParticles(enemy.x + enemy.width/2, canvas.height, "#FF0000", 20);
        }
    }

// Update Platforms
function updatePlatforms(deltaTime) {
    platforms.forEach(platform => {
        if (platform.type === "moving") {
            platform.x += platform.dir * platform.speed;
            
            if (platform.x <= platform.xStart || platform.x >= platform.xEnd) {
                platform.dir *= -1;
            }
        }
    });
}

// Update Enemies
function updateEnemies(deltaTime) {
    enemies.forEach(enemy => {
        switch(enemy.type) {
            case "patrol":
                enemy.x += enemy.dir * enemy.speed;
                
                if (enemy.x <= enemy.xStart || enemy.x >= enemy.xEnd) {
                    enemy.dir *= -1;
                }
                break;
                
            case "jumper":
                enemy.velY += gravity;
                enemy.y += enemy.velY;
                
                platforms.forEach(platform => {
                    if (enemy.x < platform.x + platform.width &&
                        enemy.x + enemy.width > platform.x &&
                        enemy.y + enemy.height > platform.y &&
                        enemy.y + enemy.height < platform.y + platform.height &&
                        enemy.velY > 0) {
                        enemy.y = platform.y - enemy.height;
                        enemy.velY = 0;
                        
                        if (Date.now() - enemy.lastJump > enemy.jumpDelay) {
                            enemy.velY = enemy.jumpForce;
                            enemy.lastJump = Date.now();
                            createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height, "#8B0000", 10);
                        }
                    }
                });
                break;
                
            case "shooter":
                if (Date.now() - enemy.lastShot > enemy.fireRate) {
                    projectiles.push({
                        x: enemy.x + enemy.width/2,
                        y: enemy.y + enemy.height/2,
                        width: 10,
                        height: 10,
                        dir: player.x < enemy.x ? -1 : 1,
                        speed: 5,
                        color: "#E74C3C"
                    });
                    enemy.lastShot = Date.now();
                    createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, "#E74C3C", 5);
                }
                break;
        }
    });
}

// Update Projectiles
function updateProjectiles(deltaTime) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.dir * proj.speed;
        
        if (proj.x < 0 || proj.x > canvas.width) {
            projectiles.splice(i, 1);
            continue;
        }
        
        if (!player.invincible &&
            player.x < proj.x + proj.width &&
            player.x + player.width > proj.x &&
            player.y < proj.y + proj.height &&
            player.y + player.height > proj.y) {
            takeDamage(5);
            projectiles.splice(i, 1);
            createParticles(proj.x, proj.y, "#E74C3C", 10);
        }
    }
}

// Damage system
function takeDamage(amount) {
    health -= amount;
    showDamageEffect();
    hurtSound.currentTime = 0;
    hurtSound.play();
    if (health <= 0) {
        health = 0;
        gameOver = true;
        gameOverScreen.style.display = "flex";
        finalScoreDisplay.textContent = score;
        bgMusic.pause();
    }
    player.invincible = true;
    player.invincibleTimer = 1000;
}

// DRAWING FUNCTIONS ==============================================

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x - cameraOffset.x, player.y - cameraOffset.y);
    
    // Apply jump effect if jumping
    if (player.jumpEffect) {
        ctx.scale(1, 0.9);
    }

    // Draw player with invincibility flash effect
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = "#FF9999";
    } else {
        ctx.fillStyle = player.color;
    }
    
    // Draw player body with rounded corners
    ctx.beginPath();
    ctx.roundRect(0, 0, player.width, player.height, [10, 10, 0, 0]);
    ctx.fill();
    
    // Draw player face (direction changes based on movement)
    ctx.fillStyle = "#FFFFFF";
    const eyeX = player.facing > 0 ? player.width/3 : player.width*2/3;
    
    // Eyes
    ctx.beginPath();
    ctx.arc(eyeX, player.height/3, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth (smile when moving)
    ctx.beginPath();
    if (keys.left || keys.right) {
        ctx.arc(eyeX, player.height*2/3, 7, 0, Math.PI);
    } else {
        ctx.arc(eyeX, player.height*2/3, 7, 0, Math.PI, true);
    }
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(player.width/2, player.height + 5, player.width/2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.save();
        ctx.translate(platform.x - cameraOffset.x, platform.y - cameraOffset.y);
        
        // Platform base
        ctx.fillStyle = platform.color;
        ctx.beginPath();
        ctx.roundRect(0, 0, platform.width, platform.height, 5);
        ctx.fill();
        
        // Platform decorations based on type
        switch(platform.type) {
            case "bouncy":
                // Bounce pads
                ctx.fillStyle = "#FFFFFF";
                for (let i = 0; i < platform.width; i += 20) {
                    ctx.beginPath();
                    ctx.arc(i + 10, 5, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case "moving":
                // Moving platform arrows
                ctx.fillStyle = "#FFFFFF";
                const arrowCount = Math.floor(platform.width / 30);
                for (let i = 0; i < arrowCount; i++) {
                    const x = i * 30 + 15;
                    ctx.beginPath();
                    ctx.moveTo(x, 5);
                    ctx.lineTo(x + (platform.dir * 10), 15);
                    ctx.lineTo(x - (platform.dir * 10), 15);
                    ctx.fill();
                }
                break;
                
            default:
                // Normal platform texture
                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                ctx.lineWidth = 1;
                for (let i = 0; i < platform.width; i += 15) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i, platform.height);
                    ctx.stroke();
                }
        }
        
        // Platform shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(platform.width/2, platform.height + 5, platform.width/2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function drawCollectibles() {
    collectibles.forEach(collectible => {
        if (!collectible.collected) {
            collectible.rotation += 0.05;
            ctx.save();
            ctx.translate(
                collectible.x + collectible.width/2 - cameraOffset.x,
                collectible.y + collectible.height/2 - cameraOffset.y
            );
            ctx.rotate(collectible.rotation);
            
            if (collectible.type === "coin") {
                // Gold coin with shine effect
                ctx.fillStyle = collectible.color;
                ctx.beginPath();
                ctx.arc(0, 0, collectible.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Shine effect
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.beginPath();
                ctx.arc(
                    -collectible.width/4, 
                    -collectible.height/4, 
                    collectible.width/6, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
                
                // Coin outline
                ctx.strokeStyle = "#D4AF37";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, collectible.width/2, 0, Math.PI * 2);
                ctx.stroke();
                
                // Glow effect
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, collectible.width/2 + 5);
                gradient.addColorStop(0, "rgba(255,215,0,0.5)");
                gradient.addColorStop(1, "rgba(255,215,0,0)");
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, collectible.width/2 + 5, 0, Math.PI * 2);
                ctx.fill();
                
            } else if (collectible.type === "health") {
                // Health pack with cross
                ctx.fillStyle = collectible.color;
                ctx.beginPath();
                ctx.roundRect(-collectible.width/2, -collectible.height/2, collectible.width, collectible.height, 5);
                ctx.fill();
                
                // White cross
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(
                    -2, 
                    -collectible.height/2 + 2, 
                    4, 
                    collectible.height - 4
                );
                ctx.fillRect(
                    -collectible.width/2 + 2, 
                    -2, 
                    collectible.width - 4, 
                    4
                );
                
                // Plus sign effect
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.fillRect(
                    -collectible.width/4, 
                    -2, 
                    collectible.width/2, 
                    4
                );
                ctx.fillRect(
                    -2, 
                    -collectible.height/4, 
                    4, 
                    collectible.height/2
                );
                
                // Glow effect
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, collectible.width/2 + 5);
                gradient.addColorStop(0, "rgba(46,204,113,0.3)");
                gradient.addColorStop(1, "rgba(46,204,113,0)");
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, collectible.width/2 + 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x - cameraOffset.x, enemy.y - cameraOffset.y);
        
        // Enemy body with rounded top
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.roundRect(0, 0, enemy.width, enemy.height, [10, 10, 0, 0]);
        ctx.fill();
        
        // Enemy face based on type
        ctx.fillStyle = "#FFFFFF";
        switch(enemy.type) {
            case "patrol":
                // Simple eyes looking in movement direction
                const eyeX = enemy.width/2 + (enemy.dir * 5);
                ctx.beginPath();
                ctx.arc(eyeX, enemy.height/3, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Angry eyebrows
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(eyeX - 8, enemy.height/4);
                ctx.lineTo(eyeX + 8, enemy.height/4);
                ctx.stroke();
                break;
                
            case "jumper":
                // Two eyes and mouth
                ctx.beginPath();
                ctx.arc(enemy.width/3, enemy.height/3, 3, 0, Math.PI * 2);
                ctx.arc(enemy.width*2/3, enemy.height/3, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Angry mouth
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(enemy.width/3, enemy.height*2/3);
                ctx.lineTo(enemy.width*2/3, enemy.height*2/3);
                ctx.stroke();
                break;
                
            case "shooter":
                // Single cyclops eye
                ctx.beginPath();
                ctx.arc(enemy.width/2, enemy.height/3, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Angry eyebrows
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(enemy.width/3, enemy.height/4);
                ctx.lineTo(enemy.width*2/3, enemy.height/4);
                ctx.stroke();
                break;
        }
        
        // Enemy shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(enemy.width/2, enemy.height + 5, enemy.width/2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x - cameraOffset.x, proj.y - cameraOffset.y);
        
        // Glowing projectile with trail effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, proj.width/2);
        gradient.addColorStop(0, proj.color);
        gradient.addColorStop(1, "rgba(231, 76, 60, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, proj.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect
        ctx.strokeStyle = `rgba(231, 76, 60, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(- (proj.dir * 10), 0);
        ctx.lineTo(0, 0);
        ctx.stroke();
        
        ctx.restore();
    });
}

function drawPortals() {
    portals.forEach(portal => {
        ctx.save();
        ctx.translate(portal.x + portal.width/2 - cameraOffset.x, portal.y + portal.height/2 - cameraOffset.y);
        
        // Outer glow
        const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, portal.width/2);
        outerGradient.addColorStop(0, portal.color);
        outerGradient.addColorStop(1, "rgba(243, 156, 18, 0)");
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, portal.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner portal
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(0, 0, portal.width/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Swirling effect
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, portal.width/3, 
                    (Date.now()/500 + i) % (Math.PI * 2), 
                    (Date.now()/500 + i + 1) % (Math.PI * 2)
            );
            ctx.stroke();
        }
        
        // Final portal effect
        if (portal.isFinal) {
            ctx.strokeStyle = "rgba(46, 204, 113, 0.7)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, portal.width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    });
}

function drawCheckpoints() {
    checkpoints.forEach(checkpoint => {
        ctx.save();
        ctx.translate(checkpoint.x - cameraOffset.x, checkpoint.y - cameraOffset.y);
        
        // Checkpoint pole
        ctx.fillStyle = "#7F8C8D";
        ctx.fillRect(
            checkpoint.width/2 - 2, 
            0, 
            4, 
            checkpoint.height
        );
        
        // Checkpoint flag
        ctx.fillStyle = checkpoint.activated ? "#27AE60" : "#95A5A6";
        ctx.beginPath();
        ctx.moveTo(checkpoint.width/2, 0);
        ctx.lineTo(checkpoint.width/2, checkpoint.height/3);
        ctx.lineTo(checkpoint.width, checkpoint.height/4);
        ctx.closePath();
        ctx.fill();
        
        // Flag symbol
        if (checkpoint.activated) {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px Arial";
            ctx.fillText("✓", checkpoint.width/2 + 10, checkpoint.height/4 + 5);
            
            // Activation glow
            const gradient = ctx.createRadialGradient(
                checkpoint.width/2, 
                checkpoint.height/3, 
                0,
                checkpoint.width/2, 
                checkpoint.height/3, 
                20
            );
            gradient.addColorStop(0, "rgba(39, 174, 96, 0.5)");
            gradient.addColorStop(1, "rgba(39, 174, 96, 0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(checkpoint.width/2, checkpoint.height/3, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    });
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function initGame() {
    // Canvas setup
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Add rounded rect support
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
    
    // Start background music
    bgMusic.volume = 1;
    bgMusic.play();
    
    // Load first level
    loadLevel(1);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
    // Initialize canvas size
    resizeCanvas();
    
    // Initialize game
    initGame();
});

// Damage effect
function showDamageEffect() {
    const effect = document.getElementById('damage-effect');
    effect.style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
    setTimeout(() => {
        effect.style.backgroundColor = 'rgba(231, 76, 60, 0)';
    }, 300);
}

// Reset game function
function resetGame() {
    score = 0;
    health = 150;
    gameOver = false;
    isGameComplete = false;
    gameOverScreen.style.display = "none";
    victoryScreen.style.display = "none";
    loadLevel(1);
    bgMusic.currentTime = 0;
    bgMusic.play();
}

// Start the game
initGame();
