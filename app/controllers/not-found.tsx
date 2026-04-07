import { css } from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import { Document } from '../ui/document.js'
import {
  fourOhFourDigitStyles,
  fourOhFourLinkStyles,
  fourOhFourStyles,
  fourOhFourTaglineStyles,
} from '../ui/site-styles.js'

export async function notFoundAction() {
  const siteBasePath = getSiteBasePath()
  const html = await renderToString(
    <Document
      title="Page Not Found"
      description="This page wandered off. Head back to the homepage."
      path="/404.html"
      includeNav={false}
      scripts={['/client/404.js']}
    >
      <div className="four-oh-four" mix={[css(fourOhFourStyles)]}>
        <div>
          <span className="four-oh-four-digit" mix={[css(fourOhFourDigitStyles)]}>4</span>
          <span className="four-oh-four-digit" mix={[css(fourOhFourDigitStyles)]}>0</span>
          <span className="four-oh-four-digit" mix={[css(fourOhFourDigitStyles)]}>4</span>
        </div>
        <p className="four-oh-four-tagline" id="tagline" mix={[css(fourOhFourTaglineStyles)]}></p>
        <a href={withBasePath('/', siteBasePath)} className="four-oh-four-link" mix={[css(fourOhFourLinkStyles)]}>Back to the homepage →</a>
      </div>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
