let points = 0;
let b = 3000;
let isDefused = false; // Use a separate variable for defuse state

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function defuse() {
    isDefused = true;
    b -= 50;
    alert("Defused Bomb!")
}

async function clicked() { // Make this async to use await
    const a = Math.floor(Math.random() * 10) + 1; // Fixed random number generation
    
    if (points < a) {
        // Play ticking sound
        const tickSound = document.getElementById('tickSound');
        tickSound.currentTime = 0;
        tickSound.play();
        
        points += 1;
        document.getElementById("points").textContent = `Points: ${points}`;
    }
    else {
        alert("BOMB INCOMING!");
        // Add defuse listener temporarily
        const button = document.getElementById('myButton');
        button.removeEventListener('click', clicked); // Remove original listener
        button.addEventListener('click', defuse);
        await sleep(b)
        
        // Create bomb element
        const bomb = document.createElement('div');
        bomb.innerHTML = '💣';
        bomb.style.position = 'fixed';
        bomb.style.top = '50%';
        bomb.style.left = '50%';
        bomb.style.transform = 'translate(-50%, -50%)';
        bomb.style.fontSize = '5000px'; // Reduced size for better visibility
        bomb.style.zIndex = '1000';
        document.body.appendChild(bomb);

        // Play explosion countdown sound
        const explosionSound = document.getElementById('explosionSound');
        
        // Remove defuse listener
        button.removeEventListener('click', defuse);
        
        if (isDefused) {
            bomb.remove();
            isDefused = false;
            document.getElementById("myButton").value = "Click Me";
            button.addEventListener('click', clicked); // Restore original listener
        } else {
            // Explode!
            bomb.innerHTML = '💥';
            bomb.style.fontSize = '5000px';
            explosionSound.currentTime = 0;
            explosionSound.play();
            
            // Add shake effect to whole page
            document.body.style.animation = 'shake 0.5s';
            
            // Remove explosion after 2 seconds
            setTimeout(() => {
                bomb.remove();
                points = 0;
                document.body.style.animation = '';
                document.getElementById("points").textContent = `Points: ${points}`;
                button.addEventListener('click', clicked); // Restore original listener
            }, 2000);
        }
    }
}

document.getElementById('myButton').addEventListener('click', clicked);
document.getElementById("points").textContent = `Points: ${points}`;