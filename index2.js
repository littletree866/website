let points = 0;

function clicked() {
    if (points < 5) {
        // Play ticking sound
        const tickSound = document.getElementById('tickSound');
        tickSound.currentTime = 0; // Rewind to start
        tickSound.play();
        
        points += 1;
        document.getElementById("demo").textContent = `Points: ${points}`;
    }
    else {
        points = 0;
        document.getElementById("demo").textContent = `Points: ${points}`;
        
        // Create bomb element
        const bomb = document.createElement('div');
        bomb.innerHTML = '💣';
        bomb.style.position = 'fixed';
        bomb.style.top = '50%';
        bomb.style.left = '50%';
        bomb.style.transform = 'translate(-50%, -50%)';
        bomb.style.fontSize = '1000px';
        bomb.style.zIndex = '1000';
        document.body.appendChild(bomb);

        // Play explosion countdown sound
        const explosionSound = document.getElementById('explosionSound');
        
        // Explode after 1 second
        setTimeout(() => {
            bomb.innerHTML = '💥';
            bomb.style.fontSize = '5000px';
            explosionSound.currentTime = 0;
            explosionSound.play();
            
            // Add shake effect to whole page
            document.body.style.animation = 'shake 0.5s';
            
            // Remove explosion after 2 seconds
            setTimeout(() => {
                bomb.remove();
                document.body.style.animation = '';
            }, 2000);
        }, 1000);
    }
}

document.getElementById('myButton').addEventListener('click', clicked);
document.getElementById("demo").textContent = `Points: ${points}`;