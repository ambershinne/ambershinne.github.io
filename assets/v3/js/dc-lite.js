/* dc-lite: tiny runtime for the ambershin v3 pages.
   Reads the page template (<template id="tpl">) and the page logic
   (<script type="text/x-dc">), renders {{ holes }}, <sc-for>, <sc-if>,
   and re-renders on setState by patching the existing DOM in place. */
(function () {
  'use strict';

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var p = typeof patch === 'function' ? patch(this.state) : patch;
    for (var k in p) this.state[k] = p[k];
    if (this.__schedule) this.__schedule();
  };
  window.DCLogic = DCLogic;

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function onlyHole(str) {
    var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str);
    return m ? m[1] : null;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) {
      var v = lookup(p, scope);
      return v == null ? '' : String(v);
    });
  }
  function child(scope, name, value) {
    var s = Object.create(scope);
    s[name] = value;
    return s;
  }

  /* Build a fresh DOM fragment (virtual) from the template node */
  function build(node, scope, out) {
    if (node.nodeType === 3) {
      out.push(document.createTextNode(node.nodeValue.indexOf('{{') === -1 ? node.nodeValue : interp(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var list = lookup(onlyHole(node.getAttribute('list')) || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var s = child(scope, as, list[i]);
        for (var c = node.firstChild; c; c = c.nextSibling) build(c, s, out);
      }
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(onlyHole(node.getAttribute('value')) || '', scope)) {
        for (var c2 = node.firstChild; c2; c2 = c2.nextSibling) build(c2, scope, out);
      }
      return;
    }
    var el = node.namespaceURI === 'http://www.w3.org/2000/svg'
      ? document.createElementNS(node.namespaceURI, node.tagName)
      : document.createElement(node.tagName);
    el.__ev = {};
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a];
      var name = at.name;
      if (name.indexOf('hint-') === 0) continue;
      var h = onlyHole(at.value);
      if (/^on[a-z]+$/i.test(name)) {
        el.__ev[name.slice(2).toLowerCase()] = h ? lookup(h, scope) : null;
        continue;
      }
      if (name === 'ref') { el.__ref = h ? lookup(h, scope) : null; continue; }
      if (h !== null) {
        var v = lookup(h, scope);
        if (v === false || v == null) continue;
        if (v === true) { el.setAttribute(name, ''); continue; }
        el.setAttribute(name, String(v));
      } else {
        el.setAttribute(name, at.value.indexOf('{{') === -1 ? at.value : interp(at.value, scope));
      }
    }
    var kids = [];
    var src = tag === 'template' ? node.content : node;
    for (var k = src.firstChild; k; k = k.nextSibling) build(k, scope, kids);
    for (var j = 0; j < kids.length; j++) el.appendChild(kids[j]);
    out.push(el);
  }

  /* Event wiring: one real listener per type, handler swapped on each render */
  var EVMAP = { change: 'input' };
  function wire(el, evs) {
    el.__h = el.__h || {};
    for (var type in evs) {
      var real = (el.tagName === 'INPUT' && EVMAP[type]) || type;
      if (!el.__h[real]) {
        (function (r) {
          el.addEventListener(r, function (e) { var f = el.__h[r]; if (typeof f === 'function') f(e); }, r === 'scroll' ? { passive: true } : false);
        })(real);
      }
      el.__h[real] = evs[type];
    }
  }

  /* Patch live node `cur` to match freshly built node `nxt` */
  var refs = [];
  function patch(parent, curKids, nxtKids) {
    var i;
    for (i = 0; i < nxtKids.length; i++) {
      var cur = curKids[i];
      var nxt = nxtKids[i];
      if (!cur) { mount(nxt); parent.appendChild(nxt); continue; }
      if (cur.nodeType !== nxt.nodeType || (cur.nodeType === 1 && cur.tagName !== nxt.tagName)) {
        mount(nxt); parent.replaceChild(nxt, cur); continue;
      }
      if (cur.nodeType === 3) { if (cur.nodeValue !== nxt.nodeValue) cur.nodeValue = nxt.nodeValue; continue; }
      // attributes
      var a, seen = {};
      for (a = 0; a < nxt.attributes.length; a++) {
        var at = nxt.attributes[a];
        seen[at.name] = 1;
        if (cur.getAttribute(at.name) !== at.value) cur.setAttribute(at.name, at.value);
      }
      for (a = cur.attributes.length - 1; a >= 0; a--) {
        var nm = cur.attributes[a].name;
        if (!seen[nm]) cur.removeAttribute(nm);
      }
      if (cur.tagName === 'INPUT' && nxt.hasAttribute('value') && cur.value !== nxt.getAttribute('value')) cur.value = nxt.getAttribute('value');
      wire(cur, nxt.__ev || {});
      if (nxt.__ref) refs.push([nxt.__ref, cur]);
      patch(cur, Array.prototype.slice.call(cur.childNodes), Array.prototype.slice.call(nxt.childNodes));
    }
    for (var r = curKids.length - 1; r >= nxtKids.length; r--) parent.removeChild(curKids[r]);
  }
  function mount(el) {
    if (el.nodeType !== 1) return;
    wire(el, el.__ev || {});
    if (el.__ref) refs.push([el.__ref, el]);
    var c = el.firstChild;
    for (; c; c = c.nextSibling) mount(c);
    if (el.tagName === 'INPUT' && el.hasAttribute('value')) el.value = el.getAttribute('value');
  }

  function start() {
    var tpl = document.getElementById('tpl');
    var code = document.querySelector('script[type="text/x-dc"]');
    var root = document.getElementById('app');
    if (!tpl || !code || !root) return;
    var defs = {};
    try { defs = JSON.parse(code.getAttribute('data-props') || '{}'); } catch (e) {}
    var props = {};
    for (var k in defs) if (k.charAt(0) !== '$' && defs[k] && 'default' in defs[k]) props[k] = defs[k]['default'];
    var Component = new Function('DCLogic', code.textContent + '\nreturn Component;')(DCLogic);
    var inst = new Component(props);
    var queued = false;
    function render() {
      queued = false;
      var vals = inst.renderVals();
      var out = [];
      for (var c = tpl.content.firstChild; c; c = c.nextSibling) build(c, vals, out);
      refs = [];
      patch(root, Array.prototype.slice.call(root.childNodes), out);
      for (var i = 0; i < refs.length; i++) { try { if (typeof refs[i][0] === 'function') refs[i][0](refs[i][1]); } catch (e) {} }
    }
    inst.__schedule = function () { if (!queued) { queued = true; requestAnimationFrame(render); } };
    render();
    if (inst.componentDidMount) inst.componentDidMount();
    window.addEventListener('pagehide', function () { if (inst.componentWillUnmount) inst.componentWillUnmount(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
