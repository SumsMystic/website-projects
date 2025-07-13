function setSessionCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=strict`;
}

function getCookie(name) {
  const cookieArr = document.cookie.split("; ");
  for (let i = 0; i < cookieArr.length; i++) {
    const [key, val] = cookieArr[i].split("=");
    if (key === name) return decodeURIComponent(val);
  }
  return "";
}

function translatorApp() {
  return {
    showIntro: true,
    supportedLanguages: {},
    sourceLang: getCookie('sourceLang') || '',
    targetLangs: [
      getCookie('targetLang1') || '',
      getCookie('targetLang2') || '',
      getCookie('targetLang3') || ''
    ],
    inputText: '',
    translations: {},
    copiedIndex: null, // Track which translation was copied

    async init() {
      try {
        const res = await fetch('/supported-languages');
        if (!res.ok) throw new Error('Failed to fetch supported languages');
        this.supportedLanguages = await res.json();
      } catch (error) {
        console.error('Error fetching supported languages:', error);
        this.supportedLanguages = {
          en: 'English',
          es: 'Spanish',
          fr: 'French',
          // Add fallback languages here if needed
        };
      }
    },

    async translate() {
      const targets = this.targetLangs.filter(lang => lang && lang !== this.sourceLang);
      if (targets.length === 0) return alert('Please select at least one target language.');

      setSessionCookie('sourceLang', this.sourceLang);
      this.targetLangs.forEach((lang, i) => setSessionCookie(`targetLang${i+1}`, lang));

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          text: this.inputText,
          source: this.sourceLang,
          targets: targets
        })
      });

      const result = await res.json();
      this.translations = result.translations || {};
    },

    startIntro() {
      setTimeout(() => {
        this.showIntro = false;
      }, 2500); // Add delay of 2.5 seconds
    }
  };
}
