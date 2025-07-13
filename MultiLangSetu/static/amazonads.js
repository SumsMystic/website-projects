const amazonAds = [
  {
    title: "Echo Dot (5th Gen) Smart Speaker with Alexa",
    url: "https://www.amazon.in/dp/B09B8XJDW5?tag=sumsmystic-21&linkCode=ll1&linkId=f799861234521da7ddb0227905c47e95",
    img: "https://m.media-amazon.com/images/I/81lGxS2ZisL._SL1500_.jpg",
    alt: "Echo Dot 5th Gen",
    description: "Smart speaker with clock, Alexa built‑in."
  },
  {
    title: "Kindle Paperwhite (2024) 7\" Glare-Free Display",
    url: "https://www.amazon.in/dp/B0DKTZ6592?tag=sumsmystic-21&linkCode=ll1&linkId=22804cfc0599808e9dcdcae58e546b80",
    img: "https://m.media-amazon.com/images/I/61nmCTbSCoL._SL1001_.jpg",
    alt: "Kindle Paperwhite 2024",
    description: "Waterproof e‑reader with 7\" glare‑free display."
  },
  {
    title: "boAt Rockerz 550 Over‑Ear Bluetooth Headphones",
    url: "https://www.amazon.in/boAt-Rockerz-650-Pro-Headphones/dp/B0DV5J28LW?th=1&linkCode=ll1&tag=sumsmystic-21&linkId=1d46bdc41e1482bfb6e0163a6457ae4d&language=en_IN&ref_=as_li_ss_tl",
    img: "https://m.media-amazon.com/images/I/61-XNG5lPBL._SL1500_.jpg",
    alt: "boAt Rockerz 550",
    description: "Over‑ear, up to 20 H playtime, soft cushions."
  },
  {
    title: "Kimirica Luxury Pamper Gift Set",
    url: "https://www.amazon.in/dp/B0CHYWK8JN?tag=sumsmystic-21&linkCode=ll1&linkId=06a3f5146113abd8e14fd5f5bab8c362",
    img: "https://m.media-amazon.com/images/I/61zhkaUlT0L._SL1080_.jpg",
    alt: "Kimirica Gift Set",
    description: "Luxury bath & body gift box for special occasions."
  },
  {
    title: "Join Amazon Prime – Free Delivery & More",
    url: "https://www.amazon.in/amazonprime?tag=sumsmystic-21&linkCode=ll2&linkId=a1c07d6ee3acd7344b0a22be277c4435",
    description: "Free fast delivery, Prime Video & exclusive deals."
  }
];

let adIndex = 0;

function renderAmazonAd() {
  const ad = amazonAds[adIndex];
  const adContainer = document.getElementById("amazon-ad-container");

  adContainer.innerHTML = `
    <div class="max-w-xl w-full mx-auto flex flex-row gap-6 items-start p-4 border border-gray-300 rounded-lg bg-white shadow-md">
      <div class="flex flex-col items-center space-y-2">
        <!-- Amazon logo: responsive and scales with height -->
        <img
          src="/static/available_at_amazon.png"
          alt="Available at Amazon"
          class="h-8 w-auto"
        />

      </div>

      <a href="${ad.url}" target="_blank" onclick="handleAdClick()" class="flex-shrink-0 w-2/5">
        <img src="${ad.img}" alt="${ad.alt}" class="w-full h-32 object-contain rounded-md" loading="lazy"
          onerror="this.src='/static/img/amazon-placeholder.png'; this.onerror=null;" />
      </a>

      <div class="flex-grow">
        <p class="text-base font-semibold mb-1">
          <a href="${ad.url}" target="_blank" class="text-black hover:underline">${ad.title}</a>
        </p>
        <p class="text-sm text-gray-600">${ad.description}</p>
      </div>
    </div>
  `;

  adIndex = (adIndex + 1) % amazonAds.length;
} 

function handleAdClick() {
  let count = parseInt(localStorage.getItem("adClickCount") || "0", 10);
  count += 1;
  localStorage.setItem("adClickCount", count);
  updateAdMetrics(count);
}

function updateAdMetrics(count = null) {
  if (count === null) {
    count = parseInt(localStorage.getItem("adClickCount") || "0", 10);
  }
  const metricsDiv = document.getElementById("ad-metrics");
  if (metricsDiv) {
    metricsDiv.textContent = `Amazon Ads Clicked: ${count}`;
  }
}

// Show current count when page loads
window.addEventListener("DOMContentLoaded", () => {
  updateAdMetrics();
});

setInterval(renderAmazonAd, 5000);
window.addEventListener("DOMContentLoaded", renderAmazonAd);