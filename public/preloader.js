/* Local adaptation of the user-supplied Framer LogoPreloader sequence.
   Logo enters from +80px, exits to -80px, and the background fades. */
(()=>{
 const film=document.createElement('link');
 film.rel='preload';film.as='video';film.href='/assets/hero.mp4';
 document.head.appendChild(film);
 const warm=()=>{const video=document.querySelector('#hero-video');if(!video)return;video.preload='auto';video.load();};
 if(document.readyState!=='loading')warm();else document.addEventListener('DOMContentLoaded',warm,{once:true});
 const overlay=document.querySelector('.logo-preloader');if(!overlay)return;
 let seen=false;try{seen=sessionStorage.getItem('canby-loaded')==='1'}catch{}
 if(seen||matchMedia('(prefers-reduced-motion: reduce)').matches){overlay.remove();return;}
 overlay.hidden=false;
 const start=performance.now();
 let finished=false;
 function finish(){if(finished)return;finished=true;overlay.classList.add('preloader-exit');setTimeout(()=>{overlay.remove();try{sessionStorage.setItem('canby-loaded','1')}catch{}},1200)}
 setTimeout(()=>overlay.classList.add('preloader-ready'),80);
 const ready=()=>setTimeout(finish,Math.max(0,700-(performance.now()-start)));
 if(document.readyState!=='loading')ready();else document.addEventListener('DOMContentLoaded',ready,{once:true});
 setTimeout(finish,1400);
 window.addEventListener('pageshow',e=>{if(e.persisted)overlay.remove()});
})();
