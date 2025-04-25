const footer = document.createElement('footer');
footer.innerHTML = `
    <p> © ${new Date().getFullYear()} Littletree</p>
`;
document.body.appendChild(footer);

function adjustFooter() {
    const bodyHeight = document.body.offsetHeight;
    const windowHeight = window.innerHeight;
    
    if (bodyHeight < windowHeight) {
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.width = '100%';
    } else {
        footer.style.position = 'static';
    }
}


window.addEventListener('load', adjustFooter);
window.addEventListener('resize', adjustFooter);