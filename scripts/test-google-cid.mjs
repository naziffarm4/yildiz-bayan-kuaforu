import https from 'https';

const url = 'https://maps.google.com/?cid=8333635848754942930';

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  },
  redirect: 'follow'
})
  .then(res => res.text())
  .then(html => {
    const placeIdMatches = html.match(/ChIJ[a-zA-Z0-9_-]{23,}/g);
    console.log('Found Place IDs:', [...new Set(placeIdMatches || [])]);
  })
  .catch(err => console.error(err));
