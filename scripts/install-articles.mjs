import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';

const ORIGIN = 'https://www.puravidacc.org';
const styles = ['tokens','base','home','clinic','pages'].map((f) => `<link rel="stylesheet" href="/src/styles/${f}.css">`).join('');

const cards = [
  ['prepare-for-a-first-clinic-visit', 'What to bring to a first clinic visit', 'A first visit goes further when the reason, the medicines, and the questions are already written down. This is a preparation list, not a confirmed appointment.', 'Printed forms and a pen on a white exam-room counter, with gray cabinets and a rolling stool behind them. Illustrative photograph, not a Canby Community Clinic record.'],
  ['how-to-make-a-medication-list', 'How to make a medication list before a visit', 'A medication list is a safety tool. The useful version includes the medicine cabinet, not only the prescription bottles lined up in a row.', 'Amber bottles with blank labels, a blank notepad, and a pencil on a white clinic counter, with gray cabinets behind them. Illustrative photograph, not a real prescription.'],
  ['when-health-coverage-changes', 'What to do when your health coverage changes', 'A new card can change which clinicians are in network, how much help you receive, and how quickly you are supposed to tell the state. The card does not, by itself, tell you whether this clinic can bill the plan.', 'A clinic reception desk with a blue counter, chairs, and office equipment. Illustrative photograph, not Canby Community Clinic staff.'],
  ['how-a-clinic-referral-works', 'How a clinic referral works', '“Why do I need a referral?” usually hides two different questions: whether a clinician thinks someone else should see you, and whether the plan will pay if you go.', 'A clinic hallway with open doors, an eye chart, and light wood-look flooring. Illustrative photograph.'],
  ['questions-to-ask-about-blood-pressure', 'Questions to ask about a blood pressure reading', 'A cuff produces a number. Whether that number should change your care depends on how it was taken, whether it has been repeated, and what a clinician finds when you are actually in the room.', 'One adult seated in a clinic exam room, visible from head to feet, with a blood pressure cuff on one arm and the other hand resting in their lap. Illustrative photograph, not a Canby Community Clinic patient.'],
];

function picture(slug, alt, lazy) {
  const base = `/assets/articles/${slug}`;
  const load = lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high" decoding="async"';
  return `<picture><source type="image/avif" sizes="(min-width: 840px) 760px, 100vw" srcset="${base}-640.avif 640w, ${base}-960.avif 960w, ${base}-1248.avif 1248w"><source type="image/webp" sizes="(min-width: 840px) 760px, 100vw" srcset="${base}-640.webp 640w, ${base}-960.webp 960w, ${base}-1248.webp 1248w"><img alt="${alt}" height="832" width="1248" src="${base}-960.jpg" srcset="${base}-640.jpg 640w, ${base}-960.jpg 960w, ${base}-1248.jpg 1248w"${load}></picture>`;
}

function extras(html) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
  return head
    .replace(/<meta\s+charset[^>]*>/gi, '')
    .replace(/<meta[^>]*name="viewport"[^>]*>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<style[\s\S]*?<\/style>/i, '')
    .trim();
}

function upgradePictures(html) {
  return html.replace(/<picture>[\s\S]*?<\/picture>/g, (block) => {
    const sized = block.replaceAll('sizes="100vw"', 'sizes="(min-width: 840px) 760px, 100vw"');
    return sized.replace(/<img\b([^>]*)>/, (m, attrs) => {
      const src = attrs.match(/src="(\/assets\/articles\/[a-z0-9-]+)-960\.webp"/);
      if (!src) return m;
      const next = attrs.replace(/src="[^"]+"/, `src="${src[1]}-960.jpg" srcset="${src[1]}-640.jpg 640w, ${src[1]}-960.jpg 960w, ${src[1]}-1248.jpg 1248w"`);
      const decoding = /decoding=/.test(next) ? next : `${next.replace(/\/\s*$/, "")} decoding="async"`;
      return `<img${decoding}>`;
    });
  });
}

function shell({slug, title, extra, inner, header, footer, preloader}) {
  const route = slug.replaceAll('/', '-');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${styles}${extra}</head><body class="inner-page route-${route}"><a class="skip" href="#main">Skip to content</a>${preloader}${header}<main id="main" class="article-shell" data-inert-with-menu>${inner}</main>${footer}<script type="module" src="/src/pages.js"></script></body></html>`;
}

export function installArticles({header, footer, preloader, pages}) {
  const indexSrc = readFileSync('scripts/seo-articles/index.html', 'utf8');
  const indexTitle = indexSrc.match(/<title>([\s\S]*?)<\/title>/)[1];
  const list = cards.map(([slug, title, deck, alt], i) => `<li><a href="/articles/${slug}/">${picture(slug, alt, i > 0)}<h2>${title}</h2><p>${deck}</p></a></li>`).join('');
  const indexInner = `<nav aria-label="Breadcrumb" class="crumbs"><a href="/">Home</a> / <span aria-current="page">Health articles</span></nav><h1>Health articles</h1><p class="deck">Guides for a first visit, a medication list, a coverage change, a referral, and a blood pressure reading.</p><ul class="article-index">${list}</ul>`;
  mkdirSync('articles', {recursive: true});
  const indexExtra = extras(indexSrc)+`<meta content="${ORIGIN}/assets/articles/prepare-for-a-first-clinic-visit-1248.webp" property="og:image"><meta content="${cards[0][3]}" property="og:image:alt"><meta content="1248" property="og:image:width"><meta content="832" property="og:image:height">`;
  writeFileSync('articles/index.html', shell({slug: 'articles', title: indexTitle, extra: indexExtra, inner: indexInner, header, footer, preloader}));
  pages.push('articles');

  for (const [slug] of cards) {
    const src = readFileSync(`scripts/seo-articles/${slug}/index.html`, 'utf8');
    const title = src.match(/<title>([\s\S]*?)<\/title>/)[1];
    let inner = src.match(/<main>([\s\S]*?)<\/main>/)[1];
    inner = inner.replaceAll('https://www.puravidacc.org/', '/');
    inner = upgradePictures(inner);
    mkdirSync(`articles/${slug}`, {recursive: true});
    writeFileSync(`articles/${slug}/index.html`, shell({slug: `articles-${slug}`, title, extra: extras(src), inner, header, footer, preloader}));
    pages.push(`articles/${slug}`);
  }

  const locs = ['/', ...pages.filter((s) => s !== '404').map((s) => `/${s}/`)];
  const unique = [...new Set(locs)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map((loc) => `  <url><loc>${ORIGIN}${loc}</loc></url>`).join('\n')}\n</urlset>\n`;
  writeFileSync('public/sitemap.xml', xml);
  writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
}
