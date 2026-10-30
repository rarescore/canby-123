# puravidacc.org live backup — 2026-10-30 (PT)
Netlify site puravidacc (b426e223-a104-4be2-bf1d-1b04041c2b76). Production deploy at backup time: 6acc3af6a8b738f969d7a680 (published 2026-10-11 6:42 PM PT, "Build from drop deployment", tanstack-start, functions: checkout, forms).
ROLLBACK: `env -u NETLIFY_AUTH_TOKEN netlify api restoreSiteDeploy --data '{"site_id":"b426e223-a104-4be2-bf1d-1b04041c2b76","deploy_id":"6acc3af6a8b738f969d7a680"}'`
files/ = every static file of that deploy, sha1-verified against the Netlify file list (files.json). Asset filenames restored to the case the HTML references (Netlify lists them lowercased).
_redirects: content reconstructed (master public/_redirects + 2 /api function rules); sha1 matches the deployed file exactly.
netlify.toml (172 bytes, sha1 b81a636e...) and the 2 function bundles are NOT downloadable via the API; they are reused by digest in new deploys.
