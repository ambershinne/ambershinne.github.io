(function(){var w=document.querySelector('.gnb__cwrap');if(!w)return;var b=w.querySelector('.gnb__cta'),m=w.querySelector('.gnb__cmenu');
function set(o){if(o){m.hidden=false;w.setAttribute('data-open','');}else{m.hidden=true;w.removeAttribute('data-open');}b.setAttribute('aria-expanded',o?'true':'false');}
b.addEventListener('click',function(e){e.stopPropagation();set(m.hidden);});
document.addEventListener('click',function(e){if(!w.contains(e.target))set(false);});
document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false);});})();
