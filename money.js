let money = 100;
let loan = 0;
let day = 1;
let inventory = [];
let reputation = 20;
let customersWaiting = 0;
let artUnlocked = false;
let timeLeft = 15;
let dayInterval;
let activeCustomers = [];

// Quest system variables
let currentQuest = null;
let questCompleted = false;
let moneyEarnedSinceQuestStart = 0;
const quests = [
    {
        description: "Sell 3 coffees",
        targetItem: "Coffee",
        targetCount: 3,
        reward: 10,
        progress: 0
    },
    {
        description: "Sell 2 sandwiches",
        targetItem: "Sandwich",
        targetCount: 2,
        reward: 10,
        progress: 0
    },
    {
        description: "Sell 1 book",
        targetItem: "Book",
        targetCount: 1,
        reward: 10,
        progress: 0
    },
    {
        description: "Create 2 paintings",
        targetItem: "Painting",
        targetCount: 2,
        reward: 10,
        progress: 0
    },
    {
        description: "Earn $25",
        targetItem: "Money",
        targetCount: 25,
        reward: 10,
        progress: 0
    }
];

// Shop items with image paths
const shopItems = [
    { id: 1, name: "Coffee", cost: 5, sellPrice: 10, img: "img/coffee.png" },
    { id: 2, name: "Sandwich", cost: 8, sellPrice: 15, img: "img/sandwich.png" },
    { id: 3, name: "Book", cost: 12, sellPrice: 25, img: "img/book.png" },
    { id: 4, name: "Painting Supplies", cost: 50, sellPrice: 0, unlocksArt: true, img: "img/paint-supplies.png" }
];

// Customer messages
const customerMessages = [
    ":|",
    "This place is great!",
    "The service here is great! :)",
    "I've been waiting too long..."
];

// Customer images
const customerImages = [
    "img/customer1.png",
    "img/customer2.png",
    "img/customer3.png",
    "img/customer4.png",
];

function initGame() {
    document.body.style.backgroundImage = "url('img/shop-bg.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";

    const saveLoadDiv = document.createElement('div');
    saveLoadDiv.style.position = 'fixed';
    saveLoadDiv.style.bottom = '20px';
    saveLoadDiv.style.left = '20px';
    saveLoadDiv.style.zIndex = '100';
    saveLoadDiv.style.display = 'flex';
    saveLoadDiv.style.gap = '10px';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Game';
    saveButton.onclick = saveGame;
    saveButton.style.padding = '5px 15px';
    saveButton.style.backgroundColor = '#2196F3';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '5px';
    saveButton.style.cursor = 'pointer';
    
    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load Game';
    loadButton.onclick = loadGame;
    loadButton.style.padding = '5px 15px';
    loadButton.style.backgroundColor = '#FF9800';
    loadButton.style.color = 'white';
    loadButton.style.border = 'none';
    loadButton.style.borderRadius = '5px';
    loadButton.style.cursor = 'pointer';
    
    saveLoadDiv.appendChild(saveButton);
    saveLoadDiv.appendChild(loadButton);
    document.body.appendChild(saveLoadDiv);
    
    // Create seating area
    const seatingArea = document.createElement('div');
    seatingArea.id = 'seating-area';
    seatingArea.style.position = 'fixed';
    seatingArea.style.left = '10px';
    seatingArea.style.top = '50%';
    seatingArea.style.transform = 'translateY(-50%)';
    seatingArea.style.width = '150px';
    seatingArea.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    seatingArea.style.padding = '10px';
    seatingArea.style.borderRadius = '10px';
    seatingArea.style.display = 'grid';
    seatingArea.style.gridTemplateRows = 'repeat(4, 1fr)';
    seatingArea.style.gap = '10px';
    seatingArea.style.zIndex = '100';
    seatingArea.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
    document.body.appendChild(seatingArea);
    
    // Create quest giver
    const questGiver = document.createElement('div');
    questGiver.id = 'quest-giver';
    questGiver.style.position = 'fixed';
    questGiver.style.right = '20px';
    questGiver.style.bottom = '20px';
    questGiver.style.zIndex = '100';
    
    const questGiverImg = document.createElement('img');
    questGiverImg.src = 'img/questgiver.png';
    questGiverImg.alt = 'Quest Giver';
    questGiverImg.style.width = '80px';
    questGiverImg.style.height = '80px';
    questGiverImg.style.cursor = 'pointer';
    questGiverImg.onclick = interactWithQuestGiver;
    
    questGiver.appendChild(questGiverImg);
    document.body.appendChild(questGiver);
    
    startDayCycle();
    updateUI();
    renderShop();
    renderArtGallery();
}

function interactWithQuestGiver() {
    if (!currentQuest) {
        // Assign a new random quest
        const availableQuests = quests.filter(q => 
            (q.targetItem !== "Painting" || artUnlocked)
        );
        if (availableQuests.length > 0) {
            currentQuest = {...availableQuests[Math.floor(Math.random() * availableQuests.length)]};
            moneyEarnedSinceQuestStart = 0;
            currentQuest.progress = 0;
            alert(`New Quest: ${currentQuest.description}\nProgress: ${currentQuest.progress}/${currentQuest.targetCount}`);
        } else {
            alert("No quests available right now. Come back later!");
        }
    } else if (questCompleted) {
        // Claim reward
        money += currentQuest.reward;
        alert(`Quest completed! You received $${currentQuest.reward}`);
        currentQuest = null;
        questCompleted = false;
        moneyEarnedSinceQuestStart = 0;
        updateUI();
    } else {
        // Show current quest progress
        alert(`Current Quest: ${currentQuest.description}\nProgress: ${currentQuest.progress}/${currentQuest.targetCount}`);
    }
}

function updateQuestProgress(itemName, amountEarned = 0) {
    if (!currentQuest || questCompleted) return;
    
    if (currentQuest.targetItem === "Money") {
        moneyEarnedSinceQuestStart += amountEarned;
        currentQuest.progress = moneyEarnedSinceQuestStart;
    } else if (itemName === currentQuest.targetItem) {
        currentQuest.progress++;
    }
    
    if (currentQuest.progress >= currentQuest.targetCount) {
        questCompleted = true;
        alert("Quest completed! Return to the quest giver for your reward.");
    }
    
    updateUI();
}

function addCustomer() {
    if (activeCustomers.length >= 5) return;
    
    const randomIndex = Math.floor(Math.random() * customerImages.length);
    const customerImg = customerImages[randomIndex];
    const customerMessage = customerMessages[randomIndex % customerMessages.length];
    
    const customer = {
        id: Date.now(),
        img: customerImg,
        message: customerMessage,
        timeout: setTimeout(() => {
            removeCustomer(customer.id);
            customersWaiting = Math.max(0, customersWaiting - 1);
            reputation -= 1;
            updateUI();
        }, 7000)
    };
    
    activeCustomers.push(customer);
    renderCustomers();
}

function removeCustomer(id) {
    activeCustomers = activeCustomers.filter(c => {
        if (c.id === id) {
            clearTimeout(c.timeout);
            return false;
        }
        return true;
    });
    renderCustomers();
}

function renderCustomers() {
    const seatingArea = document.getElementById('seating-area');
    seatingArea.innerHTML = '<h3 style="margin:0;text-align:center;">Customers</h3>';
    
    activeCustomers.forEach(customer => {
        const customerElement = document.createElement('div');
        customerElement.className = 'customer';
        customerElement.style.display = 'flex';
        customerElement.style.justifyContent = 'center';
        customerElement.style.alignItems = 'center';
        customerElement.style.backgroundColor = 'rgba(255,255,255,0.8)';
        customerElement.style.borderRadius = '5px';
        customerElement.style.padding = '5px';
        
        const img = document.createElement('img');
        img.src = customer.img;
        img.alt = "Customer";
        img.style.width = '50px';
        img.style.height = '50px';
        img.style.objectFit = 'cover';
        
        customerElement.appendChild(img);
        seatingArea.appendChild(customerElement);
    });
}

function startDayCycle() {
    const timerElement = document.getElementById("day-timer");
    dayInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Next day in: ${timeLeft}s`;
        
        if (timeLeft <= 0) {
            nextDay();
            timeLeft = 15;
        }
    }, 1000);
}

function borrowMoney() {
    if (loan > 0) {
        alert("You already have an outstanding loan!");
        return;
    }
    
    money += 250;
    loan = 300;
    alert("You now have a $250 loan (+20% interest, $300 total)");
    alert("You have 30 days to pay back.");
    updateUI();
}

function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (money >= item.cost) {
        money -= item.cost;
        
        if (item.unlocksArt) {
            artUnlocked = true;
            alert("You've unlocked painting! Now you can create and sell art.");
            document.querySelector(`button[onclick="buyItem(${item.id})"]`).disabled = true;
            document.querySelector(`button[onclick="buyItem(${item.id})"]`).textContent = "Already Bought";
        } else {
            inventory.push({...item});
        }
        
        updateUI();
        renderShop();
        renderArtGallery();
    } else {
        alert("Not enough money!");
    }
}

function renderShop() {
    const shopElement = document.getElementById("shop");
    shopElement.innerHTML = "<h3>Shop</h3>";
    shopItems.forEach(item => {
        const buttonText = (item.unlocksArt && artUnlocked) ? "Already Bought" : "Buy";
        const buttonDisabled = (item.unlocksArt && artUnlocked) ? "disabled" : "";
        
        shopElement.innerHTML += 
            `<div class="shop-item">
                <img src="${item.img}" alt="${item.name}" class="item-img">
                <span>${item.name} (Buy for $${item.cost})</span>
                <button onclick="buyItem(${item.id})" ${buttonDisabled}>${buttonText}</button>
             </div>`;
    });
}

function sellItem(itemIndex) {
    if (customersWaiting <= 0) {
        alert("No customers to serve right now!");
        return;
    }
    
    if (itemIndex >= 0 && itemIndex < inventory.length) {
        const item = inventory[itemIndex];
        const amountEarned = item.sellPrice;
        money += amountEarned;
        reputation += 2;
        customersWaiting--;
        
        // Update quest progress
        updateQuestProgress(item.name, amountEarned);
        
        // Remove one customer
        if (activeCustomers.length > 0) {
            const servedCustomer = activeCustomers[0];
            removeCustomer(servedCustomer.id);
            
            alertWithImage(
                `${servedCustomer.message}\nSold ${item.name} for $${amountEarned}!`, 
                servedCustomer.img
            );
        }
        
        inventory.splice(itemIndex, 1);
        updateUI();
    }
}

function createArt() {
    if (!artUnlocked) return;
    
    const artValue = Math.floor(Math.random() * 100) + 50;
    inventory.push({
        name: "Painting",
        cost: 0,
        sellPrice: artValue,
        img: `img/painting-${Math.floor(Math.random() * 3) + 1}.png`
    });
    alert(`Created a painting worth $${artValue}!`);
    
    // Update quest progress for painting
    updateQuestProgress("Painting");
    
    updateUI();
}

function alertWithImage(message, imageUrl) {
    const alertBox = document.createElement('div');
    alertBox.style.position = 'fixed';
    alertBox.style.top = '50%';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translate(-50%, -50%)';
    alertBox.style.backgroundColor = 'white';
    alertBox.style.padding = '20px';
    alertBox.style.border = '2px solid #333';
    alertBox.style.borderRadius = '10px';
    alertBox.style.zIndex = '1000';
    alertBox.style.textAlign = 'center';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.width = '100px';
    img.style.height = '100px';
    img.style.objectFit = 'cover';
    img.style.marginBottom = '10px';
    
    const text = document.createElement('p');
    text.textContent = message;
    text.style.marginBottom = '15px';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'OK';
    closeBtn.style.padding = '5px 15px';
    closeBtn.style.backgroundColor = '#4CAF50';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '5px';
    closeBtn.style.cursor = 'pointer';
    
    closeBtn.onclick = function() {
        document.body.removeChild(alertBox);
    };
    
    alertBox.appendChild(img);
    alertBox.appendChild(text);
    alertBox.appendChild(closeBtn);
    document.body.appendChild(alertBox);
}

function nextDay() {
    clearInterval(dayInterval);
    alert("A new day has begun!");
    day++;
    
    // Clear existing customers
    activeCustomers.forEach(c => clearTimeout(c.timeout));
    activeCustomers = [];
    
    // Add new customers
    const newCustomers = Math.floor(Math.random() * 3) + 1;
    customersWaiting = newCustomers;
    
    for (let i = 0; i < customersWaiting; i++) {
        addCustomer();
    }
    
    if (loan > 0 && day % 30 === 0) {
        if (money >= loan) {
            money -= loan;
            loan = 0;
            alert("Loan paid off!");
        } else {
            reputation -= 20;
            alert("You failed to pay your loan! Your reputation has suffered.");
        }
    }
    
    updateUI();
    startDayCycle();
}

function updateUI() {
    document.getElementById("day").textContent = `Day: ${day}`;
    document.getElementById("money").textContent = `Money: $${money}`;
    document.getElementById("loan").textContent = `Loan: $${loan}`;
    document.getElementById("reputation").textContent = `Reputation: ${reputation}/100`;
    document.getElementById("customers").textContent = `Customers waiting: ${customersWaiting}`;
    document.getElementById("day-timer").textContent = `Next day in: ${timeLeft}s`;
    
    // Update quest display
    const questInfo = document.getElementById("quest-info");
    if (!questInfo) {
        const statsElement = document.getElementById("stats");
        const questDiv = document.createElement('div');
        questDiv.id = "quest-info";
        statsElement.appendChild(questDiv);
    }
    
    if (currentQuest) {
        document.getElementById("quest-info").innerHTML = 
            `<p>Quest: ${currentQuest.description}</p>
             <p>Progress: ${currentQuest.progress}/${currentQuest.targetCount}</p>`;
    } else {
        document.getElementById("quest-info").innerHTML = "<p>No active quest</p>";
    }

    while (activeCustomers.length > customersWaiting) {
        removeCustomer(activeCustomers[0].id);
    }
    while (activeCustomers.length < customersWaiting && activeCustomers.length < 4) {
        addCustomer();
    }
    
    const inventoryElement = document.getElementById("inventory");
    inventoryElement.innerHTML = "<h3>Inventory</h3>";
    inventory.forEach((item, index) => {
        const sellButton = customersWaiting > 0 
            ? `<button onclick="sellItem(${index})">Sell</button>`
            : '<button disabled>No customers</button>';
        
        inventoryElement.innerHTML += 
            `<div class="inventory-item">
                <img src="${item.img || 'img/default-item.png'}" alt="${item.name}" class="item-img">
                <span>${item.name} (Sell for $${item.sellPrice})</span>
                ${sellButton}
             </div>`;
    });
}

function renderArtGallery() {
    const artElement = document.getElementById("art");
    artElement.innerHTML = "<h3>Art Studio</h3>";
    
    if (artUnlocked) {
        artElement.innerHTML += 
            `<img src="img/art-studio.png" alt="Art Studio" style="width: 100px; margin-bottom: 10px;">
             <button onclick="createArt()">Create Art</button>
             <p>Create valuable paintings to sell!</p>`;
    } else {
        artElement.innerHTML += 
            `<img src="img/locked-art.png" alt="Locked Art Studio" style="width: 100px; margin-bottom: 10px;">
             <p>Unlock painting by buying painting supplies in the shop.</p>`;
    }
}

function saveGame() {
    const gameState = {
        money,
        loan,
        day,
        inventory,
        reputation,
        customersWaiting,
        artUnlocked,
        currentQuest,
        questCompleted,
        moneyEarnedSinceQuestStart
    };
    
    // Convert to base64 string for easy copy/paste
    const saveString = btoa(JSON.stringify(gameState));
    const saveCode = saveString.match(/.{1,4}/g).join('-'); // Add dashes for readability
    
    // Show save code in a dialog
    const saveDialog = document.createElement('div');
    saveDialog.style.position = 'fixed';
    saveDialog.style.top = '50%';
    saveDialog.style.left = '50%';
    saveDialog.style.transform = 'translate(-50%, -50%)';
    saveDialog.style.backgroundColor = 'white';
    saveDialog.style.padding = '20px';
    saveDialog.style.border = '2px solid #333';
    saveDialog.style.borderRadius = '10px';
    saveDialog.style.zIndex = '1000';
    saveDialog.style.textAlign = 'center';
    
    saveDialog.innerHTML = `
        <h3 style="margin-top:0;">Your Save Code</h3>
        <p>Copy this code to save your progress:</p>
        <textarea id="save-code" style="width:100%; height:60px; margin:10px 0; padding:5px;" readonly>${saveCode}</textarea>
        <button onclick="copySaveCode()" style="padding:5px 15px; background:#4CAF50; color:white; border:none; border-radius:5px; cursor:pointer;">Copy Code</button>
        <button onclick="document.body.removeChild(this.parentElement)" style="padding:5px 15px; background:#f44336; color:white; border:none; border-radius:5px; cursor:pointer; margin-left:10px;">Close</button>
    `;
    
    document.body.appendChild(saveDialog);
}

function copySaveCode() {
    const saveCode = document.getElementById('save-code');
    saveCode.select();
    document.execCommand('copy');
    alert('Save code copied to clipboard!');
}

function loadGame() {
    const loadDialog = document.createElement('div');
    loadDialog.style.position = 'fixed';
    loadDialog.style.top = '50%';
    loadDialog.style.left = '50%';
    loadDialog.style.transform = 'translate(-50%, -50%)';
    loadDialog.style.backgroundColor = 'white';
    loadDialog.style.padding = '20px';
    loadDialog.style.border = '2px solid #333';
    loadDialog.style.borderRadius = '10px';
    loadDialog.style.zIndex = '1000';
    loadDialog.style.textAlign = 'center';
    
    loadDialog.innerHTML = `
        <h3 style="margin-top:0;">Load Game</h3>
        <p>Paste your save code:</p>
        <textarea id="load-code" style="width:100%; height:60px; margin:10px 0; padding:5px;"></textarea>
        <button onclick="processLoadCode()" style="padding:5px 15px; background:#4CAF50; color:white; border:none; border-radius:5px; cursor:pointer;">Load Game</button>
        <button onclick="document.body.removeChild(this.parentElement)" style="padding:5px 15px; background:#f44336; color:white; border:none; border-radius:5px; cursor:pointer; margin-left:10px;">Cancel</button>
    `;
    
    document.body.appendChild(loadDialog);
}

function processLoadCode() {
    try {
        const loadCode = document.getElementById('load-code').value.replace(/-/g, '');
        const gameState = JSON.parse(atob(loadCode));
        
        // Validate the loaded data
        if (!gameState || typeof gameState !== 'object') throw new Error('Invalid save data');
        
        // Restore game state
        money = gameState.money || 100;
        loan = gameState.loan || 0;
        day = gameState.day || 1;
        inventory = gameState.inventory || [];
        reputation = gameState.reputation || 20;
        customersWaiting = gameState.customersWaiting || 0;
        artUnlocked = gameState.artUnlocked || false;
        currentQuest = gameState.currentQuest || null;
        questCompleted = gameState.questCompleted || false;
        moneyEarnedSinceQuestStart = gameState.moneyEarnedSinceQuestStart || 0;
        
        // Update UI
        updateUI();
        renderShop();
        renderArtGallery();
        
        // Close dialog
        document.body.removeChild(document.querySelector('div:last-child'));
        alert('Game loaded successfully!');
    } catch (error) {
        alert('Invalid save code. Please check your code and try again.');
        console.error('Load error:', error);
    }
}


window.onload = initGame;