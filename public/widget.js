(function () {
    // 🔑 DYNAMIC CLIENT KEY
    const CLIENT_API_KEY = window.SAAS_CLIENT_API_KEY || "client_c39182f13dae1e1f3203f24a9f1cfea7";

    // --- STILOVI (ostaju isti) ---
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spwSlideIn { from { transform: translateX(-120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        #social-proof-widget { display: none; position: fixed !important; bottom: 20px !important; left: 20px !important; width: 360px !important; max-width: 90% !important; background: white !important; padding: 15px !important; border-radius: 50px !important; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important; border: 1px solid #eee !important; z-index: 999999 !important; font-family: 'Arial', sans-serif !important; box-sizing: border-box !important; min-width: 300px !important; color: #1a202c !important; text-align: left !important; overflow: hidden !important; animation: spwSlideIn 0.5s ease-out !important; }
        #spw-close-notif { position: absolute !important; top: 7px !important; right: 30px !important; font-size: 20px !important; font-weight: bold !important; border: none !important; background: none !important; cursor: pointer !important; color: #000 !important; padding: 0 !important; line-height: 1 !important; z-index: 1000000 !important; }
    `;
    document.head.appendChild(style);

    const widget = document.createElement('div');
    widget.id = 'social-proof-widget';
    widget.innerHTML = `
        <button id="spw-close-notif">×</button>
        <div style="display: flex !important; align-items: center !important; gap: 12px !important; text-align: left !important; padding: 5px !important;">
            <div style="background: #eee !important; width: 42px !important; height: 42px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-shrink: 0 !important;">👤</div>
            <div style="flex-grow: 1 !important; min-width: 0 !important; line-height: 1.4 !important;">
                <div style="display: block !important; font-size: 15px !important; white-space: nowrap !important;">
                    <strong id="customer-name">Loading...</strong> 
                    <span id="city-container">(<span id="city">...</span>)</span>
                </div>
                <div style="display: block !important; font-size: 14px !important;">
                    <span id="action-text">...</span> 
                    <strong id="product-name">...</strong>
                </div>
                <div id="time-ago" style="display: block !important; font-size: 11px !important; margin-top: 1px !important; opacity: 0.7;">Loading...</div>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // --- LOGIKA ---
    let notificationQueue = []; // Ovde čuvamo niz od 5 notifikacija
    let currentIndex = 0; // Brojač koji pratimo

    function formatTimeAgo(dateString, isSerbian) {
        const createdDate = new Date(dateString);
        const now = new Date();
        const diffSec = Math.floor((now - createdDate) / 1000);
        if (diffSec < 60) return isSerbian ? "Pre nekoliko trenutaka" : "A few moments ago";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return isSerbian ? `Pre ${diffMin} min` : `${diffMin} min ago`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return isSerbian ? `Pre ${diffHour} ${diffHour === 1 ? 'sat' : 'sata'}` : `${diffHour} hours ago`;
        const diffDay = Math.floor(diffHour / 24);
        return isSerbian ? `Pre ${diffDay} ${diffDay === 1 ? 'dan' : 'dana'}` : `${diffDay} days ago`;
    }

    // Funkcija koja menja sadržaj widgeta na ekranu
    function displayNotification(data) {
        document.getElementById('customer-name').innerText = data.customerName;
        document.getElementById('city').innerText = data.city;
        document.getElementById('product-name').innerText = data.productName;

        const action = data.languageText || "bought";
        document.getElementById('action-text').innerText = action;

        const isSerbian = action.includes("kupio") || action.includes("narucio") || action.includes("poručio");
        document.getElementById('time-ago').innerText = formatTimeAgo(data.createdAt, isSerbian);

        widget.style.background = data.bgColor || '#ffffff';
        widget.style.color = data.textColor || '#1a202c';
        widget.style.display = 'block';

        clearTimeout(window.hideTimer);

        window.hideTimer = setTimeout(() => {
            widget.style.display = 'none';
        }, 10000);
    }

    // Poziva API i puni niz
    async function fetchNotifications() {
        try {
            const response = await fetch(`https://saas-social-proof.onrender.com/api/get-purchases?apiKey=${CLIENT_API_KEY}&_cb=${new Date().getTime()}`);
            const data = await response.json();

            if (data && data.length > 0) {
                notificationQueue = data; // Čuvamo svih 5 u niz
                currentIndex = 0; // Resetujemo na prvu
                displayNotification(notificationQueue[currentIndex]); // Prikazujemo prvu odmah
            }
        } catch (err) { console.error('SaaS Widget Error:', err); }
    }

    // Kružna rotacija notifikacija
    setInterval(() => {
        if (notificationQueue.length > 0) {
            currentIndex = (currentIndex + 1) % notificationQueue.length; // 0, 1, 2, 3, 4, 0...
            displayNotification(notificationQueue[currentIndex]);
        }
    }, 12000); // Menja notifikaciju svakih 12 sekundi

    // Close dugme
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'spw-close-notif') widget.style.display = 'none';
    });

    // Inicijalno učitavanje
    fetchNotifications();
    // Refresh API-ja na svakih 2 min (da se povuku nove ako ih klijent doda u bazu)
    setInterval(fetchNotifications, 120000);
})();