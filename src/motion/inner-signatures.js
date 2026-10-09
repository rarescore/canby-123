import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const mm=gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)',()=>{
 const cleanups=[];
 const visual=document.querySelector('.route-visual');
 if(visual){
  gsap.from(visual.querySelectorAll('.motion-tile'),{y:55,rotation:document.body.classList.contains('route-insurance')?-5:0,opacity:0,duration:.9,stagger:.16,ease:'power3.out',delay:.2});
  visual.querySelectorAll('.draw-route').forEach(path=>{
   const length=path.getTotalLength();
   gsap.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.7,ease:'power2.inOut',delay:.3});
  });
  const divider=visual.querySelector('.hours-divider');
  if(divider)gsap.from(divider,{scaleX:0,transformOrigin:'left',duration:1.1,delay:.35,ease:'power3.out'});
 }
 document.querySelectorAll('.route-services .detail-row').forEach(row=>{
  gsap.fromTo(row,{'--service-fill':'0%'},{'--service-fill':'100%',ease:'none',scrollTrigger:{trigger:row,start:'top 85%',end:'top 35%',scrub:.5}});
 });
 document.querySelectorAll('.visit-checklist>label').forEach((label,index)=>{
  gsap.from(label,{x:index%2?25:-25,opacity:0,duration:.7,ease:'power3.out',scrollTrigger:{trigger:label,start:'top 92%',once:true}});
 });
 const about=document.querySelector('.about-address');
 if(about)gsap.fromTo(about,{'--address-reveal':'0%'},{'--address-reveal':'100%',duration:1.2,delay:.75,ease:'power2.out'});
 const steps=document.querySelector('.impact-steps');
 if(steps)gsap.fromTo(steps,{'--journey':'0%'},{'--journey':'100%',ease:'none',scrollTrigger:{trigger:steps,start:'top 70%',end:'bottom 65%',scrub:.5}});
 document.querySelectorAll('.article-index li').forEach((card,i)=>{
  gsap.from(card,{rotateX:8,transformPerspective:900,duration:.9,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 95%',once:true}});
 });
 const article=document.querySelector('.article-shell');
 if(article){
  const progress=document.createElement('div');progress.className='reading-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
  gsap.fromTo(progress,{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:article,start:'top top',end:'bottom bottom',scrub:true}});
  cleanups.push(()=>progress.remove());
 }
 document.querySelectorAll('[data-application]').forEach(button=>{
  const handler=()=>requestAnimationFrame(()=>{const panel=document.querySelector('.application-panel:not([hidden])');if(panel)gsap.fromTo(panel,{opacity:0,y:22},{opacity:1,y:0,duration:.45,clearProps:'opacity,transform'});});
  button.addEventListener('click',handler);cleanups.push(()=>button.removeEventListener('click',handler));
 });
 return()=>cleanups.forEach(fn=>fn());
});
