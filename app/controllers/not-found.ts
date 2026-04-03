import { html } from 'remix/html-template'
import { createHtmlResponse } from 'remix/response/html'
import { document } from '../ui/document.js'

export function notFoundAction() {
  const content = html.raw`
    <div class="four-oh-four">
      <div>
        <span class="four-oh-four-digit">4</span>
        <span class="four-oh-four-digit">0</span>
        <span class="four-oh-four-digit">4</span>
      </div>
      <p class="four-oh-four-tagline" id="tagline"></p>
      <a href="/" class="four-oh-four-link">Back to the homepage →</a>
    </div>`

  return createHtmlResponse(
    document(
      {
        title: 'Page Not Found',
        description: 'This page wandered off. Head back to the homepage.',
        path: '/404.html',
        scripts: ['/client/404.js'],
      },
      content,
    ),
    { status: 404 },
  )
}
