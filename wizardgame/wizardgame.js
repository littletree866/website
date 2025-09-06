// Enhanced game state with new features
const gameState = {
    player: {
        name: "Arcane Mage",
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        level: 1,
        xp: 0,
        xpNeeded: 100,
        gold: 0,
        spells: {
            fireball: { damage: 20, manaCost: 15, level: 1, maxLevel: 3 },
            frostbolt: { damage: 15, manaCost: 7, slow: true, level: 1, maxLevel: 3 },
            lightning: { damage: 25, manaCost: 15, level: 1, maxLevel: 3 },
            heal: { amount: 30, manaCost: 20, level: 1, maxLevel: 3 },
            meteor: { damage: 50, manaCost: 30, level: 0, maxLevel: 2, unlocked: false },
            blizzard: { damage: 45, manaCost: 30, slow: true, level: 0, maxLevel: 2, unlocked: false }
        },
        inventory: {
            healthPotions: 0,
            manaPotions: 0,
            scrolls: []
        }
    },
    enemy: null,
    enemiesDefeated: 0,
    gameLog: [],
    map: {
        size: 10,
        playerPosition: { x: 5, y: 5 },
        enemyPositions: [],
        treasurePositions: []
    },
    inBattle: false,
    shopItems: [
        { name: "Health Potion", cost: 20, effect: "Restores 50 health", type: "potion" },
        { name: "Mana Potion", cost: 25, effect: "Restores 40 mana", type: "potion" },
        { name: "Fire Scroll", cost: 50, effect: "Deals 40 fire damage", type: "scroll", spell: "fireball" },
        { name: "Lightning Scroll", cost: 60, effect: "Deals 50 lightning damage", type: "scroll", spell: "lightning" }
    ]
};

// Enhanced enemy types with more variety
const enemyTypes = [
    { name: "Arcane Zombie", health: 50, damage: 8, xp: 20, gold: 10, emoji: "🧟", color: "#4cc9f0" },
    { name: "Mystic Goblin", health: 70, damage: 12, xp: 30, gold: 15, emoji: "👺", color: "#a777e3" },
    { name: "Spellbound Orc", health: 100, damage: 15, xp: 50, gold: 25, emoji: "👹", color: "#f72585" },
    { name: "Enchanted Troll", health: 150, damage: 20, xp: 80, gold: 40, emoji: "🧌", color: "#6e8efb" },
    { name: "Elder Dragon", health: 250, damage: 30, xp: 150, gold: 75, emoji: "🐲", color: "#ff9e00" },
    { name: "Shadow Wraith", health: 120, damage: 25, xp: 100, gold: 50, emoji: "👻", color: "#333333" }
];

// DOM elements
const playerHealthEl = document.getElementById('player-health');
const playerHealthTextEl = document.getElementById('player-health-text');
const playerMaxHealthEl = document.getElementById('player-max-health');
const playerManaEl = document.getElementById('player-mana');
const playerManaTextEl = document.getElementById('player-mana-text');
const playerMaxManaEl = document.getElementById('player-max-mana');
const playerLevelEl = document.getElementById('player-level');
const playerXpEl = document.getElementById('player-xp');
const playerXpNeededEl = document.getElementById('player-xp-needed');
const playerGoldEl = document.getElementById('player-gold');
const xpFillEl = document.getElementById('xp-fill');

const enemyNameEl = document.getElementById('enemy-name');
const enemyHealthEl = document.getElementById('enemy-health');
const enemyHealthTextEl = document.getElementById('enemy-health-text');
const enemyMaxHealthEl = document.getElementById('enemy-max-health');
const enemyStatusEl = document.getElementById('enemy-status');
const enemyEmojiEl = document.getElementById('enemy');

const gameLogEl = document.getElementById('game-log');
const mapContainerEl = document.getElementById('map-container');
const mapEl = document.getElementById('map');
const mapLogEl = document.getElementById('map-log');
const returnToBattleBtn = document.getElementById('return-to-battle');
const inventoryEl = document.getElementById('inventory');
const shopEl = document.getElementById('shop');
const usePotionBtn = document.getElementById('use-potion');

const spellButtons = {
    fireball: document.querySelector('#fireball'),
    frostbolt: document.querySelector('#frostbolt'),
    lightning: document.querySelector('#lightning'),
    heal: document.querySelector('#heal'),
    meteor: null,
    blizzard: null
};

const nextEnemyBtn = document.querySelector('#next-enemy');
const restBtn = document.querySelector('#rest');

// Initialize game
function initGame() {
    createPowerfulSpellButtons();
    setupEventListeners();
    updateInventoryDisplay();
    updateShopDisplay();
    
    // Start with the map visible and battle container hidden
    mapContainerEl.style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    
    generateMap();
    addToMapLog("Welcome to Arcane Duel! Move around the map to find enemies and treasures.", "special");
}

// Create buttons for powerful spells
function createPowerfulSpellButtons() {
    const spellButtonsContainer = document.querySelector('.spell-buttons');
    
    // Meteor button
    const meteorBtn = document.createElement('button');
    meteorBtn.className = 'spell-btn powerful-spell';
    meteorBtn.id = 'meteor';
    meteorBtn.innerHTML = '☄️ Meteor <span class="mana-cost">(30 mana)</span>';
    meteorBtn.style.display = 'none';
    meteorBtn.setAttribute('data-level', '0');
    meteorBtn.addEventListener('click', () => castSpell('meteor'));
    spellButtonsContainer.appendChild(meteorBtn);
    spellButtons.meteor = meteorBtn;
    
    // Blizzard button
    const blizzardBtn = document.createElement('button');
    blizzardBtn.className = 'spell-btn powerful-spell';
    blizzardBtn.id = 'blizzard';
    blizzardBtn.innerHTML = '🌨️ Blizzard <span class="mana-cost">(30 mana)</span>';
    blizzardBtn.style.display = 'none';
    blizzardBtn.setAttribute('data-level', '0');
    blizzardBtn.addEventListener('click', () => castSpell('blizzard'));
    spellButtonsContainer.appendChild(blizzardBtn);
    spellButtons.blizzard = blizzardBtn;
}

// Generate the map with enemies and treasures
function generateMap() {
    mapEl.innerHTML = '';
    gameState.map.enemyPositions = [];
    gameState.map.treasurePositions = [];
    
    // Generate 3-6 enemies at random positions
    const enemyCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < enemyCount; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * gameState.map.size);
            y = Math.floor(Math.random() * gameState.map.size);
        } while (
            (x === gameState.map.playerPosition.x && y === gameState.map.playerPosition.y) ||
            gameState.map.enemyPositions.some(pos => pos.x === x && pos.y === y)
        );
        
        gameState.map.enemyPositions.push({ x, y });
    }
    
    // Generate 1-3 treasures
    const treasureCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < treasureCount; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * gameState.map.size);
            y = Math.floor(Math.random() * gameState.map.size);
        } while (
            (x === gameState.map.playerPosition.x && y === gameState.map.playerPosition.y) ||
            gameState.map.enemyPositions.some(pos => pos.x === x && pos.y === y) ||
            gameState.map.treasurePositions.some(pos => pos.x === x && pos.y === y)
        );
        
        gameState.map.treasurePositions.push({ x, y });
    }
    
    // Create map tiles
    for (let y = 0; y < gameState.map.size; y++) {
        for (let x = 0; x < gameState.map.size; x++) {
            const tile = document.createElement('div');
            tile.className = 'map-tile';
            tile.dataset.x = x;
            tile.dataset.y = y;
            
            // Mark player position
            if (x === gameState.map.playerPosition.x && y === gameState.map.playerPosition.y) {
                tile.classList.add('player');
            }
            // Mark enemy positions
            else if (gameState.map.enemyPositions.some(pos => pos.x === x && pos.y === y)) {
                tile.classList.add('enemy');
            }
            // Mark treasure positions
            else if (gameState.map.treasurePositions.some(pos => pos.x === x && pos.y === y)) {
                tile.classList.add('treasure');
                tile.innerHTML = '💎';
            }
            
            tile.addEventListener('click', () => movePlayer(x, y));
            mapEl.appendChild(tile);
        }
    }
    
    addToMapLog("Explore the mystical world to find enemies and treasures!", "special");
}

function movePlayer(x, y) {
    const dx = Math.abs(x - gameState.map.playerPosition.x);
    const dy = Math.abs(y - gameState.map.playerPosition.y);
    
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        gameState.map.playerPosition = { x, y };
        
        // Check for enemy encounter
        const enemyIndex = gameState.map.enemyPositions.findIndex(
            pos => pos.x === x && pos.y === y
        );
        
        // Check for treasure encounter
        const treasureIndex = gameState.map.treasurePositions.findIndex(
            pos => pos.x === x && pos.y === y
        );
        
        if (enemyIndex !== -1) {
            // Start battle (remove enemy from map)
            gameState.map.enemyPositions.splice(enemyIndex, 1);
            startBattle();
        } else if (treasureIndex !== -1) {
            // Found treasure
            gameState.map.treasurePositions.splice(treasureIndex, 1);
            const goldFound = 10 + Math.floor(Math.random() * 40);
            gameState.player.gold += goldFound;
            addToMapLog(`You found a treasure chest containing ${goldFound} gold!`, "special");
            updateMapVisuals();
            updateUI();
        } else {
            updateMapVisuals();
            addToMapLog(`Moved to (${x}, ${y})`);
        }
    } else {
        addToMapLog("Can only move to adjacent tiles!");
    }
}

function updateMapVisuals() {
    mapEl.innerHTML = '';
    
    for (let y = 0; y < gameState.map.size; y++) {
        for (let x = 0; x < gameState.map.size; x++) {
            const tile = document.createElement('div');
            tile.className = 'map-tile';
            tile.dataset.x = x;
            tile.dataset.y = y;
            
            if (x === gameState.map.playerPosition.x && y === gameState.map.playerPosition.y) {
                tile.classList.add('player');
            } else if (gameState.map.enemyPositions.some(pos => pos.x === x && pos.y === y)) {
                tile.classList.add('enemy');
            } else if (gameState.map.treasurePositions.some(pos => pos.x === x && pos.y === y)) {
                tile.classList.add('treasure');
                tile.innerHTML = '💎';
            }
            
            tile.addEventListener('click', () => movePlayer(x, y));
            mapEl.appendChild(tile);
        }
    }
}

function startBattle() {
    gameState.inBattle = true;
    spawnEnemy();
    
    mapContainerEl.classList.add('fade-out');
    setTimeout(() => {
        mapContainerEl.style.display = 'none';
        document.querySelector('.game-container').style.display = 'block';
        document.querySelector('.game-container').classList.add('fade-in');
    }, 500);
}

function endBattle() {
    gameState.inBattle = false;
    
    // Add loot
    const goldGained = gameState.enemy.gold;
    gameState.player.gold += goldGained;
    
    document.querySelector('.game-container').classList.add('fade-out');
    setTimeout(() => {
        document.querySelector('.game-container').style.display = 'none';
        mapContainerEl.style.display = 'block';
        mapContainerEl.classList.add('fade-in');
        
        generateMap();
        addToMapLog(`You gained ${goldGained} gold from defeating the ${gameState.enemy.name}!`, "special");
        updateUI();
    }, 500);
}

function addToMapLog(message, type = "") {
    const p = document.createElement('p');
    p.textContent = message;
    if (type) p.classList.add(type);
    mapLogEl.appendChild(p);
    
    if (mapLogEl.children.length > 10) {
        mapLogEl.removeChild(mapLogEl.children[0]);
    }
    
    mapLogEl.scrollTop = mapLogEl.scrollHeight;
}

function spawnEnemy() {
    const enemyLevel = Math.min(Math.floor(gameState.player.level / 2), enemyTypes.length - 1);
    const baseEnemy = enemyTypes[enemyLevel];
    
    const healthVariation = Math.floor(baseEnemy.health * 0.2);
    const damageVariation = Math.floor(baseEnemy.damage * 0.2);
    
    gameState.enemy = {
        ...baseEnemy,
        health: baseEnemy.health + Math.floor(Math.random() * healthVariation),
        maxHealth: baseEnemy.health + Math.floor(Math.random() * healthVariation),
        damage: baseEnemy.damage + Math.floor(Math.random() * damageVariation),
        isSlowed: false,
        isFrozen: false
    };
    
    addToLog(`A wild ${gameState.enemy.name} appears!`, "enemy-turn");
    updateCharacterEmojis();
    updateUI();
}

function updateCharacterEmojis() {
    const playerElement = document.getElementById('player');
    const enemyElement = document.getElementById('enemy');
    
    playerElement.textContent = gameState.player.health <= 0 ? '💀' : '🧙‍♂️';
    
    if (gameState.enemy) {
        enemyElement.textContent = gameState.enemy.health <= 0 ? '💀' : gameState.enemy.emoji;
        enemyElement.style.color = gameState.enemy.color;
    }
}

function updateUI() {
    // Player stats
    playerHealthEl.style.width = `${(gameState.player.health / gameState.player.maxHealth) * 100}%`;
    playerHealthTextEl.textContent = gameState.player.health;
    playerMaxHealthEl.textContent = gameState.player.maxHealth;
    playerManaEl.style.width = `${(gameState.player.mana / gameState.player.maxMana) * 100}%`;
    playerManaTextEl.textContent = gameState.player.mana;
    playerMaxManaEl.textContent = gameState.player.maxMana;
    playerLevelEl.textContent = gameState.player.level;
    playerXpEl.textContent = gameState.player.xp;
    playerXpNeededEl.textContent = gameState.player.xpNeeded;
    playerGoldEl.textContent = gameState.player.gold;
    xpFillEl.style.width = `${(gameState.player.xp / gameState.player.xpNeeded) * 100}%`;
    
    // Enemy stats
    if (gameState.enemy) {
        enemyNameEl.textContent = gameState.enemy.name;
        enemyHealthEl.style.width = `${(gameState.enemy.health / gameState.enemy.maxHealth) * 100}%`;
        enemyHealthTextEl.textContent = gameState.enemy.health;
        enemyMaxHealthEl.textContent = gameState.enemy.maxHealth;
        
        let status = "Normal";
        if (gameState.enemy.isFrozen) status = "Frozen ❄️";
        else if (gameState.enemy.isSlowed) status = "Slowed 🐌";
        
        enemyStatusEl.textContent = `Status: ${status}`;
    }
    
    // Update spell buttons with emojis
    spellButtons.fireball.innerHTML = `🔥 Fireball <span class="mana-cost">(${gameState.player.spells.fireball.manaCost} mana)</span>`;
    spellButtons.frostbolt.innerHTML = `❄️ Frostbolt <span class="mana-cost">(${gameState.player.spells.frostbolt.manaCost} mana)</span>`;
    spellButtons.lightning.innerHTML = `⚡ Lightning <span class="mana-cost">(${gameState.player.spells.lightning.manaCost} mana)</span>`;
    spellButtons.heal.innerHTML = `💚 Heal <span class="mana-cost">(${gameState.player.spells.heal.manaCost} mana)</span>`;
    
    // Meteor and Blizzard buttons are handled separately as they have unlock conditions
    if (gameState.player.spells.meteor.unlocked) {
        spellButtons.meteor.style.display = 'inline-block';
        spellButtons.meteor.innerHTML = `☄️ Meteor <span class="mana-cost">(${gameState.player.spells.meteor.manaCost} mana)</span>`;
    } else {
        spellButtons.meteor.style.display = 'none';
    }
    
    if (gameState.player.spells.blizzard.unlocked) {
        spellButtons.blizzard.style.display = 'inline-block';
        spellButtons.blizzard.innerHTML = `🌨️ Blizzard <span class="mana-cost">(${gameState.player.spells.blizzard.manaCost} mana)</span>`;
    } else {
        spellButtons.blizzard.style.display = 'none';
    }
    
    nextEnemyBtn.disabled = !gameState.enemy || (gameState.enemy.health > 0);
    restBtn.disabled = gameState.player.health <= 0;
    usePotionBtn.disabled = gameState.player.inventory.healthPotions <= 0 || gameState.player.health <= 0;
    
    updateCharacterEmojis();
}

function addToLog(message, type = "") {
    const p = document.createElement('p');
    p.textContent = message;
    if (type) p.classList.add(type);
    gameLogEl.appendChild(p);
    
    if (gameLogEl.children.length > 10) {
        gameLogEl.removeChild(gameLogEl.children[0]);
    }
    
    gameLogEl.scrollTop = gameLogEl.scrollHeight;
}

function castSpell(spell) {
    if (!gameState.enemy || gameState.player.health <= 0) {
        addToLog("Cannot cast spells right now!", "enemy-turn");
        return;
    }

    const spellInfo = gameState.player.spells[spell];
    if (!spellInfo) {
        addToLog("Spell not found!", "enemy-turn");
        return;
    }

    if (gameState.player.mana < spellInfo.manaCost) {
        addToLog("Not enough mana!", "enemy-turn");
        return;
    }
    
    gameState.player.mana -= spellInfo.manaCost;
    
    switch (spell) {
        case 'fireball':
            dealDamage(spellInfo.damage, 'fireball', '🔥'.repeat(spellInfo.level));
            break;
        case 'frostbolt':
            dealDamage(spellInfo.damage, 'frostbolt', '❄️'.repeat(spellInfo.level));
            gameState.enemy.isSlowed = true;
            addToLog(`The ${gameState.enemy.name} is slowed! ❄️`, "special");
            break;
        case 'lightning':
            dealDamage(spellInfo.damage, 'lightning', '⚡'.repeat(spellInfo.level));
            break;
        case 'heal':
            const healAmount = Math.min(spellInfo.amount, gameState.player.maxHealth - gameState.player.health);
            gameState.player.health += healAmount;
            createSpellEffect('💚'.repeat(spellInfo.level), document.getElementById('player'));
            addToLog(`You heal for ${healAmount} health. 💚`, "special");
            break;
        case 'meteor':
            dealDamage(spellInfo.damage, 'meteor', '☄️'.repeat(spellInfo.level));
            break;
        case 'blizzard':
            dealDamage(spellInfo.damage, 'blizzard', '🌨️'.repeat(spellInfo.level));
            gameState.enemy.isSlowed = true;
            gameState.enemy.isFrozen = true;
            addToLog(`The ${gameState.enemy.name} is frozen solid! ❄️`, "special");
            break;
    }
    
    if (gameState.enemy && gameState.enemy.health > 0) {
        setTimeout(enemyAttack, 1000);
    }
    
    updateUI();
}

function createSpellEffect(emoji, targetElement) {
    const effect = document.createElement('div');
    effect.className = 'spell-effect';
    effect.innerHTML = `<span class="spell-emoji">${emoji}</span>`;
    
    const rect = targetElement.getBoundingClientRect();
    effect.style.position = 'absolute';
    effect.style.left = `${rect.left + rect.width/2}px`;
    effect.style.top = `${rect.top + rect.height/2}px`;
    effect.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(effect);
    
    // Add damaged class to enemy
    if (targetElement.id === 'enemy') {
        targetElement.classList.add('damaged');
        setTimeout(() => targetElement.classList.remove('damaged'), 300);
    }
    
    setTimeout(() => effect.remove(), 800);
}

function dealDamage(damage, spellName, emoji) {
    if (!gameState.enemy || gameState.enemy.health <= 0) return;
    
    const playerElement = document.getElementById('player');
    const enemyElement = document.getElementById('enemy');
    
    playerElement.style.animation = 'playerAttack 0.5s';
    setTimeout(() => {
        playerElement.style.animation = '';
    }, 500);
    
    setTimeout(() => {
        createSpellEffect(emoji, enemyElement);
        
        const previousHealth = gameState.enemy.health;
        gameState.enemy.health = Math.max(0, gameState.enemy.health - damage);
        
        addToLog(`You hit the ${gameState.enemy.name} with ${spellName} for ${damage} damage!`);
        
        if (gameState.enemy.health <= 0) {
            enemyDefeated();
        }
        
        updateUI();
    }, 300);
}

function enemyAttack() {
    if (!gameState.enemy || gameState.enemy.health <= 0 || gameState.player.health <= 0) return;
    
    const enemyElement = document.getElementById('enemy');
    enemyElement.style.animation = 'enemyAttack 0.5s';
    setTimeout(() => {
        enemyElement.style.animation = '';
    }, 500);
    
    setTimeout(() => {
        let damage = gameState.enemy.damage;
        
        if (gameState.enemy.isSlowed) {
            damage = Math.floor(damage * 0.7);
            gameState.enemy.isSlowed = false;
        }
        
        if (gameState.enemy.isFrozen) {
            damage = Math.floor(damage * 0.5);
            gameState.enemy.isFrozen = false;
            addToLog(`The ${gameState.enemy.name} breaks free from the ice!`);
        }
        
        gameState.player.health = Math.max(0, gameState.player.health - damage);
        addToLog(`The ${gameState.enemy.name} attacks you for ${damage} damage!`, "enemy-turn");
        
        if (gameState.player.health <= 0) {
            addToLog("You have been defeated! Game over.", "enemy-turn");
            for (const button of Object.values(spellButtons)) {
                if (button) button.disabled = true;
            }
            nextEnemyBtn.disabled = true;
            restBtn.disabled = true;
            usePotionBtn.disabled = true;
        }
        
        updateUI();
    }, 300);
}

function enemyDefeated() {
    gameState.enemiesDefeated++;
    const xpGained = gameState.enemy.xp;
    gameState.player.xp += xpGained;
    addToLog(`You defeated the ${gameState.enemy.name} and gained ${xpGained} XP!`, "special");
    
    if (gameState.player.xp >= gameState.player.xpNeeded) {
        levelUp();
    }
    
    setTimeout(endBattle, 1500);
}

function levelUp() {
    gameState.player.level++;
    gameState.player.xp -= gameState.player.xpNeeded;
    gameState.player.xpNeeded = Math.floor(gameState.player.xpNeeded * 1.5);
    
    // Increase stats
    gameState.player.maxHealth += 20;
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.maxMana += 15;
    gameState.player.mana = gameState.player.maxMana;
    
    // Unlock powerful spells at level 5
    if (gameState.player.level === 5) {
        gameState.player.spells.meteor.unlocked = true;
        gameState.player.spells.blizzard.unlocked = true;
        addToLog("You unlocked powerful spells: Meteor and Blizzard!", "special");
    }
    
    showUpgradeOptions();
    addToLog(`Level up! You are now level ${gameState.player.level}!`, "special");
}

function getFireballEmoji(level) {
    return level >= 3 ? '🔥🔥🔥' : level >= 2 ? '🔥🔥' : '🔥';
}

function getFrostboltEmoji(level) {
    return level >= 3 ? '❄️❄️❄️' : level >= 2 ? '❄️❄️' : '❄️';
}

function getLightningEmoji(level) {
    return level >= 3 ? '⚡⚡⚡' : level >= 2 ? '⚡⚡' : '⚡';
}

function getHealEmoji(level) {
    return level >= 3 ? '💖' : level >= 2 ? '💕' : '💓';
}

function getMeteorEmoji(level) {
    return level >= 2 ? '☄️☄️' : '☄️';
}

function getBlizzardEmoji(level) {
    return level >= 2 ? '🌨️🌨️' : '🌨️';
}

function showUpgradeOptions() {
    const availableSpells = Object.entries(gameState.player.spells)
        .filter(([_, spell]) => spell.level > 0 && spell.level < spell.maxLevel);
    
    if (availableSpells.length === 0) return;
    
    const spellToUpgrade = availableSpells[Math.floor(Math.random() * availableSpells.length)];
    const [spellName, spell] = spellToUpgrade;
    
    spell.level++;
    
    switch (spellName) {
        case 'fireball':
            spell.damage += 10;
            break;
        case 'frostbolt':
            spell.damage += 8;
            break;
        case 'lightning':
            spell.damage += 12;
            break;
        case 'heal':
            spell.amount += 12;
            break;
        case 'meteor':
            spell.damage += 20;
            break;
        case 'blizzard':
            spell.damage += 15;
            break;
    }
    
    addToLog(`Your ${spellName} spell upgraded to level ${spell.level}!`, "special");
}

function rest() {
    const healthRecovered = Math.min(30, gameState.player.maxHealth - gameState.player.health);
    const manaRecovered = Math.min(40, gameState.player.maxMana - gameState.player.mana);
    
    gameState.player.health += healthRecovered;
    gameState.player.mana += manaRecovered;
    
    addToLog(`You meditate and recover ${healthRecovered} health and ${manaRecovered} mana.`, "special");
    
    if (gameState.enemy && gameState.enemy.health > 0 && Math.random() > 0.5) {
        setTimeout(enemyAttack, 1000);
    }
    
    updateUI();
}

function usePotion() {
    if (gameState.player.inventory.healthPotions <= 0) return;
    
    gameState.player.inventory.healthPotions--;
    const healAmount = Math.min(50, gameState.player.maxHealth - gameState.player.health);
    gameState.player.health += healAmount;
    
    createSpellEffect("❤️", document.getElementById('player'));
    addToLog(`You used a health potion and recovered ${healAmount} health!`, "special");
    
    updateInventoryDisplay();
    updateUI();
}

function buyItem(itemName) {
    const item = gameState.shopItems.find(i => i.name === itemName);
    if (!item) return;
    
    if (gameState.player.gold >= item.cost) {
        gameState.player.gold -= item.cost;
        
        if (item.type === 'potion') {
            if (item.name === "Health Potion") {
                gameState.player.inventory.healthPotions++;
            } else if (item.name === "Mana Potion") {
                gameState.player.inventory.manaPotions++;
            }
        } else if (item.type === 'scroll') {
            gameState.player.inventory.scrolls.push(item);
        }
        
        addToMapLog(`You bought a ${item.name} for ${item.cost} gold.`, "special");
        updateInventoryDisplay();
        updateShopDisplay();
        updateUI();
    } else {
        addToMapLog("Not enough gold!", "enemy-turn");
    }
}

function updateInventoryDisplay() {
    inventoryEl.innerHTML = '<h3>Inventory</h3>';
    
    // Health Potions
    const healthPotionItem = document.createElement('div');
    healthPotionItem.className = 'item';
    healthPotionItem.innerHTML = `
        <span>Health Potion (${gameState.player.inventory.healthPotions})</span>
        <button onclick="usePotion()">Use</button>
    `;
    inventoryEl.appendChild(healthPotionItem);
    
    // Mana Potions
    const manaPotionItem = document.createElement('div');
    manaPotionItem.className = 'item';
    manaPotionItem.innerHTML = `
        <span>Mana Potion (${gameState.player.inventory.manaPotions})</span>
    `;
    inventoryEl.appendChild(manaPotionItem);
    
    // Scrolls
    if (gameState.player.inventory.scrolls.length > 0) {
        const scrollsHeader = document.createElement('h4');
        scrollsHeader.textContent = 'Scrolls:';
        inventoryEl.appendChild(scrollsHeader);
        
        gameState.player.inventory.scrolls.forEach((scroll, index) => {
            const scrollItem = document.createElement('div');
            scrollItem.className = 'item';
            scrollItem.innerHTML = `
                <span>${scroll.name}</span>
                <button onclick="castScroll(${index})">Use</button>
            `;
            inventoryEl.appendChild(scrollItem);
        });
    }
}

function updateShopDisplay() {
    shopEl.innerHTML = '<h3>Magic Shop</h3>';
    
    gameState.shopItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small>${item.effect}</small>
            </div>
            <button onclick="buyItem('${item.name}')">${item.cost} Gold</button>
        `;
        shopEl.appendChild(itemElement);
    });
}

function setupEventListeners() {
    if (spellButtons.fireball) {
        spellButtons.fireball.addEventListener('click', () => castSpell('fireball'));
    }
    if (spellButtons.frostbolt) {
        spellButtons.frostbolt.addEventListener('click', () => castSpell('frostbolt'));
    }
    if (spellButtons.lightning) {
        spellButtons.lightning.addEventListener('click', () => castSpell('lightning'));
    }
    if (spellButtons.heal) {
        spellButtons.heal.addEventListener('click', () => castSpell('heal'));
    }
    if (spellButtons.meteor) {
        spellButtons.meteor.addEventListener('click', () => castSpell('meteor'));
    }
    if (spellButtons.blizzard) {
        spellButtons.blizzard.addEventListener('click', () => castSpell('blizzard'));
    }

    if (nextEnemyBtn) nextEnemyBtn.addEventListener('click', spawnEnemy);
    if (restBtn) restBtn.addEventListener('click', rest);
    if (returnToBattleBtn) returnToBattleBtn.addEventListener('click', startBattle);
    if (usePotionBtn) usePotionBtn.addEventListener('click', usePotion);
}

// Ensure window.onload is set to initialize the game
window.onload = function() {
    initGame();
};

window.castSpell = castSpell;
window.buyItem = buyItem;
window.usePotion = usePotion;
window.castScroll = function(index) {
    // Implement scroll casting functionality here
    const scroll = gameState.player.inventory.scrolls[index];
    if (!scroll) return;
    
    if (scroll.spell === 'fireball') {
        dealDamage(40, 'fire scroll', '🔥');
    } else if (scroll.spell === 'lightning') {
        dealDamage(50, 'lightning scroll', '⚡');
    }
    
    gameState.player.inventory.scrolls.splice(index, 1);
    updateInventoryDisplay();
    updateUI();
    
    if (gameState.enemy && gameState.enemy.health > 0) {
        setTimeout(enemyAttack, 1000);
    }
};

// Start the game
initGame();

// Make functions available globally for HTML buttons
window.buyItem = buyItem;
window.usePotion = usePotion;
