import {gsap} from 'gsap';
import {phrase} from '../i18n/apply.js';

export function initMarquee(env){
 const root=document.querySelector('[data-motion="marquee"]');
 if(!root)return ()=>{};
 const viewport=root.querySelector('.marquee-viewport');
 const track=root.querySelector('.marquee-track');
 const toggle=root.querySelector('[data-marquee-toggle]');
 if(toggle) toggle.setAttribute('data-i18n-skip','');
 root.querySelectorAll('.person-hint').forEach(el=>el.setAttribute('data-i18n-skip',''));
 let tween;let paused=false;let hovering=false;
 const expanded=()=>!!root.querySelector('[aria-expanded="true"]');
 const sync=()=>{if(!tween)return;if(paused||hovering||expanded()||document.hidden)tween.pause();else tween.play();};
 const play=()=>{
  tween?.kill();
  if(track) gsap.set(track,{x:0});
  if(!env.motion||env.small||!track)return;
  const distance=Math.max(0,track.scrollWidth-viewport.clientWidth);
  if(distance>0)tween=gsap.to(track,{x:-distance,duration:distance/18,repeat:-1,yoyo:true,ease:'none',force3d:true});
  sync();
 };
 const click=event=>{
  const button=event.target.closest('.person-expand');
  if(!button)return;
  const wasOpen=button.getAttribute('aria-expanded')==='true';
  root.querySelectorAll('.person').forEach(card=>{
   const active=card.contains(button)&&!wasOpen;
   card.classList.toggle('is-expanded',active);
   card.querySelector('.person-expand').setAttribute('aria-expanded',String(active));
   card.querySelector('.person-detail').hidden=!active;
   card.querySelector('.person-hint').textContent=active?phrase('Close details'):phrase('Explore this role');
  });
  sync();
 };
 const enter=()=>{hovering=true;sync();};
 const leave=()=>{hovering=false;sync();};
 const focus=()=>{paused=true;sync();};
 const togglePlay=()=>{paused=!paused;toggle.textContent=paused?phrase('Play carousel'):phrase('Pause carousel');toggle.setAttribute('aria-pressed',String(paused));sync();};
 toggle.hidden=!env.motion||env.small;
 toggle.textContent=phrase('Pause carousel');
 root.addEventListener('click',click);
 viewport.addEventListener('pointerenter',enter);viewport.addEventListener('pointerleave',leave);
 viewport.addEventListener('focusin',focus);viewport.addEventListener('touchstart',focus,{passive:true});
 toggle.addEventListener('click',togglePlay);
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('resize',play);
 document.addEventListener('canby:language',()=>{
  root.querySelectorAll('.person-hint').forEach(el=>{
   const open=el.closest('.person')?.querySelector('.person-expand')?.getAttribute('aria-expanded')==='true';
   el.textContent=open?phrase('Close details'):phrase('Explore this role');
  });
  if(toggle) toggle.textContent=paused?phrase('Play carousel'):phrase('Pause carousel');
 });
 play();
 return()=>{tween?.kill();root.removeEventListener('click',click);viewport.removeEventListener('pointerenter',enter);viewport.removeEventListener('pointerleave',leave);viewport.removeEventListener('focusin',focus);viewport.removeEventListener('touchstart',focus);toggle.removeEventListener('click',togglePlay);document.removeEventListener('visibilitychange',sync);window.removeEventListener('resize',play);};
}
