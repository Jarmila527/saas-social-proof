(function () {
    // UNIQUE CLIENT KEY - Change this for each client (e.g., "client_marko_123")
    const CLIENT_API_KEY = "client_marko_123";

    const widget = document.createElement('div');
    widget.id = 'social-proof-widget';
    widget.style.display = 'none';

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

    async function updateAndShowNotification() {
        try {
            // Appending the query parameter so the server knows who is asking for data
            const response = await fetch(`/api/last-purchase?apiKey=${CLIENT_API_KEY}`);
            const data = await response.json();

            if (data) {
                document.getElementById('customer-name').innerText = data.customerName;
                document.getElementById('city').innerText = data.city;
                document.getElementById('product-name').innerText = data.productName;

                const action = data.languageText || "bought";
                document.getElementById('action-text').innerText = action;

                let timeText = "A few moments ago";
                if (action.includes("kupio") || action.includes("narucio") || action.includes("naručio") || action.includes("poručio")) {
                    timeText = "Pre nekoliko trenutaka";
                }
                document.getElementById('time-ago').innerText = timeText;

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
})();