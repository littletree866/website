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


const shopItems = [
    { id: 1, name: "Coffee", cost: 5, sellPrice: 10, img: "img/coffee.png" },
    { id: 2, name: "Sandwich", cost: 8, sellPrice: 15, img: "img/sandwich.png" },
    { id: 3, name: "Book", cost: 12, sellPrice: 25, img: "img/book.png" },
    { id: 4, name: "Painting Supplies", cost: 50, sellPrice: 0, unlocksArt: true, img: "img/paint-supplies.png" }
];


const customerMessages = [
    ":|",
    "This place is great!",
    "The service here is great! :)",
    "I've been waiting too long..."
];


const customerImages = [
    "img/customer1.png",
    "img/customer2.png",
    "img/customer3.png",
    "img/customer4.png",
];

// --- New: safe defaults, autosave/load and notification helpers ---
/* initialize game globals to safe defaults so page can be loaded standalone */
window.money = window.money || 0;
window.loan = window.loan || 0;
window.reputation = window.reputation || 50;
window.customersWaiting = window.customersWaiting || 0;
window.activeCustomers = window.activeCustomers || [];
window.inventory = window.inventory || [];
window.shopItems = window.shopItems || [
    { id: 1, name: "Basic Goods", cost: 15, sellPrice: 10, unlocksArt: false },
    { id: 2, name: "Paint Set (Unlock Art)", cost: 120, sellPrice: 0, unlocksArt: true }
];
window.quests = window.quests || [
    { id: 1, description: "Sell 3 Paintings", targetItem: "Painting", targetCount: 3, reward: 150 },
    { id: 2, description: "Earn $200", targetItem: "Money", targetCount: 200, reward: 100 }
];
window.currentQuest = window.currentQuest || null;
window.questCompleted = window.questCompleted || false;
window.moneyEarnedSinceQuestStart = window.moneyEarnedSinceQuestStart || 0;
window.artUnlocked = window.artUnlocked || false;
window._dayCycleInterval = window._dayCycleInterval || null;

/* small toast helper */
function showNotification(text, icon) {
    const n = document.createElement('div');
    n.className = 'snn';
    n.style.position = 'fixed';
    n.style.right = '20px';
    n.style.bottom = '20px';
    n.style.padding = '10px 14px';
    n.style.background = 'rgba(0,0,0,0.85)';
    n.style.color = 'white';
    n.style.borderRadius = '8px';
    n.style.zIndex = 2000;
    n.style.fontSize = '13px';
    n.textContent = (icon ? icon + ' ' : '') + text;
    document.body.appendChild(n);
    setTimeout(() => n.style.opacity = '0', 2600);
    setTimeout(() => n.remove(), 3000);
}

/* simple save/load to localStorage for autosave robustness */
const SND_SAVE_KEY = 's_and_d_save_v1';
function saveSND() {
    try {
        const snap = {
            money: window.money, loan: window.loan, reputation: window.reputation,
            inventory: window.inventory, shopItems: window.shopItems, quests: window.quests,
            currentQuest: window.currentQuest, artUnlocked: window.artUnlocked, day: window.day || 1
        };
        localStorage.setItem(SND_SAVE_KEY, JSON.stringify(snap));
    } catch (e) { /* ignore storage errors */ }
}
function loadSND() {
    try {
        const s = localStorage.getItem(SND_SAVE_KEY);
        if (!s) return false;
        const obj = JSON.parse(s);
        if (typeof obj.money === 'number') window.money = obj.money;
        if (typeof obj.loan === 'number') window.loan = obj.loan;
        if (typeof obj.reputation === 'number') window.reputation = obj.reputation;
        if (Array.isArray(obj.inventory)) window.inventory = obj.inventory;
        if (Array.isArray(obj.shopItems)) window.shopItems = obj.shopItems;
        if (Array.isArray(obj.quests)) window.quests = obj.quests;
        if (obj.currentQuest) window.currentQuest = obj.currentQuest;
        window.artUnlocked = !!obj.artUnlocked;
        window.day = obj.day || window.day;
        return true;
    } catch (e) { return false; }
}
// attempt load immediately so UI will reflect saved state
loadSND();

// trigger autosave while playing
setInterval(() => saveSND(), 7000);

function initGame() {
    document.body.style.backgroundImage = "url('img/shop-bg.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";


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

    // create simple seats
    for (let i = 0; i < 4; i++) {
        const seat = document.createElement('button');
        seat.textContent = `Seat ${i + 1}`;
        seat.style.padding = '8px';
        seat.style.border = 'none';
        seat.style.borderRadius = '6px';
        seat.style.cursor = 'pointer';
        seat.style.background = 'rgba(0,0,0,0.05)';
        seat.addEventListener('click', () => {
            seat.classList.toggle('occupied');
            seat.style.background = seat.classList.contains('occupied') ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)';
        });
        seatingArea.appendChild(seat);
    }

    document.body.appendChild(seatingArea);


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

    // If an autosave loader exists, attempt to load previous state
    if (typeof loadSND === 'function') {
        try {
            if (loadSND()) {
                if (typeof showNotification === 'function') showNotification('Autosave loaded', '🔁');
            }
        } catch (e) {
            // ignore load errors
        }
    }

    // ensure day cycle runs
    if (typeof startDayCycle === 'function') startDayCycle();

    updateUI();
    renderShop();
    renderArtGallery();

    // ensure a single autosave interval is created
    if (!window._sndAutosaveInterval && typeof saveSND === 'function') {
        window._sndAutosaveInterval = setInterval(() => {
            try { saveSND(); } catch (e) { /* ignore */ }
        }, 8000);
    }
}

function interactWithQuestGiver() {
    if (!currentQuest) {

        const availableQuests = quests.filter(q =>
            (q.targetItem !== "Painting" || artUnlocked)
        );
        if (availableQuests.length > 0) {
            currentQuest = { ...availableQuests[Math.floor(Math.random() * availableQuests.length)] };
            moneyEarnedSinceQuestStart = 0;
            currentQuest.progress = 0;
            alert(`New Quest: ${currentQuest.description}\nProgress: ${currentQuest.progress}/${currentQuest.targetCount}`);
        } else {
            alert("No quests available right now. Come back later!");
        }
    } else if (questCompleted) {

        money += currentQuest.reward;
        alert(`Quest completed! You received $${currentQuest.reward}`);
        currentQuest = null;
        questCompleted = false;
        moneyEarnedSinceQuestStart = 0;
        updateUI();
    } else {

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
    // increment waiting counter in sync with active arrivals
    customersWaiting = Math.max(0, (customersWaiting || 0) + 1);
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
    // simple day timer
    window.day = window.day || 1;
    window.timeLeft = window.timeLeft || 15;
    if (window._dayCycleInterval) clearInterval(window._dayCycleInterval);
    window._dayCycleInterval = setInterval(() => {
        window.timeLeft = Math.max(0, (window.timeLeft || 15) - 1);
        if (window.timeLeft <= 0) {
            window.day = (window.day || 1) + 1;
            window.timeLeft = 15;
            // daily effects placeholder
            if (window.badgeSystem) window.badgeSystem.checkAllBadges && window.badgeSystem.checkAllBadges();
        }
        updateUI();
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
            inventory.push({ ...item });
        }

        updateUI();
        renderShop();
        renderArtGallery();
    } else {
        alert("Not enough money!");
    }
}

function renderShop() {
    // simple shop DOM (id: shop-panel) - non-intrusive if missing
    let shop = document.getElementById('shop-panel');
    if (!shop) {
        const container = document.createElement('div');
        container.id = 'shop-panel';
        container.style.position = 'fixed';
        container.style.left = '10px';
        container.style.bottom = '10px';
        container.style.background = 'rgba(255,255,255,0.9)';
        container.style.padding = '8px';
        container.style.borderRadius = '8px';
        container.style.zIndex = 150;
        document.body.appendChild(container);
        shop = container;
    }
    shop.innerHTML = '<strong>Shop</strong><div style="font-size:12px">Click item to buy</div>';
    shopItems.forEach(it => {
        const b = document.createElement('button');
        b.textContent = `${it.name} - $${it.cost}`;
        b.style.display = 'block';
        b.style.marginTop = '6px';
        b.onclick = () => {
            if ((window.money || 0) >= it.cost) {
                window.money -= it.cost;
                updateUI();
                showNotification(`Bought ${it.name}`, '✅');
            } else showNotification('Not enough money', '⚠️');
        };
        shop.appendChild(b);
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


        updateQuestProgress(item.name, amountEarned);


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

    closeBtn.onclick = function () {
        document.body.removeChild(alertBox);
    };

    alertBox.appendChild(img);
    alertBox.appendChild(text);
    alertBox.appendChild(closeBtn);
    document.body.appendChild(alertBox);
}

function nextDay() {
    // clear the same interval used by startDayCycle
    if (window._dayCycleInterval) clearInterval(window._dayCycleInterval);
    alert("A new day has begun!");
    window.day = (window.day || 1) + 1;

    activeCustomers.forEach(c => clearTimeout(c.timeout));
    activeCustomers = [];

    const newCustomers = Math.floor(Math.random() * 3) + 1;
    customersWaiting = newCustomers;

    for (let i = 0; i < customersWaiting; i++) {
        addCustomer();
    }

    if (loan > 0 && window.day % 30 === 0) {
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
    // defensive UI updater (keeps minimal DOM in sync)
    window.day = typeof window.day !== 'undefined' ? window.day : 1;
    window.money = typeof window.money !== 'undefined' ? window.money : 0;
    window.loan = typeof window.loan !== 'undefined' ? window.loan : 0;
    window.reputation = typeof window.reputation !== 'undefined' ? window.reputation : 0;
    window.customersWaiting = typeof window.customersWaiting !== 'undefined' ? window.customersWaiting : 0;
    window.timeLeft = typeof window.timeLeft !== 'undefined' ? window.timeLeft : 15;
    const $ = id => document.getElementById(id);
    if ($('day')) $('day').textContent = `Day: ${window.day}`;
    if ($('money')) $('money').textContent = `Money: $${window.money}`;
    if ($('loan')) $('loan').textContent = `Loan: $${window.loan}`;
    if ($('reputation')) $('reputation').textContent = `Reputation: ${window.reputation}/100`;
    if ($('customers')) $('customers').textContent = `Customers waiting: ${window.customersWaiting}`;
    if ($('day-timer')) $('day-timer').textContent = `Next day in: ${window.timeLeft}s`;

    // ensure quest-info exists
    let qi = $('quest-info');
    if (!qi) {
        const stats = $('stats');
        if (stats) {
            qi = document.createElement('div');
            qi.id = 'quest-info';
            stats.appendChild(qi);
        }
    }
    if (qi) {
        if (window.currentQuest) qi.innerHTML = `<p>Quest: ${window.currentQuest.description}</p><p>Progress: ${window.currentQuest.progress}/${window.currentQuest.targetCount}</p>`;
        else qi.innerHTML = `<p>No active quest</p>`;
    }
}

function renderArtGallery() {
    // quick visual placeholder for art unlocks
    let g = document.getElementById('art-gallery');
    if (!g) {
        g = document.createElement('div');
        g.id = 'art-gallery';
        g.style.position = 'fixed';
        g.style.right = '10px';
        g.style.top = '10px';
        g.style.background = 'rgba(255,255,255,0.9)';
        g.style.padding = '6px';
        g.style.borderRadius = '8px';
        g.style.zIndex = 150;
        document.body.appendChild(g);
    }
    g.innerHTML = `<strong>Gallery</strong><div style="font-size:12px">Art items: ${shopItems.filter(s => s.unlocksArt).length}</div>`;
}



window.onload = initGame;

