(function () {
    // UNIQUE CLIENT KEY - Change this for each client (e.g., "client_marko_123")
    const CLIENT_API_KEY = "client_marko_123";

    const widget = document.createElement('div');
    widget.id = 'social-proof-widget';

    widget.style.cssText = `
        display: none;
        position: fixed !important;
        bottom: 20px !important;
        left: 20px !important;
        min-width: 300px; !important;
        max-width: 90% !important;
        background-color: #ffffff !important;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15) !important;
        border-radius: 50px !important;
        border: 1px solid #eeeeee !important;
        z-index: 999999 !important;
        font-family: Arial, sans-serif !important;
        padding: 12px !important;
        box-sizing: border-box !important;
        animation: slideIn 0.5s ease-out !important;
    `;

    widget.innerHTML = `
        <button id="spw-close-notif">×</button>
        <div style="display: flex !important; align-items: center !important; gap: 12px !important; text-align: left !important; padding: 5px !important;">
            <div style="background: #eee !important; width: 42px !important; height: 42px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">👤</div>
            <div style="flex-grow: 1 !important; min-width: 0 !important; line-height: 1.4 !important;">
                
                <div style="display: block !important; font-size: 15px !important; white-space: nowrap !important;">
                    <strong id="customer-name" style="display: inline !important; float: none !important;">Loading...</strong> 
                    <span id="city-container" style="display: inline !important; float: none !important;">(<span id="city" style="display: inline !important; float: none !important;">...</span>)</span>
                </div>
                
                <div style="display: block !important; font-size: 14px !important;">
                    <span id="action-text" style="display: inline !important; float: none !important;">...</span> 
                    <strong id="product-name" style="display: inline !important; float: none !important;">...</strong>
                </div>
                
                <div id="time-ago" style="display: block !important; font-size: 11px !important; margin-top: 1px !important;">Loading time...</div>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // Pomoćna funkcija koja računa koliko je vremena prošlo od kupovine
    function formatTimeAgo(dateString, isSerbian) {
        const createdDate = new Date(dateString);
        const now = new Date();
        const differenceInSeconds = Math.floor((now - createdDate) / 1000);

        if (differenceInSeconds < 60) {
            return isSerbian ? "Pre nekoliko trenutaka" : "A few moments ago";
        }

        const differenceInMinutes = Math.floor(differenceInSeconds / 60);
        if (differenceInMinutes < 60) {
            if (isSerbian) {
                return `Pre ${differenceInMinutes} min`;
            }
            return `${differenceInMinutes} minutes ago`;
        }

        const differenceInHours = Math.floor(differenceInMinutes / 60);
        if (differenceInHours < 24) {
            if (isSerbian) {
                return `Pre ${differenceInHours} ${differenceInHours === 1 ? 'sat' : 'sata'}`;
            }
            return `${differenceInHours} ${differenceInHours === 1 ? 'hour' : 'hours'} ago`;
        }

        const differenceInDays = Math.floor(differenceInHours / 24);
        if (isSerbian) {
            return `Pre ${differenceInDays} ${differenceInDays === 1 ? 'dan' : 'dana'}`;
        }
        return `${differenceInDays} ${differenceInDays === 1 ? 'day' : 'days'} ago`;
    }

    async function updateAndShowNotification() {
        try {
            const response = await fetch(`https://saas-social-proof.onrender.com/api/last-purchase?apiKey=${CLIENT_API_KEY}&_cb=${new Date().getTime()}`);

            const data = await response.json();

            if (!data) {
                console.log("Nema novih notifikacija za ovaj API ključ.");
                return;
            }

            if (data) {
                document.getElementById('customer-name').innerText = data.customerName;
                document.getElementById('city').innerText = data.city;
                document.getElementById('product-name').innerText = data.productName;

                const action = data.languageText || "bought";
                document.getElementById('action-text').innerText = action;

                // Proveravamo da li je jezik naš (balkanski) na osnovu reči u akciji
                const isSerbian = action.includes("kupio") || action.includes("narucio") || action.includes("naručio") || action.includes("poručio");

                // DINAMIČKO RAČUNANJE: Prosleđujemo createdAt datum našoj funkciji
                document.getElementById('time-ago').innerText = formatTimeAgo(data.createdAt, isSerbian);

                const bg = data.bgColor || '#ffffff';
                const text = data.textColor || '#1a202c';

                widget.style.setProperty('background', bg, 'important');
                widget.style.setProperty('color', text, 'important');

                document.getElementById('customer-name').style.setProperty('color', text, 'important');
                document.getElementById('city-container').style.setProperty('color', text, 'important');
                document.getElementById('product-name').style.setProperty('color', text, 'important');
                document.getElementById('time-ago').style.setProperty('color', text, 'important');
                document.getElementById('time-ago').style.setProperty('opacity', '0.7', 'important');

                setTimeout(() => {
                    widget.style.display = 'block';
                }, 2000);
            }
        } catch (err) {
            console.error('SaaS Widget Error:', err);
        }
    }

    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'spw-close-notif') {
            widget.style.display = 'none';
        }
    });

    updateAndShowNotification();
    setInterval(updateAndShowNotification, 120000);
})();