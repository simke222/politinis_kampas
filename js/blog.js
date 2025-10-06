// ====== Configure your repo here ======
const GITHUB_USER  = 'simke222';
const GITHUB_REPO  = 'politinis_kampas';
const GITHUB_BRANCH = 'main';
// ======================================

const postsApi = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/posts?ref=${GITHUB_BRANCH}`;
const grid = document.getElementById('blog-grid');

function slugToTitle(name) {
  const cleaned = name
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.(md|txt|html)$/, '');
  return cleaned
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function dateFromSlug(name) {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

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

async function fetchTextRaw(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('raw fetch failed');
  return r.text();
}

async function loadList() {
  if (!grid) return console.error("Missing #blog-grid container.");
  grid.innerHTML = '<p class="muted">Loading posts…</p>';

  try {
    const res = await fetch(postsApi);
    if (!res.ok) throw new Error('GitHub API error');
    const files = await res.json();

    // ✅ Relaxed filter (include all files with .md or .txt)
    const posts = files.filter(f =>
      f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.txt')
    );

    if (posts.length === 0) {
      grid.innerHTML = '<p class="muted">No posts found (check branch or folder).</p>';
      console.log('DEBUG:', files); // debug output to console
      return;
    }

    // ✅ Sort newest first (safe parsing)
    posts.sort((a, b) => {
      const da = dateFromSlug(a.name) || new Date(0);
      const db = dateFromSlug(b.name) || new Date(0);
      return db - da;
    });

    // ✅ Build cards
    const items = await Promise.all(posts.map(async p => {
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
    }));

    grid.innerHTML = items.join('');
  } catch (e) {
    console.error('Error loading posts:', e);
    grid.innerHTML = `<p class="muted">Failed to load posts: ${e.message}</p>`;
  }
}


    // Filter markdown and text posts
    const posts = files.filter(f =>
      f.type === 'file' && /\.(md|txt)$/i.test(f.name)
    );

    if (!posts.length) {
      grid.innerHTML = '<p class="muted">No posts yet. Add .md files to /posts.</p>';
      return;
    }

    // Sort newest first
    posts.sort((a, b) => {
      const da = dateFromSlug(a.name) || new Date(0);
      const db = dateFromSlug(b.name) || new Date(0);
      return db - da;
    });

    // Build the post list
    const items = await Promise.all(
      posts.map(async p => {
        let preview = '';
        try {
          const raw = await fetchTextRaw(p.download_url);
          // first few lines of markdown text as preview
          preview = raw.split(/\r?\n/).slice(0, 3).join(' ');
        } catch {
          preview = '(Could not load preview)';
        }

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
      })
    );

    grid.innerHTML = items.join('');
  } catch (e) {
    console.error('Error loading posts:', e);
    grid.innerHTML = `<p class="muted">Failed to load posts: ${e.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadList);
