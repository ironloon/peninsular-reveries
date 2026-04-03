import { renderToString } from 'remix/component/server'
import { Document } from '../ui/document.js'

export async function notFoundAction() {
  const html = await renderToString(
    <Document
      title="Page Not Found"
      description="This page wandered off. Head back to the homepage."
      path="/404.html"
      scripts={['/client/404.js']}
    >
      <div className="four-oh-four">
        <div>
          <span className="four-oh-four-digit">4</span>
          <span className="four-oh-four-digit">0</span>
          <span className="four-oh-four-digit">4</span>
        </div>
        <p className="four-oh-four-tagline" id="tagline"></p>
        <a href="/" className="four-oh-four-link">Back to the homepage →</a>
      </div>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
