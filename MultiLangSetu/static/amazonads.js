const amazonAds = [
  {
    title: "Echo Dot (5th Gen) Smart Speaker with Alexa",
    url: "https://www.amazon.in/dp/B09B8XJDW5?tag=sumsmystic-21&linkCode=ll1&linkId=f799861234521da7ddb0227905c47e95",
    img: "https://ws-in.amazon-adsystem.com/widgets/q?ASIN=B09B8XJDW5&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1&tag=sumsmystic-21",
    alt: "Echo Dot 5th Gen",
    description: "Smart speaker with clock, Alexa built‑in."
  },
  {
    title: "Kindle Paperwhite (2024) 7\" Glare-Free Display",
    url: "https://www.amazon.in/dp/B0DKTZ6592?tag=sumsmystic-21&linkCode=ll1&linkId=22804cfc0599808e9dcdcae58e546b80",
    img: "https://ws-in.amazon-adsystem.com/widgets/q?ASIN=B0DKTZ6592&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1&tag=sumsmystic-21",
    alt: "Kindle Paperwhite 2024",
    description: "Waterproof e‑reader with 7\" glare‑free display."
  },
  {
    title: "boAt Rockerz 550 Over‑Ear Bluetooth Headphones",
    url: "https://www.amazon.in/dp/B084D7KG7S?tag=sumsmystic-21",
    img: "https://ws-in.amazon-adsystem.com/widgets/q?ASIN=B084D7KG7S&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1&tag=sumsmystic-21",
    alt: "boAt Rockerz 550",
    description: "Over‑ear, up to 20 H playtime, soft cushions."
  },
  {
    title: "Kimirica Luxury Pamper Gift Set",
    url: "https://www.amazon.in/dp/B0CHYWK8JN?tag=sumsmystic-21&linkCode=ll1&linkId=06a3f5146113abd8e14fd5f5bab8c362",
    img: "https://ws-in.amazon-adsystem.com/widgets/q?ASIN=B0CHYWK8JN&Format=_SL250_&ID=AsinImage&MarketPlace=IN&ServiceVersion=20070822&WS=1&tag=sumsmystic-21",
    alt: "Kimirica Gift Set",
    description: "Luxury bath & body gift box for special occasions."
  },
  {
    title: "Join Amazon Prime – Free Delivery & More",
    url: "https://www.amazon.in/amazonprime?tag=sumsmystic-21&linkCode=ll2&linkId=a1c07d6ee3acd7344b0a22be277c4435",
    img: "https://m.media-amazon.com/images/G/31/prime/ACQ/JanART23/Gateway/GWeditorial/IN-PR-Benefits-Prime-Day_V1._CB601889698_.jpg",
    alt: "Amazon Prime Membership",
    description: "Free fast delivery, Prime Video & exclusive deals."
  }
];

let adIndex = 0;

function renderAmazonAd() {
  const ad = amazonAds[adIndex];
  const adContainer = document.getElementById("amazon-ad-container");

  adContainer.innerHTML = `
    <div class="w-[80%] mx-auto flex flex-row gap-3 items-start p-4 border border-gray-300 rounded-lg bg-white shadow-md">
      <div class="flex flex-col items-center space-y-2">
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" class="h-5 w-auto" />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.3 5.6A1 1 0 007 20h10a1 1 0 001-.8L19.6 13M10 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
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
  // Optional: Add click tracking logic
}

setInterval(renderAmazonAd, 5000);
window.addEventListener("DOMContentLoaded", renderAmazonAd);