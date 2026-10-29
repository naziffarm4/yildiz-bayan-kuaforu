if (process.env.NODE_ENV === "production") {
  console.error("Bu geliştirici betiği üretim ortamında çalıştırılamaz.");
  process.exit(1);
}

const cid = '8333635848754942930';
const url = `https://www.google.com/maps/preview/review/listentitiesreviews?authuser=0&hl=tr&gl=tr&pb=!1m2!1y${cid}!2m2!1i10!2i0!3e1`;

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
  }
})
  .then(res => res.text())
  .then(text => {
    // Google prepends ")]}'\n"
    const cleaned = text.replace(/^\)\]\}'\s*/, '');
    try {
      const data = JSON.parse(cleaned);
      console.log('Success! Reviews count in payload:', data[2]?.length || 0);
      if (data[2]) {
        data[2].forEach((rev, i) => {
          const author = rev[0]?.[1];
          const rating = rev[1];
          const comment = rev[2]?.[15]?.[0]?.[0] || rev[3];
          console.log(`[Review ${i + 1}] ${author} - ${rating} stars:`, comment);
        });
      }
    } catch (e) {
      console.log('Raw text snippet:', text.slice(0, 500));
    }
  })
  .catch(console.error);
