// ====== Configure your repo here ======
const GITHUB_USER  = 'simke222';
const GITHUB_REPO  = 'politinis_kampas';
const GITHUB_BRANCH = 'main';
// ======================================

// Handle caching + encoding safely
const postsApi = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/posts?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
const grid = document.getElementById('blog-grid');

function slugToTitle(name){
  const cleaned = name.replace(/^\\d{4}-\\d{2}-\\d{2}-/,'').replace(/\\.(md|txt)$/,'');
  return cleaned.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function dateFromSlug(name){
  const m = name.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
  if(!m) return null;
  return new Date(+m[1], +m[2]-1, +m[3]);
}
function formatDate(d){
  try{
    return d.toLocaleDateString(undefined, {year:'numeric', month:'long', day:'numeric'});
  }catch{ return ''; }
}
async function fetchTextRaw(filename){
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/posts/${encodeURIComponent(filename)}`;
  const r = await fetch(rawUrl);
  if(!r.ok) throw new Error('raw fetch failed');
  return r.text();
}
function firstLines(text, nChars=220){
  const t = text.replace(/\\s+/g,' ').trim();
  return t.length > nChars ? t.slice(0,nChars) + '…' : t;
}

async function loadList(){
  grid.innerHTML = '<p class="muted">Loading posts…</p>';
  try{
    const res = await fetch(postsApi);
    if(!res.ok) throw new Error('GitHub API error');
    const files = await res.json();

    // filter .md / .txt
    const posts = files
      .filter(f => f.type === 'file' && /\\.(md|txt)$/i.test(f.name))
      .map(f => ({ name: f.name, path: f.path, url: f.download_url }));

    // sort newest-first by date in filename
    posts.sort((a,b) => {
      const da = dateFromSlug(a.name) || new Date(0);
      const db = dateFromSlug(b.name) || new Date(0);
      return db - da;
    });

    // Build cards with preview (fetch each file’s first ~220 chars)
    const items = await Promise.all(posts.map(async p => {
      let preview = '';
      try{
        const raw = await fetchTextRaw(p.name);
        preview = firstLines(raw, 240);
      }catch{ preview = ''; }
      const d = dateFromSlug(p.name);
      const dateStr = d ? formatDate(d) : '';
      const title = slugToTitle(p.name);
      const link = `post.html?file=${encodeURIComponent(p.name)}`;
      return `
        <article class="feed-card">
          <h3><a href="${link}">${title}</a></h3>
          <p>${preview}</p>
          <div class="meta">${dateStr}</div>
        </article>`;
    }));

    grid.innerHTML = items.join('') || '<p class="muted">No posts yet. Add <code>.md</code> files to /posts.</p>';
  }catch(e){
    console.error(e);
    grid.innerHTML = '<p class="muted">Failed to load posts from GitHub. Ensure the repository is public and /posts contains .md or .txt files.</p>';
  }
}

loadList();
