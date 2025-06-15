// Game state
const gameState = {
    player: {
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        level: 1,
        xp: 0,
        xpNeeded: 100,
        spells: {
            fireball: { damage: 20, manaCost: 15, level: 1, maxLevel: 3 },
            frostbolt: { damage: 15, manaCost: 7, slow: true, level: 1, maxLevel: 3 },
            lightning: { damage: 25, manaCost: 15, level: 1, maxLevel: 3 },
            heal: { amount: 30, manaCost: 20, level: 1, maxLevel: 3 },
            meteor: { damage: 50, manaCost: 30, level: 0, maxLevel: 2, unlocked: false },
            blizzard: { damage: 45, manaCost: 30, slow: true, level: 0, maxLevel: 2, unlocked: false }
        }
    },
    enemy: null,
    enemiesDefeated: 0,
    gameLog: [],
    map: {
        size: 10,
        playerPosition: { x: 5, y: 5 },
        enemyPositions: []
    },
    inBattle: false,
    loot: 0
};

// Enemy types
const enemyTypes = [
    { name: "Zombie", health: 50, damage: 8, xp: 20, emoji: "🧟" },
    { name: "Goblin", health: 70, damage: 12, xp: 30, emoji: "👺" },
    { name: "Orc", health: 100, damage: 15, xp: 50, emoji: "👹" },
    { name: "Troll", health: 150, damage: 20, xp: 80, emoji: "🧌" },
    { name: "Dragon", health: 250, damage: 30, xp: 150, emoji: "🐲" }
];

// DOM elements
const playerHealthEl = document.getElementById('player-health');
const playerHealthTextEl = document.getElementById('player-health-text');
const playerManaTextEl = document.getElementById('player-mana-text');
const playerLevelEl = document.getElementById('player-level');
const playerXpEl = document.getElementById('player-xp');
const playerXpNeededEl = document.getElementById('player-xp-needed');

const enemyNameEl = document.getElementById('enemy-name');
const enemyHealthEl = document.getElementById('enemy-health');
const enemyHealthTextEl = document.getElementById('enemy-health-text');
const enemyMaxHealthEl = document.getElementById('enemy-max-health');
const enemyEmojiEl = document.getElementById('enemy');

const gameLogEl = document.getElementById('game-log');
const mapContainerEl = document.getElementById('map-container');
const mapEl = document.getElementById('map');
const mapLogEl = document.getElementById('map-log');
const returnToBattleBtn = document.getElementById('return-to-battle');

const spellButtons = {
    fireball: document.getElementById('fireball'),
    frostbolt: document.getElementById('frostbolt'),
    lightning: document.getElementById('lightning'),
    heal: document.getElementById('heal'),
    meteor: null,
    blizzard: null
};

const nextEnemyBtn = document.getElementById('next-enemy');
const restBtn = document.getElementById('rest');

// Initialize game
function initGame() {
    createPowerfulSpellButtons();
    setupEventListeners();
    
    // Start with the map visible and battle container hidden
    mapContainerEl.style.display = 'block';
    document.getElementById('game-container').style.display = 'none';
    
    generateMap();
    addToMapLog("Welcome to Wizard Battle! Move around the map to find enemies.");
}

// Create buttons for powerful spells
function createPowerfulSpellButtons() {
    const spellButtonsContainer = document.querySelector('.spell-buttons');
    
    // Meteor button
    const meteorBtn = document.createElement('button');
    meteorBtn.className = 'spell-btn powerful-spell';
    meteorBtn.id = 'meteor';
    meteorBtn.textContent = 'Meteor (30 mana)';
    meteorBtn.style.display = 'none';
    meteorBtn.addEventListener('click', () => castSpell('meteor'));
    spellButtonsContainer.appendChild(meteorBtn);
    spellButtons.meteor = meteorBtn;
    
    // Blizzard button
    const blizzardBtn = document.createElement('button');
    blizzardBtn.className = 'spell-btn powerful-spell';
    blizzardBtn.id = 'blizzard';
    blizzardBtn.textContent = 'Blizzard (30 mana)';
    blizzardBtn.style.display = 'none';
    blizzardBtn.addEventListener('click', () => castSpell('blizzard'));
    spellButtonsContainer.appendChild(blizzardBtn);
    spellButtons.blizzard = blizzardBtn;
}

// Generate the map with enemies
function generateMap() {
    mapEl.innerHTML = '';
    gameState.map.enemyPositions = [];
    
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
            
            tile.addEventListener('click', () => movePlayer(x, y));
            mapEl.appendChild(tile);
        }
    }
    
    addToMapLog("Explore the map to find enemies!");
}

function movePlayer(x, y) {
    // Check if move is valid (same as before)
    const dx = Math.abs(x - gameState.map.playerPosition.x);
    const dy = Math.abs(y - gameState.map.playerPosition.y);
    
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        gameState.map.playerPosition = { x, y };
        
        // Check for enemy encounter
        const enemyIndex = gameState.map.enemyPositions.findIndex(
            pos => pos.x === x && pos.y === y
        );
        
        if (enemyIndex !== -1) {
            // Start battle (remove enemy from map)
            gameState.map.enemyPositions.splice(enemyIndex, 1);
            startBattle();
        } else {
            // Only update the map visuals - DON'T regenerate enemies
            updateMapVisuals();  // Add this new function
            addToMapLog(`Moved to (${x}, ${y})`);
        }
    } else {
        addToMapLog("Can only move to adjacent tiles!");
    }
}

// Add this new function to update visuals without regenerating enemies
function updateMapVisuals() {
    mapEl.innerHTML = ''; // Clear current map
    
    // Redraw tiles with existing enemy positions
    for (let y = 0; y < gameState.map.size; y++) {
        for (let x = 0; x < gameState.map.size; x++) {
            const tile = document.createElement('div');
            tile.className = 'map-tile';
            
            if (x === gameState.map.playerPosition.x && y === gameState.map.playerPosition.y) {
                tile.classList.add('player');
            } else if (gameState.map.enemyPositions.some(pos => pos.x === x && pos.y === y)) {
                tile.classList.add('enemy');
            }
            
            tile.addEventListener('click', () => movePlayer(x, y));
            mapEl.appendChild(tile);
        }
    }
}

// Start a battle
function startBattle() {
    gameState.inBattle = true;
    spawnEnemy();
    
    // Transition to battle screen
    mapContainerEl.classList.add('fade-out');
    setTimeout(() => {
        mapContainerEl.style.display = 'none';
        document.querySelector('.game-container').style.display = 'block';
        document.querySelector('.game-container').classList.add('fade-in');
    }, 500);
}

// End battle and return to map
function endBattle() {
    gameState.inBattle = false;
    
    // Add loot
    const lootGained = 10 + Math.floor(Math.random() * 20);
    gameState.loot += lootGained;
    
    // Transition to map screen
    document.querySelector('.game-container').classList.add('fade-out');
    setTimeout(() => {
        document.querySelector('.game-container').style.display = 'none';
        mapContainerEl.style.display = 'block';
        mapContainerEl.classList.add('fade-in');
        
        generateMap();
        addToMapLog(`You gained ${lootGained} gold from the battle! Total loot: ${gameState.loot}`);
    }, 500);
}

// Add message to map log
function addToMapLog(message) {
    const p = document.createElement('p');
    p.textContent = message;
    mapLogEl.appendChild(p);
    
    // Keep log to 10 messages
    if (mapLogEl.children.length > 10) {
        mapLogEl.removeChild(mapLogEl.children[0]);
    }
    
    mapLogEl.scrollTop = mapLogEl.scrollHeight;
}

// Spawn a new enemy
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
        isSlowed: false
    };
    
    addToLog(`A wild ${gameState.enemy.name} appears!`);
    updateCharacterEmojis();
    updateUI();
}


// Update character emojis based on health
function updateCharacterEmojis() {
    const playerElement = document.getElementById('player');
    const enemyElement = document.getElementById('enemy');
    
    playerElement.textContent = gameState.player.health <= 0 ? '💀' : '🧙‍♂️';
    
    if (gameState.enemy) {
        enemyElement.textContent = gameState.enemy.health <= 0 ? '💀' : gameState.enemy.emoji;
    }
}

// Update UI elements
function updateUI() {
    // Player stats
    playerHealthEl.style.width = `${(gameState.player.health / gameState.player.maxHealth) * 100}%`;
    playerHealthTextEl.textContent = gameState.player.health;
    playerManaTextEl.textContent = gameState.player.mana;
    playerLevelEl.textContent = gameState.player.level;
    playerXpEl.textContent = gameState.player.xp;
    playerXpNeededEl.textContent = gameState.player.xpNeeded;
    
    // Enemy stats
    if (gameState.enemy) {
        enemyNameEl.textContent = gameState.enemy.name;
        enemyHealthEl.style.width = `${(gameState.enemy.health / gameState.enemy.maxHealth) * 100}%`;
        enemyHealthTextEl.textContent = gameState.enemy.health;
        enemyMaxHealthEl.textContent = gameState.enemy.maxHealth;
    }
    
    // Update spell buttons based on mana and level
    for (const [spell, button] of Object.entries(spellButtons)) {
        if (!button) continue;
        
        const spellInfo = gameState.player.spells[spell];
        if (!spellInfo) continue;
        
        // Show/hide powerful spells based on unlock status
        if (spell === 'meteor' || spell === 'blizzard') {
            button.style.display = spellInfo.unlocked ? 'block' : 'none';
        }
        
        // Update button text with level indicator
        if (spellInfo.level > 0) {
            button.textContent = `${spell.charAt(0).toUpperCase() + spell.slice(1)} Lv${spellInfo.level} (${spellInfo.manaCost} mana)`;
        }
        
        button.disabled = gameState.player.mana < spellInfo.manaCost || gameState.player.health <= 0;
    }
    
    nextEnemyBtn.disabled = !gameState.enemy || (gameState.enemy.health > 0);
    restBtn.disabled = gameState.player.health <= 0;
    
    updateCharacterEmojis();
}

// Add message to game log
function addToLog(message) {
    gameState.gameLog.push(message);
    if (gameState.gameLog.length > 10) {
        gameState.gameLog.shift();
    }
    
    gameLogEl.innerHTML = gameState.gameLog.map(msg => `<p>${msg}</p>`).join('');
    gameLogEl.scrollTop = gameLogEl.scrollHeight;
}

// Player casts a spell
function castSpell(spell) {
    const spellInfo = gameState.player.spells[spell];
    
    if (gameState.player.mana < spellInfo.manaCost) {
        addToLog("Not enough mana!");
        return;
    }
    
    gameState.player.mana -= spellInfo.manaCost;
    
    switch (spell) {
        case 'fireball':
            dealDamage(spellInfo.damage, 'fireball', getFireballEmoji(spellInfo.level));
            break;
        case 'frostbolt':
            dealDamage(spellInfo.damage, 'frostbolt', getFrostboltEmoji(spellInfo.level));
            gameState.enemy.isSlowed = true;
            addToLog(`The ${gameState.enemy.name} is slowed!`);
            break;
        case 'lightning':
            dealDamage(spellInfo.damage, 'lightning', getLightningEmoji(spellInfo.level));
            break;
        case 'heal':
            const healAmount = Math.min(spellInfo.amount, gameState.player.maxHealth - gameState.player.health);
            gameState.player.health += healAmount;
            createSpellEffect(getHealEmoji(spellInfo.level), document.getElementById('player'));
            addToLog(`You heal for ${healAmount} health.`);
            break;
        case 'meteor':
            dealDamage(spellInfo.damage, 'meteor', getMeteorEmoji(spellInfo.level));
            break;
        case 'blizzard':
            dealDamage(spellInfo.damage, 'blizzard', getBlizzardEmoji(spellInfo.level));
            gameState.enemy.isSlowed = true;
            addToLog(`The ${gameState.enemy.name} is frozen solid!`);
            break;
    }
    
    if (gameState.enemy && gameState.enemy.health > 0) {
        setTimeout(enemyAttack, 1000);
    }
    
    updateUI();
}

// Get emoji based on spell level
function getFireballEmoji(level) {
    return ['🔥', '🔥🔥', '🔥🔥🔥'][level - 1] || '🔥';
}

function getFrostboltEmoji(level) {
    return ['❄️', '❄️❄️', '❄️❄️❄️'][level - 1] || '❄️';
}

function getLightningEmoji(level) {
    return ['⚡', '⚡⚡', '⚡⚡⚡'][level - 1] || '⚡';
}

function getHealEmoji(level) {
    return ['✨', '✨✨', '✨✨✨'][level - 1] || '✨';
}

function getMeteorEmoji(level) {
    return ['☄️', '☄️☄️'][level - 1] || '☄️';
}

function getBlizzardEmoji(level) {
    return ['🌨️', '🌨️🌨️'][level - 1] || '🌨️';
}

// Deal damage to enemy
function dealDamage(damage, spellName, emoji) {
    const playerElement = document.getElementById('player');
    const enemyElement = document.getElementById('enemy');
    
    playerElement.style.animation = 'playerAttack 0.5s';
    setTimeout(() => {
        playerElement.style.animation = '';
    }, 500);
    
    setTimeout(() => {
        createSpellEffect(emoji, enemyElement);
        
        gameState.enemy.health = Math.max(0, gameState.enemy.health - damage);
        addToLog(`You hit the ${gameState.enemy.name} with ${spellName} for ${damage} damage!`);
        
        if (gameState.enemy.health <= 0) {
            enemyDefeated();
        }
        
        updateUI();
    }, 300);
}

// Enemy attacks player
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
        
        gameState.player.health = Math.max(0, gameState.player.health - damage);
        addToLog(`The ${gameState.enemy.name} attacks you for ${damage} damage!`);
        
        if (gameState.player.health <= 0) {
            addToLog("You have been defeated! Game over.");
            for (const button of Object.values(spellButtons)) {
                if (button) button.disabled = true;
            }
            nextEnemyBtn.disabled = true;
            restBtn.disabled = true;
        }
        
        updateUI();
    }, 300);
}

// Enemy defeated
function enemyDefeated() {
    gameState.enemiesDefeated++;
    const xpGained = gameState.enemy.xp;
    gameState.player.xp += xpGained;
    addToLog(`You defeated the ${gameState.enemy.name} and gained ${xpGained} XP!`);
    
    if (gameState.player.xp >= gameState.player.xpNeeded) {
        levelUp();
    }
    
    // Return to map after a short delay
    setTimeout(endBattle, 1500);
}

// Player levels up
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
        addToLog("You unlocked powerful spells: Meteor and Blizzard!");
    }
    
    // Show upgrade options
    showUpgradeOptions();
    
    addToLog(`Level up! You are now level ${gameState.player.level}!`);
}

// Show spell upgrade options
function showUpgradeOptions() {
    const availableSpells = Object.entries(gameState.player.spells)
        .filter(([_, spell]) => spell.level > 0 && spell.level < spell.maxLevel);
    
    if (availableSpells.length === 0) return;
    
    const spellToUpgrade = availableSpells[Math.floor(Math.random() * availableSpells.length)];
    const [spellName, spell] = spellToUpgrade;
    
    // Upgrade the spell
    spell.level++;
    
    // Improve spell stats based on type
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
    
    addToLog(`Your ${spellName} spell upgraded to level ${spell.level}!`);
}

// Create spell effect animation
function createSpellEffect(emoji, targetElement) {
    const effect = document.createElement('div');
    effect.className = 'spell-effect';
    effect.textContent = emoji;
    
    const rect = targetElement.getBoundingClientRect();
    effect.style.left = `${rect.left + rect.width / 2 - 20}px`;
    effect.style.top = `${rect.top + rect.height / 2 - 20}px`;
    
    document.body.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 500);
}

// Player rests to recover health and mana
function rest() {
    const healthRecovered = Math.min(30, gameState.player.maxHealth - gameState.player.health);
    const manaRecovered = Math.min(40, gameState.player.maxMana - gameState.player.mana);
    
    gameState.player.health += healthRecovered;
    gameState.player.mana += manaRecovered;
    
    addToLog(`You rest and recover ${healthRecovered} health and ${manaRecovered} mana.`);
    
    if (gameState.enemy && gameState.enemy.health > 0 && Math.random() > 0.5) {
        setTimeout(enemyAttack, 1000);
    }
    
    updateUI();
}

// Set up event listeners
function setupEventListeners() {
    // Spell buttons
    spellButtons.fireball.addEventListener('click', () => castSpell('fireball'));
    spellButtons.frostbolt.addEventListener('click', () => castSpell('frostbolt'));
    spellButtons.lightning.addEventListener('click', () => castSpell('lightning'));
    spellButtons.heal.addEventListener('click', () => castSpell('heal'));
    
    // Action buttons
    nextEnemyBtn.addEventListener('click', spawnEnemy);
    restBtn.addEventListener('click', rest);
    returnToBattleBtn.addEventListener('click', startBattle);
}

// Start the game
initGame();