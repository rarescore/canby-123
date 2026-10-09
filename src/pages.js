import { initMenu } from './ui/menu.js';
import { initLanguage, phrase } from './i18n/apply.js';
initMenu();

function thanksDialog() {
  let dialog = document.getElementById('form-thanks');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'form-thanks';
    dialog.className = 'form-thanks';
    dialog.innerHTML = '<div class="form-thanks-card"><h2 data-i18n-skip></h2><p data-i18n-skip></p><button class="button" type="button" data-i18n-skip></button></div>';
    document.body.appendChild(dialog);
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
  }
  dialog.querySelector('h2').textContent = phrase('Thank you');
  dialog.querySelector('p').textContent = phrase('We have received your message.');
  dialog.querySelector('button').textContent = phrase('Close');
  dialog.showModal();
}

async function filePayload(file) {
  if (!file || !file.size) return null;
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return { name: file.name, type: file.type, data };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return response.ok && data.ok ? data : null;
}

async function sendForm(form) {
  const fields = {};
  let file = null;
  for (const [key, value] of new FormData(form).entries()) {
    if (value instanceof File) file = await filePayload(value);
    else if (key !== 'company') fields[key] = value;
  }
  return postJson('/api/forms', {
    subject: form.dataset.subject || document.title,
    page: location.pathname,
    fields,
    file,
    company: form.querySelector('[name=company]')?.value || '',
  });
}

function showFormError(form) {
  const result = form.querySelector('.email-result');
  if (!result) return;
  result.hidden = false;
  result.focus();
}

document.querySelectorAll('.email-form').forEach(form => {
  if (!form.querySelector('[name=company]')) {
    const trap = document.createElement('input');
    trap.name = 'company';
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.className = 'visually-hidden';
    trap.setAttribute('aria-hidden', 'true');
    form.append(trap);
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type=submit]');
    const result = form.querySelector('.email-result');
    if (result) result.hidden = true;
    if (button) button.disabled = true;
    try {
      const sent = await sendForm(form);
      if (!sent) {
        showFormError(form);
        return;
      }
      form.reset();
      thanksDialog();
    } catch {
      showFormError(form);
    } finally {
      if (button) button.disabled = false;
    }
  });
});

const donation = document.querySelector('#donation-form');
if (donation) {
  const custom=document.querySelector('#custom-amount');
  const receipt=document.querySelector('#donation-receipt');
  const currency=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  function current() {
    const data=new FormData(donation);
    const amount=data.get('amount')==='other'?Number(custom.value):Number(data.get('amount'));
    return {amount,frequency:data.get('frequency'),method:data.get('method')};
  }
  function update() {
    const other=new FormData(donation).get('amount')==='other';
    custom.disabled=!other;custom.required=other;
    document.querySelector('#custom-amount-label').hidden=!other;
    document.querySelector('#donation-total').setAttribute('data-i18n-skip','');
    document.querySelector('#receipt-summary').setAttribute('data-i18n-skip','');
    const {amount,frequency}=current();
    document.querySelector('#donation-total').textContent=(amount>0?currency.format(amount):phrase('Choose an amount'))+(frequency==='Monthly'?phrase(' / month'):'');
    receipt.hidden=true;
  }
  donation.addEventListener('input',update);
  donation.addEventListener('change',update);
  donation.addEventListener('reset',()=>setTimeout(update,0));
  donation.addEventListener('submit',event=>{
    event.preventDefault();
    const {amount,frequency,method}=current();
    if (!Number.isFinite(amount)||amount<1||amount>100000) return;
    document.querySelector('#receipt-summary').textContent=`${currency.format(amount)} · ${phrase(frequency)} · ${phrase(method)} ${phrase('preview')}`;
    receipt.hidden=false;receipt.focus();
  });
  update();
  document.addEventListener('canby:language', update);
}

import "./motion/routes.js";

document.querySelectorAll('[data-checklist]').forEach(list=>{
 const checks=[...list.querySelectorAll('input[type=checkbox]')];
 const progress=list.querySelector('.check-progress');
 progress.setAttribute('data-i18n-skip','');
 const update=()=>progress.textContent=phrase('{done} of {total} prepared').replace('{done}', checks.filter(c=>c.checked).length).replace('{total}', checks.length);
 checks.forEach(check=>check.addEventListener('change',update));
 list.querySelector('[data-clear-checklist]').addEventListener('click',()=>{checks.forEach(c=>c.checked=false);update()});
 list.querySelector('[data-print]').addEventListener('click',()=>window.print());
 document.addEventListener('canby:language', update);
 update();
});

 document.querySelectorAll('[data-application]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-application]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.querySelector('#medical-application').hidden=button.dataset.application!=='medical';
  document.querySelector('#community-application').hidden=button.dataset.application!=='community';
 }));
 const giving=document.querySelector('#giving-form');
 if(giving){
  const other=giving.querySelector('#giving-custom');
  const methods=giving.querySelectorAll('[data-payment]');
  const checkMail=giving.querySelector('#check-mail');
  const status=giving.querySelector('#payment-status');
  giving.querySelector('#giving-total').setAttribute('data-i18n-skip','');
  status.setAttribute('data-i18n-skip','');
  const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
  let chosen=null;
  const amountOf=()=>{
   const data=new FormData(giving);
   const custom=data.get('amount')==='Other';
   return {amount:custom?Number(other.value):Number(data.get('amount')),cadence:data.get('cadence'),name:data.get('Full name'),email:data.get('Email'),custom};
  };
  const update=()=>{
   const {amount,cadence,custom}=amountOf();
   other.disabled=!custom;other.required=custom;giving.querySelector('#giving-custom-label').hidden=!custom;
   giving.querySelector('#giving-total').textContent=amount>0?money.format(amount)+(cadence==='Weekly'?phrase(' / week'):cadence==='Yearly'?phrase(' / year'):''):phrase('Choose an amount');
  };
  const selectMethod=async name=>{
   chosen=name;
   methods.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.payment===name)));
   const check=name==='Check';
   if(checkMail) checkMail.hidden=!check;
   if (!giving.reportValidity()) return;
   const {amount,cadence,name:donor,email}=amountOf();
   if (!Number.isFinite(amount)||amount<1||amount>100000) return;
   methods.forEach(b=>b.disabled=true);
   status.textContent=phrase('Sending…');
   try {
    const result=await postJson('/api/checkout',{amount,cadence,method:name,name:donor,email});
    if (!result) {
     status.textContent=phrase('We could not send that. Please call (818) 674-4414 or email office@canbycc.org.');
     return;
    }
    if (check) {
     status.textContent=phrase('Mail your check to the clinic address above.');
     thanksDialog();
     return;
    }
    status.textContent=phrase('Continue in secure checkout to complete your gift.');
    location.assign(result.url);
   } catch {
    status.textContent=phrase('We could not send that. Please call (818) 674-4414 or email office@canbycc.org.');
   } finally {
    methods.forEach(b=>b.disabled=false);
   }
  };
  giving.addEventListener('input',update);giving.addEventListener('change',update);
  giving.addEventListener('submit',e=>e.preventDefault());
  methods.forEach(b=>b.addEventListener('click',()=>selectMethod(b.dataset.payment)));
  update();
  if (new URLSearchParams(location.search).get('gift')==='received') thanksDialog();
  document.addEventListener('canby:language', ()=>{ update(); });
 }

import './motion/inner-signatures.js';
initLanguage();