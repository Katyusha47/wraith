import DOMPurify from 'dompurify'

/**
 * Enterprise-grade HTML Sanitization for Matrix Messages
 *
 * Configured specifically to strip malicious vectors (XSS, tabs, injections)
 * while allowing safe markdown-rendered HTML elements to persist.
 *
 * @param {string} dirtyHtml - The untrusted HTML from Matrix
 * @returns {string} - Clean, safe HTML ready for v-html rendering
 */
export function sanitizeMatrixHtml(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return ''

  // 1. Core DOMPurify Configuration
  // Enforce zero-trust model by stripping dangerous tags and attributes
  const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'b',
      'strong',
      'i',
      'em',
      'u',
      'a',
      'blockquote',
      'code',
      'pre',
      'span',
      'p',
      'br',
      'ul',
      'ol',
      'li',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'button',
      'link',
      'meta',
      'style',
    ],
    FORBID_ATTR: ['style', 'onclick', 'onerror', 'onload', 'onmouseover', 'srcdoc'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|matrix|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
  })

  // 2. Post-processing hook for Tabnabbing and Protocol protections
  // DOMPurify strips dangerous URIs based on ALLOWED_URI_REGEXP, but we also enforce
  // target=_blank and rel=noopener on all links.

  // Create a temporary DOM element to manipulate the sanitized string safely
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = cleanHtml

  const links = tempDiv.getElementsByTagName('a')
  for (let i = 0; i < links.length; i++) {
    const link = links[i]

    // Strict Reverse Tabnabbing Protection
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')

    // Fallback: block javascript: injection double-check
    // (DOMPurify catches this, but defense in depth)
    const href = link.getAttribute('href') || ''
    if (href.trim().toLowerCase().startsWith('javascript:')) {
      link.removeAttribute('href')
    }
  }

  // Return the manipulated, completely safe string representation
  return tempDiv.innerHTML || ''
}
