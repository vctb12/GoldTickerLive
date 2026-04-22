/**
 * Shared safe-DOM utilities.
 *
 * Every client-side page that renders dynamic content (search results,
 * shop cards, calculator breakdowns, etc.) should use these helpers instead of
 * rolling its own escaping. Concentrating the policy here means:
 *   1. A single, auditable definition of "safe" for the project.
 *   2. Static analysis (CodeQL, the CI grep guard in `scripts/node/check-unsafe-dom.js`)
 *      can allowlist this file and flag any new raw `innerHTML` sinks elsewhere.
 *   3. If we ever need to swap in a more formal sanitizer (e.g. DOMPurify with a
 *      pinned config), there is one place to do it.
 *
 * Rules of thumb:
 *   - Prefer `setText(el, value)` over `el.textContent = value` for nullish safety.
 *   - Prefer `el(tag, attrs, children)` over template-string `innerHTML` when the
 *     content mixes untrusted strings with attributes.
 *   - Only call `setTrustedHTML` with strings you constructed yourself from
 *     escaped fragments — never with raw user input.
 */

/** HTML-escape a value for safe insertion inside element text or attribute
 *  values. Returns an empty string for `null`/`undefined`. */
export function escape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Return the URL only if it uses a safe http(s) protocol, otherwise ''. */
export function safeHref(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Explicitly reject javascript:, data:, vbscript:, file:, etc. — allowlist only.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Also allow protocol-relative and root-relative internal links.
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../'))
    return trimmed;
  if (trimmed.startsWith('#')) return trimmed;
  return '';
}

/** Return a tel:-safe phone string (digits, +, -, spaces, parens only). */
export function safeTel(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[^\d+\-() ]/g, '').replace(/\s+/g, '');
}

/** Null-safe textContent setter. */
export function setText(node, value) {
  if (node) node.textContent = String(value ?? '');
}

/** Remove every child from `node`. Faster and safer than `node.innerHTML = ''`
 *  because it does not invoke the HTML parser. */
export function clear(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Create an element with attributes and children.
 *
 *   el('a', { href: safeHref(url), class: 'btn' }, ['Go'])
 *
 * Attribute values are set with `setAttribute`, which treats them as strings
 * and does not invoke the HTML parser. Children may be nodes or strings; strings
 * become text nodes (never parsed as HTML).
 */
export function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = String(value);
      else if (key === 'dataset' && typeof value === 'object') {
        for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = String(dv);
      } else if (key === 'style' && typeof value === 'object') {
        for (const [sk, sv] of Object.entries(value)) node.style[sk] = String(sv);
      } else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        node.setAttribute(key, '');
      } else {
        node.setAttribute(key, String(value));
      }
    }
  }
  if (children) {
    const arr = Array.isArray(children) ? children : [children];
    for (const child of arr) {
      if (child === null || child === undefined || child === false) continue;
      if (child instanceof Node) node.appendChild(child);
      else node.appendChild(document.createTextNode(String(child)));
    }
  }
  return node;
}

/**
 * Assign a previously-escaped, trusted HTML string to an element.
 *
 * ⚠️ The caller is responsible for ensuring the string was built entirely from
 * `escape()`-wrapped fragments or from hard-coded literals. Do NOT pass raw
 * user input. This helper exists so the CI regression guard can allowlist a
 * single named function instead of every ad-hoc `.innerHTML =` assignment.
 */
export function setTrustedHTML(node, html) {
  // Intentional: caller guarantees `html` is safe (built from `escape()` output
  // or hardcoded literals). The per-file baseline in
  // scripts/node/check-unsafe-dom.js is how we regression-gate this.
  if (node) node.innerHTML = html;
}
