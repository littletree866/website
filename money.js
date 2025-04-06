let money = 1000;
let loan = 0;
let day = 1;
let inventory = [];
let reputation = 50; // 0-100 scale
let customersWaiting = 0;
let artUnlocked = false;

// Shop items
const shopItems = [
    { id: 1, name: "Coffee", cost: 5, sellPrice: 10 },
    { id: 2, name: "Sandwich", cost: 8, sellPrice: 15 },
    { id: 3, name: "Book", cost: 12, sellPrice: 25 },
    { id: 4, name: "Painting Supplies", cost: 50, sellPrice: 0, unlocksArt: true }
];

// Customer messages
const customerMessages = [
    "I'll take a coffee please!",
    "Do you have any fresh sandwiches?",
    "What books do you recommend?",
    "I heard you sell art now?",
    "The service here is great!",
    "I've been waiting too long..."
];

// Initialize game
function initGame() {
    updateUI();
    renderShop();
    renderArtGallery();
}

// Borrow money function
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

// Buy items from shop
function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (money >= item.cost) {
        money -= item.cost;
        
        if (item.unlocksArt) {
            artUnlocked = true;
            alert("You've unlocked painting! Now you can create and sell art.");
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

// Sell items to customers
function sellItem(itemIndex) {
    if (itemIndex >= 0 && itemIndex < inventory.length) {
        const item = inventory[itemIndex];
        money += item.sellPrice;
        reputation += 2;
        customersWaiting = Math.max(0, customersWaiting - 1);
        inventory.splice(itemIndex, 1);
        
        alert(`Sold ${item.name} for $${item.sellPrice}!`);
        updateUI();
    }
}

// Create art (if unlocked)
function createArt() {
    if (!artUnlocked) return;
    
    const artValue = Math.floor(Math.random() * 100) + 50;
    inventory.push({
        name: "Painting",
        cost: 0,
        sellPrice: artValue
    });
    alert(`Created a painting worth $${artValue}!`);
    updateUI();
}

// Serve customers
function serveCustomer() {
    if (customersWaiting > 0) {
        customersWaiting--;
        reputation += 1;
        alert(customerMessages[Math.floor(Math.random() * customerMessages.length)]);
        updateUI();
    } else {
        alert("No customers waiting right now.");
    }
}

// Advance day
function nextDay() {
    day++;
    customersWaiting += Math.floor(Math.random() * 3) + 1;
    
    // Loan due after 30 days
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
}

// Update UI
function updateUI() {
    document.getElementById("day").textContent = `Day: ${day}`;
    document.getElementById("money").textContent = `Money: $${money}`;
    document.getElementById("loan").textContent = `Loan: $${loan}`;
    document.getElementById("reputation").textContent = `Reputation: ${reputation}/100`;
    document.getElementById("customers").textContent = `Customers waiting: ${customersWaiting}`;
    
    // Update inventory display
    const inventoryElement = document.getElementById("inventory");
    inventoryElement.innerHTML = "<h3>Inventory</h3>";
    inventory.forEach((item, index) => {
        inventoryElement.innerHTML += 
            `<div>${item.name} (Sell for $${item.sellPrice}) 
             <button onclick="sellItem(${index})">Sell</button></div>`;
    });
}

// Render shop
function renderShop() {
    const shopElement = document.getElementById("shop");
    shopElement.innerHTML = "<h3>Shop</h3>";
    shopItems.forEach(item => {
        shopElement.innerHTML += 
            `<div>${item.name} (Buy for $${item.cost}) 
             <button onclick="buyItem(${item.id})">Buy</button></div>`;
    });
}

// Render art gallery
function renderArtGallery() {
    const artElement = document.getElementById("art");
    artElement.innerHTML = "<h3>Art Studio</h3>";
    
    if (artUnlocked) {
        artElement.innerHTML += 
            `<button onclick="createArt()">Create Art</button>
             <p>Create valuable paintings to sell!</p>`;
    } else {
        artElement.innerHTML += 
            `<p>Unlock painting by buying painting supplies in the shop.</p>`;
    }
}

// Initialize game when loaded
window.onload = initGame;