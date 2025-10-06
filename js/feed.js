// Live RSS feed loader for politinis_kampas (project pages friendly paths)
const sources = {
  bbc: 'http://feeds.bbci.co.uk/news/world/rss.xml',
  aljazeera: 'https://www.aljazeera.com/xml/rss/all.xml',
  reuters: 'https://feeds.reuters.com/reuters/worldNews'
};

const sourceSelect = document.getElementById('source');
const limitSelect  = document.getElementById('limit');
const refreshBtn   = document.getElementById('refresh');
const feedEl       = document.getElementById('feed');

async function fetchRSS(url){
  const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxied);
  if(!res.ok) throw new Error('Failed to load feed');
  return res.text();
}

function parseRSS(xmlText){
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const items = Array.from(xml.querySelectorAll('item'));
  return items.map(item => ({
    title: item.querySelector('title')?.textContent?.trim() || 'Untitled',
    link: item.querySelector('link')?.textContent?.trim() || '#',
    pubDate: item.querySelector('pubDate')?.textContent?.trim() || '',
    description: (item.querySelector('description')?.textContent || '')
      .replace(/<[^>]+>/g,'')
      .replace(/&[^;]+;/g,' ')
      .trim()
  }));
}

function renderFeed(items){
  feedEl.innerHTML = '';
  items.forEach(({title, link, pubDate, description}) => {
    const el = document.createElement('article');
    el.className = 'feed-card';
    el.innerHTML = `
      <h3><a href="${link}" target="_blank" rel="noopener">${title}</a></h3>
      <p>${description.slice(0, 160)}${description.length>160?'…':''}</p>
      <div class="meta">${pubDate}</div>
    `;
    feedEl.appendChild(el);
  });
}

async function load(){
  const srcKey = sourceSelect.value;
  const max = parseInt(limitSelect.value, 10) || 20;
  feedEl.innerHTML = '<p class="muted">Loading…</p>';
  try{
    const xml = await fetchRSS(sources[srcKey]);
    const items = parseRSS(xml).slice(0, max);
    renderFeed(items);
  }catch(err){
    console.error(err);
    feedEl.innerHTML = '<p class="muted">Failed to load feed. Try switching source or refreshing.</p>';
  }
}

refreshBtn.addEventListener('click', load);
sourceSelect.addEventListener('change', load);
limitSelect.addEventListener('change', load);
load();
