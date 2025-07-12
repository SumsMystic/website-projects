const amazonAds = [
    {
      title: "boAt Rockerz 450 Bluetooth On Ear Headphones",
      url: "https://www.amazon.in/dp/B097RBNM8K?tag=sumsmystic-21",
      img: "https://m.media-amazon.com/images/I/51rtt+9XqPL._SX679_.jpg",
      alt: "boAt Rockerz 450"
    },
    {
      title: "Zebronics Zeb-Rush Wired Gaming Headphones",
      url: "https://www.amazon.in/dp/B098FKXT8L?tag=sumsmystic-21",
      img: "https://m.media-amazon.com/images/I/61kWB+uzR2L._SX679_.jpg",
      alt: "Zebronics Zeb-Rush"
    },
    {
      title: "Boult Audio ProBass Curve Bluetooth Neckband",
      url: "https://www.amazon.in/dp/B09Y8W8HSZ?tag=sumsmystic-21",
      img: "https://m.media-amazon.com/images/I/61+ZIbU1vaL._SX679_.jpg",
      alt: "Boult Audio ProBass"
    }
  ];
  
  let currentAdIndex = 0;
  const adContainer = document.getElementById("amazon-ad-container");
  
  function renderAmazonAd(index) {
    const ad = amazonAds[index];
    adContainer.innerHTML = `
      <div style="width: 220px; text-align: center; border: 1px solid #ddd; padding: 10px;">
        <a target="_blank" href="${ad.url}">
          <img src="${ad.img}" alt="${ad.alt}" style="width: 100%; height: auto;">
        </a>
        <p style="font-size: 14px; margin: 5px 0;">
          <a target="_blank" href="${ad.url}" style="text-decoration: none; color: #000;">
            ${ad.title}
          </a>
        </p>
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