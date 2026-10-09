import {readFileSync,writeFileSync} from 'node:fs';

const image=(name,alt,cls='')=>`<img class="${cls}" src="/assets/scenes/${name}" alt="${alt}" loading="lazy">`;
const giving=`<section class="band donation-intro"><div><p class="eyebrow">Give to Canby</p><h1 class="headline">Help a neighbor<br>get care.</h1><p class="page-lead">Your gift supports the visits, medicines, and everyday supplies that make care possible.</p><a href="#donation-story" class="text-link">See how your support helps</a></div><form id="giving-form"><p class="eyebrow">Your donation</p><fieldset><legend>How often?</legend><div class="choice-row">${['One time','Weekly','Yearly'].map((x,i)=>`<label><input type="radio" name="cadence" value="${x}" ${i===0?'checked':''}>${x}</label>`).join('')}</div></fieldset><fieldset><legend>Choose an amount (USD)</legend><div class="amounts">${[20,50,100,500,'Other'].map(x=>`<label><input type="radio" name="amount" value="${x}" ${x===50?'checked':''}>${x==='Other'?'Other':'$'+x}</label>`).join('')}</div><label id="giving-custom-label" hidden>Other amount<input id="giving-custom" name="customAmount" type="number" min="1" max="100000" step="0.01" inputmode="decimal" disabled></label></fieldset><p class="donation-total">Your gift <output id="giving-total">$50.00</output></p><fieldset><legend>Payment method</legend><div class="pay-row">${['Apple Pay','PayPal','Stripe','Check'].map(x=>`<button type="button" class="button" data-payment="${x}" aria-pressed="false">${x}</button>`).join('')}</div></fieldset><div id="check-mail" hidden><p>Make checks payable to Canby Community Clinic.</p><address>7601 Canby Ave #6B<br>Reseda, CA 91335</address></div><p id="payment-status" role="status">Online donations are not available yet. No payment will be taken.</p></form></section><section class="band band-paper impact-story" id="donation-story"><div class="impact-photo">${image('giving-care.png','Illustrative scene of a nurse preparing a room for patient care')}<p>Small, everyday things make a visit possible.</p></div><div><p class="eyebrow">From your gift to a visit</p><h2 class="headline">Care takes more<br>than a checkup.</h2><p class="large-copy">A neighbor may come in with a health concern they have put off because money is tight. Your support helps the clinic make room for that conversation and the care that follows.</p><p>This is how gifts can support a patient’s care. Funds go toward the clinic’s needs; the examples below are not fixed costs or promises tied to a particular gift.</p><div class="impact-steps"><article><span class="impact-step">01</span><div><h3>A place to start</h3><p>Support for visits helps cover the cost of an appointment when a patient cannot afford it.</p></div></article><article><span class="impact-step">02</span><div><h3>What the clinician needs</h3><p>Gloves, test strips, gauze, and other supplies help the team examine and care for the patient.</p></div></article><article><span class="impact-step">03</span><div><h3>Help beyond the appointment</h3><p>Medication support helps patients who cannot cover the pharmacy cost get the prescriptions the clinic can provide.</p></div></article><article><span class="impact-step">04</span><div><h3>A clinic to come back to</h3><p>Rent, phones, and the front desk keep a familiar place available for questions and follow-up.</p></div></article></div><a class="button" href="#giving-form">Choose your gift</a></div></section><section class="band band-ground giving-contact"><p class="eyebrow">Questions about giving?</p><h2>Let’s talk about how you’d like to help.</h2><a href="mailto:info@canbycc.org">info@canbycc.org</a><a href="tel:+18186744414">(818) 674-4414</a><a href="/our-clinic/#public-records">View clinic public records</a></section>`;

function polish(slug,html){
 html=html.replace(/<span aria-hidden="true">[↗→↓←]<\/span>/g,'').replace(/[↗→↓]/g,'');
 html=html.replace(/(data-slider-prev[^>]*>)(?:←)?/g,'$1Previous').replace(/(data-slider-next[^>]*>)/g,'$1Next');
 html=html.replace(/<form class="email-form([\s\S]*?)<\/form>/g,block=>{
  block=block.replace(/<p class="form-note">[\s\S]*?<\/p>/,'<p class="form-note">Please do not include medical records or private health information.</p>');
  block=block.replace(/<div class="email-result"[\s\S]*?(?=<\/form>|<template)/,'<div class="email-result" hidden role="status" tabindex="-1"><h3>Online submissions are coming soon.</h3><p>Your details have not been sent. Contact <a href="mailto:office@canbycc.org">office@canbycc.org</a> or call (818) 674-4414.</p></div>');
  block=block.replace(/<template data-sent-state>[\s\S]*?<\/template>/g,'');
  block=block.replace(/(<button[^>]*type="submit"[^>]*>)[^<]*(<\/button>)/,'$1'+(slug==='volunteer'?'Submit application':'Submit request')+'$2');
  block=block.replace(/<label>([^<]+)(<(?:input|select)[^>]*\brequired\b[^>]*>)/g,'<label>$1 <span class="required-star" aria-hidden="true">*</span>$2');
  block=block.replace('name="License card" type="file"','name="License card" type="file" accept="image/jpeg,image/png,application/pdf"');
  if(!block.includes('required-note'))block=block.replace('<div class="form-grid">','<p class="required-note">Fields marked * are required.</p><div class="form-grid">');
  return block;
 });
 html=html.replace('This prepares a message to office@canbycc.org. You must send it from your email app.','Online requests will be available soon.');
 // Keep the privacy description consistent with the actual frontend behavior.
 html=html.replace('The forms on this website do not save what you type. They open a draft in your email app. The clinic does not have it until you send the email. Do not put a diagnosis, a record, or an insurance number in that email. Email is not a private way to send medical information. Call the clinic instead.','Online form delivery is not connected yet. Information entered in the forms, including selected files, is not sent to the clinic or saved by this website. Call the clinic to make a request. Do not enter medical records or private health information.');
 html=html.replace('A visit request, an appointment request, an in-home request, or a volunteer form opens a draft in your own email app, addressed to office@canbycc.org. We do not store the form on the website. If you do not send the email, we never receive it.','Online form delivery is not connected yet. Form details and selected files stay in the page while it is open. They are not sent or stored by this website. Call the clinic to make a request.');
 if(slug==='services')html=html.replace('/assets/scenes/s-01-consultation.webp','/assets/scenes/visit-room.png');
 if(slug==='new-patients')html=html.replace(/<img class="detail-photo"[^>]+>/,'');
 if(slug==='new-patients')html=html.replace('/assets/scenes/n-01-preparation.webp','/assets/scenes/insurance-sample.png').replace('alt="Illustrative clinic scene"','alt="Fictional medical insurance card clearly marked SAMPLE"');
 if(slug==='appointments/walk-ins')html=html.replace('/assets/scenes/a-01-entrance.webp','/assets/scenes/vol-01-community.webp');
 if(slug==='volunteer'){
  html=html.replace('</h1><p class="page-lead">','</h1><p class="page-lead">');
  html=html.replace(/(<section class="page-hero">[\s\S]*?)(<\/div><\/section>)/,'$1<div class="volunteer-contact"><a href="mailto:office@canbycc.org">office@canbycc.org</a><span>Questions? We’re happy to help.</span></div>$2');
  html=html.replace(/(<section class="page-hero">[\s\S]*?<\/div>)(<\/section>)/,'$1'+image('d-01-giving.webp','Illustrative clinic supplies and community support')+'$2');
  html=html.replace('<section class="band band-paper">','<section class="band band-paper application-section" id="apply"><div class="application-intro"><p class="eyebrow">Give your time</p><h2 class="headline">Find your place<br>at Canby.</h2><p>Medical volunteers bring clinical training. Non-medical volunteers help with registration, phones, interpretation, outreach, and administration.</p></div>');
  html=html.replace('</main>','<section class="band band-ground volunteer-next"><p class="eyebrow">What happens next</p><h2>We’ll get to know you.</h2><p>Once applications open and we receive yours, our team will contact you to discuss available roles and schedule an interview as soon as we can. Medical roles require credential review. All volunteers receive guidance before starting.</p><a href="mailto:office@canbycc.org">office@canbycc.org</a></section></main>');
 }
 if(slug==='our-clinic'){
  html=html.replace('7601 Canby Avenue, Suite 6B','<span class="about-address">7601 Canby Avenue, Suite 6B</span>');
  html=html.replace(/(<section class="page-hero about-hero">[\s\S]*?<\/div>)(<\/section>)/,'$1'+image('about-neighbors.png','Illustrative scene of neighbors together in a local community')+'$2');
  html=html.replace('<section class="band band-ground about-story">','<section class="band band-ground about-story about-photo-story">'+image('h-01-arrival.webp','Illustrative neighborhood clinic arrival','about-photo'));
  html=html.replace('<div class="about-record">','<div class="about-record" id="public-records">');
  html=html.replace('<p class="eyebrow">Our public record</p>','<p class="eyebrow">Our public record</p><p class="record-intro">Organization details from the clinic’s records.</p>');
  html=html.replace('These are the public details, set to the side of the story.','You can look up the organization using the identifiers below.');
  html=html.replace('</div></section><section class="band band-ink about-door">','<div class="record-links"><a href="https://apps.irs.gov/app/eos/" target="_blank" rel="noopener">IRS organization search</a><a href="https://npiregistry.cms.hhs.gov/provider-view/1518686377" target="_blank" rel="noopener">NPI registry</a></div></div></section><section class="band band-ink about-door">');
 }
 if(slug==='give')html=html.replace(/(<main[^>]*>)[\s\S]*?(<\/main>)/,(_,open,close)=>open+giving+close);
 if(slug==='articles'){
  // Article cover photos belong to the article itself, not repeated on its index.
  html=html.replace(/<picture>[\s\S]*?<\/picture>/g,'');
  html=html.replace('<ul class="article-index">','<p class="article-index-note">Preparation · Medications · Coverage · Referrals · Blood pressure</p><ul class="article-index">');
 }
 if(slug==='articles/questions-to-ask-about-blood-pressure')html=html.replace(/<picture>[\s\S]*?<\/picture>/,image('article-pressure.png','Blood pressure monitor and a notebook for questions'));
 if(slug==='articles/how-to-make-a-medication-list')html=html.replace(/<picture>[\s\S]*?<\/picture>/,image('article-medication.png','Medicine bottles, a pill organizer, and a notebook for a medication list'));
 // Text-led utility pages still get purposeful space, color, and clinic contact information.
 if(['appointments','request-visit','visit/in-home','insurance','resources'].includes(slug)){
  const panels={
   appointments:`<div class="route-visual appointment-visual"><p class="eyebrow">Three ways to visit</p><a class="motion-tile" href="/appointments/walk-ins/"><span>At the clinic</span><strong>Walk in.</strong></a><a class="motion-tile" href="/visit/in-home/"><span>When travel is difficult</span><strong>At home.</strong></a><a class="motion-tile" href="/request-visit/"><span>Plan ahead</span><strong>Office visit.</strong></a></div>`,
   resources:`<div class="route-visual resource-visual"><p class="eyebrow">Find the right support</p><svg viewBox="0 0 360 300" aria-hidden="true"><path class="draw-route" d="M25 20 V270 M25 65 H330 M25 155 H330 M25 245 H330"/></svg><a class="motion-tile" href="https://211la.org/needhelp"><strong>211 LA</strong><span>Food &amp; shelter</span></a><a class="motion-tile" href="https://www.coveredca.com/enrollment"><strong>Coverage</strong><span>Health insurance</span></a><a class="motion-tile" href="tel:988"><strong>988</strong><span>Crisis support</span></a></div>`,
   insurance:`<div class="route-visual insurance-visual"><p class="eyebrow">Bring what you have</p><div class="motion-tile"><span>Coverage</span><strong>Your insurance card</strong></div><div class="motion-tile"><span>Identification</span><strong>A photo ID</strong></div><div class="motion-tile"><span>Your medicines</span><strong>A current list</strong></div><p>No insurance? Call us to discuss your options.</p></div>`,
   'request-visit':`<div class="route-visual hours-visual"><p class="eyebrow">Monday–Friday</p><div class="motion-tile"><strong>9<span>am</span></strong></div><span class="hours-divider" aria-hidden="true"></span><div class="motion-tile"><strong>5<span>pm</span></strong></div><p>Time for your health.</p></div>`,
   'visit/in-home':`<div class="route-visual home-visual"><svg viewBox="0 0 320 220" aria-hidden="true"><path class="draw-route" d="M30 105 L160 20 L290 105 M65 85 V200 H255 V85 M133 200 V130 H187 V200"/></svg><p class="eyebrow">Care at home</p><h2>Let’s discuss<br>what you need.</h2><p>Availability is confirmed by the clinic.</p></div>`
  };
  const card=`<aside class="hero-contact-card route-feature">${panels[slug]}<div class="feature-contact"><a href="tel:+18186744414">(818) 674-4414</a><a href="mailto:office@canbycc.org">office@canbycc.org</a></div></aside>`;
  html=html.replace(/(<section class="page-hero">[\s\S]*?<\/div>)(<\/section>)/,'$1'+card+'$2');
 }
 return html;
}
const entries=JSON.parse(readFileSync('scripts/entries.json'));
for(const file of [...new Set(entries)]){
 const html=readFileSync(file,'utf8');
 if(!html.includes('<main'))continue;
 const slug=file==='index.html'?'home':file.replace(/\/index.html$/,'');
 writeFileSync(file,polish(slug,html));
}
