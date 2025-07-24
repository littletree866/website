// Game Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const healthDisplay = document.getElementById("health");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const victoryScreen = document.getElementById("victoryScreen");

// Game Variables
let gravity = 0.5;
let score = 0;
let health = 150;
let gameOver = false;
let lastTime = 0;
let currentLevel = 1;
let isGameComplete = false;

// Player Object
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

// Game Objects
let platforms = [];
let hazards = [];
let collectibles = [];
let enemies = [];
let portals = [];
let checkpoints = [];
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
    if (e.key === "r" && (gameOver || isGameComplete)) resetGame();
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowUp") keys.up = false;
});

// Level Generation
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

    level.checkpoints.push({
        x: canvas.width - 100,
        y: canvas.height - 150,
        width: 30,
        height: 50,
        activated: false
    });

    // Base platform
    level.platforms.push({
        x: 0, y: canvas.height - 50, 
        width: 200, height: 20, 
        color: "#2ECC71", type: "normal"
    });

    // Generate platforms
    const platformCount = 5 + levelNum;
    let lastX = 100;
    let lastY = canvas.height - 100;
    
    for (let i = 0; i < platformCount; i++) {
        const platformWidth = 80 + Math.random() * 70;
        const platformX = lastX + 150 + Math.random() * 100;
        const platformY = Math.max(
            100, 
            Math.min(
                canvas.height - 150,
                lastY + (Math.random() > 0.5 ? -1 : 1) * (50 + Math.random() * 100)
            )
        );
        
        level.platforms.push({
            x: platformX,
            y: platformY,
            width: platformWidth,
            height: 15,
            color: ["#2ECC71", "#3498DB", "#9B59B6"][Math.floor(Math.random() * 3)],
            type: ["normal", "moving", "bouncy"][Math.floor(Math.random() * 3)],
            dir: Math.random() > 0.5 ? 1 : -1,
            speed: 1 + Math.random(),
            xStart: platformX - 50,
            xEnd: platformX + 50
        });
        
        lastX = platformX;
        lastY = platformY;
    }

    // Add portal at last platform
    level.portals.push({
        x: lastX + 30,
        y: lastY - 60,
        width: 40,
        height: 60,
        color: "#F39C12",
        targetLevel: levelNum < 3 ? levelNum + 1 : 1,
        isFinal: levelNum >= 3
    });

    // Add collectibles
    level.platforms.forEach(platform => {
        if (Math.random() > 0.5) {
            level.collectibles.push({
                x: platform.x + platform.width/2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                color: Math.random() > 0.7 ? "#E67E22" : "#F1C40F",
                type: Math.random() > 0.7 ? "health" : "coin",
                collected: false
            });
        }
    });

    // Add enemies
    level.platforms.slice(1).forEach(platform => {
        if (Math.random() > 0.6) {
            const enemyType = ["patrol", "jumper", "shooter"][Math.floor(Math.random() * 3)];
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
                enemy.fireRate = 2000;
                enemy.lastShot = 0;
                   
            } else if (enemyType === "jumper") {
                enemy.jumpForce = -12;
                enemy.jumpDelay = 1500 + Math.random() * 1500;
                enemy.velY = 0;
                enemy.lastJump = Date.now(); 
            }
            
            level.enemies.push(enemy);
        }
    });

    return level;
}

// Load Level
function loadLevel(levelNum) {
    currentLevel = levelNum;
    levelDisplay.textContent = levelNum;
    
    const level = generateLevel(levelNum);
    platforms = JSON.parse(JSON.stringify(level.platforms));
    hazards = JSON.parse(JSON.stringify(level.hazards));
    collectibles = JSON.parse(JSON.stringify(level.collectibles));
    enemies = JSON.parse(JSON.stringify(level.enemies));
    portals = JSON.parse(JSON.stringify(level.portals));
    checkpoints = JSON.parse(JSON.stringify(level.checkpoints));
    projectiles = [];
    
    // Set player position
    player.x = level.startPos.x;
    player.y = level.startPos.y;
    player.velY = 0;
    player.jumping = false;
    player.invincible = false;
    player.invincibleTimer = 0;
}

// Game Loop
function gameLoop(timestamp) {
    if (!gameOver && !isGameComplete) {
        const deltaTime = timestamp - lastTime || 0;
        lastTime = timestamp;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updatePlayer(deltaTime);
        updatePlatforms(deltaTime);
        updateEnemies(deltaTime);
        updateProjectiles(deltaTime);
        
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
    } else if (isGameComplete) {
        victoryScreen.style.display = "flex";
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
                health = Math.min(150, health + 50);
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
            takeDamage(10);
            player.velY = -10;
            player.x += (player.x < enemy.x + enemy.width/2) ? -30 : 30;
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
            } else {
                loadLevel(portal.targetLevel);
            }
        }
    });

    // Boundary checks
    if (player.y > canvas.height) {
        takeDamage(10);
        player.x = 50;
        player.y = 100;
        player.velY = 0;
    }
    
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Update Platforms
function updatePlatforms(deltaTime) {
    platforms.forEach(platform => {
        if (platform.type === "moving") {
            // Update moving platforms
            platform.x += platform.dir * platform.speed;
            
            // Reverse direction if reached bounds
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
                // Move patrol enemy back and forth
                enemy.x += enemy.dir * enemy.speed;
                
                // Reverse direction at bounds
                if (enemy.x <= enemy.xStart || enemy.x >= enemy.xEnd) {
                    enemy.dir *= -1;
                }
                break;
                
            case "jumper":
                // Handle jumping enemy
                enemy.velY += gravity;
                enemy.y += enemy.velY;
                
                // Check if on ground and ready to jump
                platforms.forEach(platform => {
                    if (enemy.x < platform.x + platform.width &&
                        enemy.x + enemy.width > platform.x &&
                        enemy.y + enemy.height > platform.y &&
                        enemy.y + enemy.height < platform.y + platform.height &&
                        enemy.velY > 0) {
                        enemy.y = platform.y - enemy.height;
                        enemy.velY = 0;
                        
                        // Jump after delay
                        if (Date.now() - enemy.lastJump > enemy.jumpDelay) {
                            enemy.velY = enemy.jumpForce;
                            enemy.lastJump = Date.now();
                        }
                    }
                });
                break;
                
            case "shooter":
                // Handle shooting enemy
                if (Date.now() - enemy.lastShot > enemy.fireRate) {
                    // Create new projectile
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
        
        // Remove projectiles that go off screen
        if (proj.x < 0 || proj.x > canvas.width) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // Check for player collision
        if (!player.invincible &&
            player.x < proj.x + proj.width &&
            player.x + player.width > proj.x &&
            player.y < proj.y + proj.height &&
            player.y + player.height > proj.y) {
            takeDamage(5);
            projectiles.splice(i, 1);
        }
    }
}

// Damage system
function takeDamage(amount) {
    health -= amount;
    showDamageEffect();
    if (health <= 0) {
        health = 0;
        gameOver = true;
        gameOverScreen.style.display = "flex";
        finalScoreDisplay.textContent = score;
    }
    player.invincible = true;
    player.invincibleTimer = 1000; // 1 second invincibility
}

// DRAWING FUNCTIONS ==============================================

function drawPlayer() {
    // Draw player with invincibility flash effect
    if (player.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = "#FF9999"; // Flash color when invincible
    } else {
        ctx.fillStyle = player.color;
    }
    
    // Draw player body
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw player face (direction changes based on movement)
    ctx.fillStyle = "#FFFFFF";
    const eyeOffset = keys.left ? -5 : (keys.right ? 5 : 0);
    if (eyeOffset !== 0) {
        // Eyes
        ctx.beginPath();
        ctx.arc(player.x + player.width/2 + eyeOffset, player.y + player.height/3, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth (smile when moving)
        ctx.beginPath();
        ctx.arc(player.x + player.width/2 + eyeOffset, player.y + player.height*2/3, 7, 0, Math.PI);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawPlatforms() {
    platforms.forEach(platform => {
        // Platform base
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform decorations based on type
        switch(platform.type) {
            case "bouncy":
                // Bounce pads
                ctx.fillStyle = "#FFFFFF";
                for (let i = 0; i < platform.width; i += 20) {
                    ctx.beginPath();
                    ctx.arc(platform.x + i + 10, platform.y + 5, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case "moving":
                // Moving platform arrows
                ctx.fillStyle = "#FFFFFF";
                const arrowCount = Math.floor(platform.width / 30);
                for (let i = 0; i < arrowCount; i++) {
                    const x = platform.x + (i * 30) + 15;
                    ctx.beginPath();
                    ctx.moveTo(x, platform.y + 5);
                    ctx.lineTo(x + (platform.dir * 10), platform.y + 15);
                    ctx.lineTo(x - (platform.dir * 10), platform.y + 15);
                    ctx.fill();
                }
                break;
                
            default:
                // Normal platform texture
                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                ctx.lineWidth = 1;
                for (let i = 0; i < platform.width; i += 15) {
                    ctx.beginPath();
                    ctx.moveTo(platform.x + i, platform.y);
                    ctx.lineTo(platform.x + i, platform.y + platform.height);
                    ctx.stroke();
                }
        }
    });
}

function drawCollectibles() {
    collectibles.forEach(collectible => {
        if (!collectible.collected) {
            ctx.fillStyle = collectible.color;
            
            if (collectible.type === "coin") {
                // Gold coin with shine effect
                ctx.beginPath();
                ctx.arc(
                    collectible.x + collectible.width/2, 
                    collectible.y + collectible.height/2, 
                    collectible.width/2, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
                
                // Shine effect
                ctx.fillStyle = "rgba(255,255,255,0.7)";
                ctx.beginPath();
                ctx.arc(
                    collectible.x + collectible.width/3, 
                    collectible.y + collectible.height/3, 
                    collectible.width/4, 
                    0, 
                    Math.PI * 2
                );
                ctx.fill();
                
                // Coin outline
                ctx.strokeStyle = "#D4AF37";
                ctx.lineWidth = 2;
                ctx.stroke();
                
            } else if (collectible.type === "health") {
                // Health pack with cross
                ctx.fillRect(collectible.x, collectible.y, collectible.width, collectible.height);
                
                // White cross
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(
                    collectible.x + collectible.width/2 - 2, 
                    collectible.y + 2, 
                    4, 
                    collectible.height - 4
                );
                ctx.fillRect(
                    collectible.x + 2, 
                    collectible.y + collectible.height/2 - 2, 
                    collectible.width - 4, 
                    4
                );
            }
        }
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        // Enemy body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Enemy face based on type
        ctx.fillStyle = "#FFFFFF";
        switch(enemy.type) {
            case "patrol":
                // Simple eyes looking in movement direction
                const eyeX = enemy.x + enemy.width/2 + (enemy.dir * 5);
                ctx.beginPath();
                ctx.arc(eyeX, enemy.y + enemy.height/3, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case "jumper":
                // Two eyes and mouth
                ctx.beginPath();
                ctx.arc(enemy.x + enemy.width/3, enemy.y + enemy.height/3, 3, 0, Math.PI * 2);
                ctx.arc(enemy.x + enemy.width*2/3, enemy.y + enemy.height/3, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Angry mouth
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/3, enemy.y + enemy.height*2/3);
                ctx.lineTo(enemy.x + enemy.width*2/3, enemy.y + enemy.height*2/3);
                ctx.stroke();
                break;
                
            case "shooter":
                // Single cyclops eye
                ctx.beginPath();
                ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/3, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Angry eyebrows
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/3, enemy.y + enemy.height/4);
                ctx.lineTo(enemy.x + enemy.width*2/3, enemy.y + enemy.height/4);
                ctx.stroke();
                break;
        }
    });
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        // Glowing projectile with trail effect
        const gradient = ctx.createRadialGradient(
            proj.x, proj.y, 0,
            proj.x, proj.y, proj.width/2
        );
        gradient.addColorStop(0, proj.color);
        gradient.addColorStop(1, "rgba(231, 76, 60, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect
        ctx.strokeStyle = `rgba(231, 76, 60, 0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(proj.x - (proj.dir * 10), proj.y);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
    });
}

function drawPortals() {
    portals.forEach(portal => {
        // Outer glow
        const outerGradient = ctx.createRadialGradient(
            portal.x + portal.width/2, 
            portal.y + portal.height/2, 
            0,
            portal.x + portal.width/2, 
            portal.y + portal.height/2, 
            portal.width/2
        );
        outerGradient.addColorStop(0, portal.color);
        outerGradient.addColorStop(1, "rgba(243, 156, 18, 0)");
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(
            portal.x + portal.width/2, 
            portal.y + portal.height/2, 
            portal.width/2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Inner portal
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(
            portal.x + portal.width/2, 
            portal.y + portal.height/2, 
            portal.width/4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Swirling effect
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
                portal.x + portal.width/2, 
                portal.y + portal.height/2, 
                portal.width/3, 
                (Date.now()/500 + i) % (Math.PI * 2), 
                (Date.now()/500 + i + 1) % (Math.PI * 2)
            );
            ctx.stroke();
        }
    });
}

function drawCheckpoints() {
    checkpoints.forEach(checkpoint => {
        // Checkpoint pole
        ctx.fillStyle = "#7F8C8D";
        ctx.fillRect(
            checkpoint.x + checkpoint.width/2 - 2, 
            checkpoint.y, 
            4, 
            checkpoint.height
        );
        
        // Checkpoint flag
        ctx.fillStyle = checkpoint.activated ? "#27AE60" : "#95A5A6";
        ctx.beginPath();
        ctx.moveTo(checkpoint.x + checkpoint.width/2, checkpoint.y);
        ctx.lineTo(checkpoint.x + checkpoint.width/2, checkpoint.y + checkpoint.height/3);
        ctx.lineTo(checkpoint.x + checkpoint.width, checkpoint.y + checkpoint.height/4);
        ctx.closePath();
        ctx.fill();
        
        // Flag symbol
        if (checkpoint.activated) {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px Arial";
            ctx.fillText("✓", checkpoint.x + checkpoint.width/2 + 10, checkpoint.y + checkpoint.height/4 + 5);
        }
    });
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function initGame() {
    // Ensure canvas is properly sized
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Load first level
    loadLevel(1);
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // CORRECTED particle configuration
    particlesJS("particles-js", {
        "particles": {
            "number": {
                "value": 30,  // Reduced number
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#66a3ff"  // Changed to light blue
            },
            "shape": {
                "type": "circle"
            },
            "opacity": {
                "value": 0.3,       // More transparent
                "random": true
            },
            "size": {
                "value": 3,         // Smaller size
                "random": true
            },
            "line_linked": {
                "enable": false     // No connecting lines
            },
            "move": {
                "enable": true,
                "speed": 1,         // Slower movement
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "out",
                "bounce": false
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": false  // Disable interactivity
                },
                "onclick": {
                    "enable": false
                },
                "resize": true
            }
        },
        "retina_detect": true
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Initialization
document.addEventListener('DOMContentLoaded', initGame);
// Damage effect
function showDamageEffect() {
    const effect = document.getElementById('damage-effect');
    effect.style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
    setTimeout(() => {
        effect.style.backgroundColor = 'rgba(231, 76, 60, 0)';
    }, 300);
}