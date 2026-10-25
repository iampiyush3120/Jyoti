async function loadResponses() {
    const loading = document.getElementById("loading");
    const errorEl = document.getElementById("error");
    const grid = document.getElementById("responsesGrid");
    const totalCount = document.getElementById("totalCount");

    loading.style.display = "block";
    errorEl.style.display = "none";
    grid.innerHTML = "";

    try {
        const response = await fetch("/api/responses");
        const json = await response.json();

        loading.style.display = "none";

        if (!json.success || !Array.isArray(json.data)) {
            throw new Error(json.message || "Failed to load responses");
        }

        const items = json.data;
        totalCount.innerText = items.length;

        if (items.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">No responses yet ❤️</p>`;
            return;
        }

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";

            const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleString()
                : "Just now";

            let locationHtml = `<span style="color: #999;">Not provided</span>`;
            if (item.latitude && item.longitude) {
                locationHtml = `<a class="location-link" href="https://www.google.com/maps?q=${item.latitude},${item.longitude}" target="_blank" rel="noopener">📍 View on Google Maps (${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)})</a>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="user-name">${escapeHtml(item.name || "Anonymous")}</span>
                    <span class="user-id">#${item.id}</span>
                </div>
                <div class="field">
                    <span class="field-label">📱 Phone</span>
                    <span class="field-value"><a href="tel:${escapeHtml(item.phone || "")}" style="color: inherit; text-decoration: none; font-weight: 600;">${escapeHtml(item.phone || "Not provided")}</a></span>
                </div>
                <div class="field">
                    <span class="field-label">🚗 Perfect Day Plan</span>
                    <span class="field-value">${escapeHtml(item.answer1 || "Not specified")}</span>
                </div>
                <div class="field">
                    <span class="field-label">❤️ Final Answer</span>
                    <span class="field-value" style="font-weight: 600; color: #e63946;">${escapeHtml(item.answer2 || "Not specified")}</span>
                </div>
                <div class="field">
                    <span class="field-label">💌 Message</span>
                    <div class="message-box">${escapeHtml(item.message || "No message left")}</div>
                </div>
                <div class="field">
                    <span class="field-label">📍 Location</span>
                    <div class="field-value">${locationHtml}</div>
                </div>
                <div class="card-footer">
                    <span>Submitted:</span>
                    <span>${formattedDate}</span>
                </div>
            `;

            grid.appendChild(card);
        });

    } catch (err) {
        loading.style.display = "none";
        errorEl.style.display = "block";
        errorEl.innerText = "Error loading responses: " + err.message;
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", loadResponses);
