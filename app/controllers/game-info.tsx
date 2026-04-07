import { css } from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { getGameAttribution, repositoryCodeLicense } from '../data/attributions/index.js'
import { Document } from '../ui/document.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import {
  attributionItemStyles,
  attributionListStyles,
  pageHeroStyles,
  pageHomeLinkStyles,
  pageStackStyles,
  sectionCardHeadingStyles,
  sectionCardStyles,
  sectionLabelStyles,
  sectionMutedStyles,
} from '../ui/site-styles.js'

export async function gameInfoAction(slug: string) {
  const siteBasePath = getSiteBasePath()
  const game = getGameAttribution(slug)
  const gamePath = withBasePath(`/${slug}/`, siteBasePath)

  const html = await renderToString(
    <Document
      title={`${game.name} — Info`}
      description={`Credits, attributions, and details for ${game.name}.`}
      path={`/${slug}/info/`}
      includeNav={false}
    >
      <div className="page-stack" mix={[css(pageStackStyles)]}>
        <section className="page-hero" mix={[css(pageHeroStyles)]}>
          <a href={gamePath} className="page-home-link" mix={[css(pageHomeLinkStyles)]}>← Back to {game.name}</a>
          <h1>{game.name}</h1>
          <p><span className="section-label" mix={[css(sectionLabelStyles)]}>Code license:</span> {game.codeLicense}</p>
        </section>

        <section className="section-card" mix={[css(sectionCardStyles)]}>
          <h2>About</h2>
          <p>{game.summary}</p>
        </section>

        <section className="section-card" mix={[css(sectionCardStyles)]}>
          <div className="section-card-heading" mix={[css(sectionCardHeadingStyles)]}>
            <h2>Credits &amp; Attributions</h2>
          </div>
          <div className="attribution-list" mix={[css(attributionListStyles)]}>
            {game.entries.map((entry) => (
              <article className="attribution-item" aria-label={`${entry.title} attribution`} mix={[css(attributionItemStyles)]}>
                <h3>{entry.title}</h3>
                <p className="section-muted" mix={[css(sectionMutedStyles)]}>{entry.type} · {entry.creator}</p>
                <p><span className="section-label" mix={[css(sectionLabelStyles)]}>Used in:</span> {entry.usedIn}</p>
                <p>
                  <span className="section-label" mix={[css(sectionLabelStyles)]}>Source:</span>{' '}
                  {entry.sourceUrl
                    ? <a href={entry.sourceUrl} target="_blank" rel="noopener">{entry.source}</a>
                    : entry.source}
                </p>
                <p>
                  <span className="section-label" mix={[css(sectionLabelStyles)]}>License:</span>{' '}
                  {entry.licenseUrl
                    ? <a href={entry.licenseUrl} target="_blank" rel="noopener">{entry.license}</a>
                    : entry.license}
                </p>
                <p><span className="section-label" mix={[css(sectionLabelStyles)]}>Modifications:</span> {entry.modifications}</p>
                {entry.notes ? <p><span className="section-label" mix={[css(sectionLabelStyles)]}>Notes:</span> {entry.notes}</p> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="section-card" mix={[css(sectionCardStyles)]}>
          <p className="section-muted" mix={[css(sectionMutedStyles)]}>
            Repository code is licensed under {repositoryCodeLicense}. Games surface their own credits in the deployed UI whenever they use third-party or notable media resources.
          </p>
        </section>
      </div>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
