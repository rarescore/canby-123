import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const media=gsap.matchMedia();
media.add({motion:'(prefers-reduced-motion: no-preference)',desktop:'(min-width: 801px)'},context=>{
  if(!context.conditions.motion)return;
  const desktop=context.conditions.desktop;
  const hero=document.querySelector('.page-hero');
  if(hero){
    const intro=gsap.timeline({defaults:{ease:'power3.out'}});
    intro.from(hero.querySelector('.eyebrow'),{y:18,opacity:0,duration:1.1})
      .from(hero.querySelector('h1'),{y:55,opacity:0,duration:1.15},'-=.4')
      .from(hero.querySelectorAll('.page-lead,.page-actions'),{y:22,opacity:0,duration:1.15,stagger:.12},'-=.65');
    const image=hero.querySelector(':scope > img');
    if(image){
      gsap.fromTo(image,{scale:1.1,yPercent:-3},{scale:1,yPercent:8,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.7}});
      gsap.to(hero.querySelector(':scope > div'),{y:desktop?-70:-25,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.6}});
    }
  }
  const stage=document.querySelector('.route-stage');
  if(stage){
    const scroll={trigger:stage,start:'top top',end:'bottom bottom',scrub:.5};
    if(stage.classList.contains('door-stage')){
      gsap.to('.door-left',{xPercent:-100,ease:'none',scrollTrigger:scroll});
      gsap.to('.door-right',{xPercent:100,ease:'none',scrollTrigger:scroll});
      const video=stage.querySelector('video');
      ScrollTrigger.create({...scroll,onUpdate:self=>{if(Number.isFinite(video.duration)&&video.readyState>=2)video.currentTime=self.progress*Math.max(0,video.duration-.05);}});
    }else gsap.fromTo('.approach-frame img',{scale:1.035},{scale:1,ease:'none',scrollTrigger:{trigger:stage,start:'top bottom',end:'bottom top',scrub:.5}});
  }
  // Headings and their content move as coordinated sections, rather than isolated rows.
  document.querySelectorAll('.detail-heading,.section-title,.page-close').forEach(block=>{
    gsap.from(block,{y:desktop?55:25,opacity:.15,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:block,start:'top 90%',toggleActions:'play none none reverse'}});
  });
  document.querySelectorAll('.detail-row').forEach((row,index)=>{
    const resources=document.body.classList.contains('route-resources');
    gsap.from(row,{y:resources?25:55,x:resources&&desktop?(index%2?55:-55):0,opacity:.15,ease:'none',scrollTrigger:{trigger:row,start:'top 96%',end:'top 60%',scrub:.5}});
  });
  document.querySelectorAll('.practical-grid,.choice-panels,.process-list,.giving-priorities,.appointment-options').forEach(group=>{
    gsap.from(group.children,{y:desktop?55:25,opacity:.1,duration:1.05,stagger:.13,ease:'power3.out',scrollTrigger:{trigger:group,start:'top 87%',toggleActions:'play none none reverse'}});
  });
  document.querySelectorAll('.detail-photo').forEach(photo=>{
    const wrap=document.createElement('div');
    wrap.className='scroll-photo-frame';photo.before(wrap);wrap.append(photo);
    gsap.fromTo(photo,{scale:1.12,yPercent:-4},{scale:1,yPercent:4,ease:'none',scrollTrigger:{trigger:wrap,start:'top bottom',end:'bottom top',scrub:.6}});
  });
  // Clinic story: hold the photograph while the three care principles pass alongside it.
  const story=document.querySelector('.route-our-clinic .editorial-split');
  if(story&&desktop){
    const photo=story.querySelector('.scroll-photo-frame');
    ScrollTrigger.create({trigger:story,start:'top 12%',end:'bottom 78%',pin:photo,pinSpacing:false});
    gsap.fromTo(story.querySelectorAll('.process-list li'),{opacity:.2},{opacity:1,stagger:.6,ease:'none',scrollTrigger:{trigger:story,start:'top 65%',end:'bottom 85%',scrub:.5}});
  }
  document.querySelectorAll('.page-faq details').forEach((item)=>{
    gsap.from(item,{y:25,opacity:.2,duration:.8,scrollTrigger:{trigger:item,start:'top 94%',toggleActions:'play none none reverse'}});
  });
  // Keep forms immediately readable and interactive; animate only adjacent explanatory panels.
  document.querySelectorAll('.form-section aside,.donation-section > div,.address-panel').forEach(panel=>{
    gsap.from(panel,{y:35,opacity:.2,duration:1.05,ease:'power2.out',scrollTrigger:{trigger:panel,start:'top 90%',toggleActions:'play none none reverse'}});
  });
  document.querySelectorAll('.about-story>p,.about-kicker,.record-badges article,.impact-steps article,.application-intro,.volunteer-next,.community-resources article,.article-index li,.article-shell article>section,.giving-contact').forEach(block=>{
    gsap.from(block,{y:desktop?35:18,opacity:.25,duration:1.05,ease:'power3.out',scrollTrigger:{trigger:block,start:'top 93%',toggleActions:'play none none reverse'}});
  });
  document.querySelectorAll('.about-photo,.impact-photo img').forEach(photo=>{
    gsap.fromTo(photo,{clipPath:'inset(8% 0 8% 0)'},{clipPath:'inset(0% 0 0% 0)',ease:'none',scrollTrigger:{trigger:photo,start:'top 90%',end:'top 25%',scrub:.5}});
  });
  document.querySelectorAll('[data-application]').forEach(button=>button.addEventListener('click',()=>requestAnimationFrame(()=>ScrollTrigger.refresh())));
  const refresh=()=>ScrollTrigger.refresh();
  window.addEventListener('load',refresh,{once:true});
  const disclosures=[...document.querySelectorAll('.page-faq details')];
  disclosures.forEach(el=>el.addEventListener('toggle',refresh));
  requestAnimationFrame(refresh);
  return()=>{
    window.removeEventListener('load',refresh);
    disclosures.forEach(el=>el.removeEventListener('toggle',refresh));
    document.querySelectorAll('.scroll-photo-frame').forEach(wrap=>{const photo=wrap.querySelector('img');if(photo)wrap.before(photo);wrap.remove();});
  };
});
