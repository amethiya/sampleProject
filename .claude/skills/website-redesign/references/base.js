// Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.
(function(){
  var t=document.querySelector('.menu-toggle'), m=document.getElementById('mobile-menu');
  if(t)t.addEventListener('click',function(){var o=t.getAttribute('aria-expanded')!=='true';t.setAttribute('aria-expanded',String(o));m.classList.toggle('open',o);t.textContent=o?'Close':'Menu'});
  // Keep the site's own photos, but drop tiny, broken or logo-like images.
  document.querySelectorAll('img:not([data-keep])').forEach(function(i){function bad(){if(i.dataset.fallback){i.src=i.dataset.fallback;delete i.dataset.fallback;return}i.style.display='none'} function c(){var w=i.naturalWidth,h=i.naturalHeight||1;if(w&&(w<240||w/h>2.8||h/w>2.8))bad()} if(i.complete)c(); else i.addEventListener('load',c); i.addEventListener('error',bad)});
  // Flour / spice / sparkle dust drawn in the theme's colour around cut-out images.
  var dc=getComputedStyle(document.documentElement).getPropertyValue('--dust').trim()||'245,240,230';
  document.querySelectorAll('.dust').forEach(function(d,k){
    var c=document.createElement('canvas');c.width=c.height=900;d.appendChild(c);var x=c.getContext('2d');
    var seed=(k+1)*9301;function r(){seed=(seed*9301+49297)%233280;return seed/233280}
    function g(){var u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
    var dir=k%2?Math.PI+0.35:-0.35;
    for(var i=0;i<1400;i++){var a=dir+g()*0.55,rad=Math.abs(300+g()*70)-Math.log(r()||.01)*55,px=450+Math.cos(a)*rad,py=450+Math.sin(a)*rad,s=[0.6,0.8,1,1,1.2,1.5,2,2.6][Math.floor(r()*8)];
      x.fillStyle='rgba('+dc+','+(0.28+r()*0.65).toFixed(2)+')';x.beginPath();x.arc(px,py,s,0,6.283);x.fill()}
  });
  // Press / testimonial slider.
  var sl=document.querySelector('.slides');
  if(sl&&sl.children.length){var i=0,n=sl.children.length;function per(){return innerWidth<600?1:innerWidth<900?2:3}
    function go(d){i=Math.max(0,Math.min(n-per(),i+d));var w=sl.children[0].getBoundingClientRect().width+22;sl.style.transform='translateX('+(-i*w)+'px)'}
    var p=document.querySelector('.prev'),q=document.querySelector('.next');if(p)p.addEventListener('click',function(){go(-1)});if(q)q.addEventListener('click',function(){go(1)});addEventListener('resize',function(){go(0)})}
})();
