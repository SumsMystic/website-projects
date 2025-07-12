document.addEventListener("DOMContentLoaded", () => {
    const amazonAds = [
        {
          title: "boAt Rockerz 450 Bluetooth On Ear Headphones",
          url: "https://www.amazon.in/dp/B07PR1CL3S?tag=sumsmystic-21",
          img: "https://ws-in.amazon-adsystem.com/widgets/q?ASIN=B07PR1CL3S&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1&tag=sumsmystic-21",
          alt: "boAt Rockerz 450",
          description: "15 H battery, on‑ear Bluetooth headphones with mic."
        },
        {
          title: "Sony WH‑CH520 Bluetooth Headphones",
          url: "https://www.amazon.in/dp/B0BS1PRC4L?tag=sumsmystic-21",
          img: "https://ws-in.amazon-adsystem.com/widgets/q?ASIN=B0BS1PRC4L&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1&tag=sumsmystic-21",
          alt: "Sony WH-CH520",
          description: "Lightweight on‑ear with 50 hr battery and multipoint pairing."
        },
        {
          title: "boAt Rockerz 550 Over‑Ear Bluetooth Headphones",
          url: "https://www.amazon.in/dp/B084D7KG7S?tag=sumsmystic-21",
          img: "https://ws-in.amazon-adsystem.com/widgets/q?ASIN=B084D7KG7S&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1&tag=sumsmystic-21",
          alt: "boAt Rockerz 550",
          description: "Over‑ear with up to 20 H playtime and soft cushions."
        }
      ];
    
    let currentAdIndex = 0;
    let clicks = 0;
    const adContainer = document.getElementById("amazon-ad-container");
    const metricsElement = document.createElement("div");
    metricsElement.id = "ad-metrics";
    metricsElement.className = "text-center text-xs text-gray-500 mt-4";
    document.body.appendChild(metricsElement);
    
    function updateMetricsDisplay() {
        metricsElement.textContent = `Amazon Ads — Clicks: ${clicks}`;
    }
    
    window.handleAdClick = function () {
        clicks++;
        updateMetricsDisplay();
    };
    
    function renderAmazonAd(index) {
        const ad = amazonAds[index];
    
        adContainer.innerHTML = `
        <div class="w-full max-w-full flex flex-col sm:flex-row gap-4 items-start justify-start p-4 border border-gray-300 rounded-lg bg-white shadow-md box-border">
            
            <!-- Amazon logo -->
            <div class="flex-shrink-0 flex flex-col items-center w-10 sm:w-12">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" class="w-full h-auto" />
            </div>

            <!-- Product image -->
            <a target="_blank" href="${ad.url}" onclick="handleAdClick()" class="flex-shrink-0 w-full sm:w-2/5">
            <img src="${ad.img}" alt="${ad.alt}" class="w-full h-32 object-contain rounded-md" />
            </a>

            <!-- Text content -->
            <div class="flex-grow">
            <p class="text-base font-semibold mb-1">
                <a target="_blank" href="${ad.url}" onclick="handleAdClick()" class="text-black no-underline hover:underline">
                ${ad.title}
                </a>
            </p>
            <p class="text-sm text-gray-600">${ad.description}</p>
            </div>
        </div>
        `;
    }
    
    // Initial render
    renderAmazonAd(currentAdIndex);
    
    // Rotate every 5 seconds
    setInterval(() => {
        currentAdIndex = (currentAdIndex + 1) % amazonAds.length;
        renderAmazonAd(currentAdIndex);
    }, 5000);
});