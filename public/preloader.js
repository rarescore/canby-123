/* Local adaptation of the user-supplied Framer LogoPreloader sequence.
   Logo enters from +80px, exits to -80px, and the background fades. */
(()=>{
 const overlay=document.querySelector('.logo-preloader');if(!overlay)return;
 let seen=false;try{seen=sessionStorage.getItem('canby-loaded')==='1'}catch{}
 if(seen||matchMedia('(prefers-reduced-motion: reduce)').matches){overlay.remove();return;}
 overlay.hidden=false;
 const start=performance.now();
 let finished=false;
 function finish(){if(finished)return;finished=true;overlay.classList.add('preloader-exit');setTimeout(()=>{overlay.remove();try{sessionStorage.setItem('canby-loaded','1')}catch{}},1200)}
 setTimeout(()=>overlay.classList.add('preloader-ready'),80);
 const ready=()=>setTimeout(finish,Math.max(0,1900-(performance.now()-start)));
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
 setTimeout(finish,3400);
 window.addEventListener('pageshow',e=>{if(e.persisted)overlay.remove()});
})();
