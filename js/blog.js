// ====== Configure your repo here ======
const GITHUB_USER  = 'simke222';
const GITHUB_REPO  = 'politinis_kampas';
const GITHUB_BRANCH = 'main';
// ======================================

// GitHub API URL for posts
const postsApi = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`;
const grid = document.getElementById('blog-grid');

// Convert slug-like filenames into readable titles
function slugToTitle(name) {
  const cleaned = name
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.(md|txt|html)$/, '');
  return cleaned
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Extract date from filename
function dateFromSlug(name) {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

// Format date into readable Lithuanian style
function formatDate(d) {
  try {
    return d.toLocaleDateString('lt-LT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

// Fetch the raw text content of a file
async function fetchTextRaw(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('raw fetch failed');
  return r.text();
}

// Main loader function
async function loadList() {
  if (!grid) {
    console.error("Missing #blog-grid container.");
    return;
  }

  grid.innerHTML = '<p class="muted">Loading posts…</p>';

  try {
    // Fetch list of posts from GitHub API
    const res = await fetch(postsApi);
    if (!res.ok) throw new Error('GitHub API error');
    const files = await res.json();

    // Filter markdown and text posts
    const posts = files.filter(f =>
      f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.txt')
    );

    // Handle case: no posts
    if (posts.length === 0) {
      grid.innerHTML = '<p class="muted">No posts found (check branch or folder).</p>';
      console.log('DEBUG:', files);
      return;
    }

    // Sort newest first
    posts.sort((a, b) => {
      const da = dateFromSlug(a.name) || new Date(0);
      const db = dateFromSlug(b.name) || new Date(0);
      return db - da;
    });

    // Build each card
    const items = await Promise.all(
      posts.map(async p => {
        const title = slugToTitle(p.name);
        const date = dateFromSlug(p.name);
        const dateStr = date ? formatDate(date) : '';

        let preview = '';
        try {
          const raw = await fetch(p.download_url).then(r => r.text());
          preview = raw.split(/\r?\n/).slice(0, 3).join(' ');
        } catch (err) {
          preview = '(Unable to load preview)';
        }

        const link = `post.html?file=${encodeURIComponent(p.name)}`;
        return `
          <article class="feed-card">
            <h3><a href="${link}">${title}</a></h3>
            <p>${preview}</p>
            <div class="meta">${dateStr}</div>
          </article>`;
      })
    );

    // Render to page
    grid.innerHTML = items.join('');
  } catch (e) {
    console.error('Error loading posts:', e);
    grid.innerHTML = `<p class="muted">Failed to load posts: ${e.message}</p>`;
  }
}

// Run after DOM loads
document.addEventListener('DOMContentLoaded', loadList);
