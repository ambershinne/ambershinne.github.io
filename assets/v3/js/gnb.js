/* Contact dropdown in the detail-page GNB.
   Delegated + re-queried on every event, so it still works when a page runtime
   (e.g. winback's x-dc) re-renders the header after this script runs. */
(function(){
  function wrap(){ return document.querySelector('.gnb__cwrap'); }
  function set(w, o){
    if (!w) return;
    var m = w.querySelector('.gnb__cmenu'), b = w.querySelector('.gnb__cta');
    if (o) w.setAttribute('data-open', ''); else w.removeAttribute('data-open');
    if (m) m.hidden = !o;
    if (b) b.setAttribute('aria-expanded', o ? 'true' : 'false');
  }
  document.addEventListener('click', function(e){
    var w = wrap(); if (!w) return;
    if (e.target.closest && e.target.closest('.gnb__cta')) { set(w, !w.hasAttribute('data-open')); return; }
    if (!w.contains(e.target)) set(w, false);
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') set(wrap(), false); });
})();
