import { css } from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'
import { attributionsPagePath, gameAttributions, repositoryCodeLicense } from '../data/attributions/index.js'
import { Document } from '../ui/document.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'
import {
  attributionItemStyles,
  attributionListStyles,
  attributionSectionStyles,
  pageHeroStyles,
  pageHomeLinkStyles,
  pageStackStyles,
  sectionCardHeadingStyles,
  sectionCardStyles,
  sectionLabelStyles,
  sectionMutedStyles,
} from '../ui/site-styles.js'

export async function attributionsAction() {
  const siteBasePath = getSiteBasePath()

  const html = await renderToString(
    <Document
      title="Attributions"
      description="Licensing and credits for Peninsular Reveries and its games."
      path={attributionsPagePath}
      includeNav={false}
    >
      <div className="page-stack" mix={[css(pageStackStyles)]}>
        <section className="page-hero" mix={[css(pageHeroStyles)]}>
          <a href={withBasePath('/', siteBasePath)} className="page-home-link" mix={[css(pageHomeLinkStyles)]}>← Home</a>
          <h1>Attributions</h1>
          <p>One place for licensing and credits across the site and its games.</p>
        </section>

        <section className="section-card" mix={[css(sectionCardStyles)]}>
          <h2>Repository</h2>
          <p><span className="section-label" mix={[css(sectionLabelStyles)]}>Code license:</span> {repositoryCodeLicense}</p>
          <p>Games should surface their own credits in the deployed UI whenever they use third-party or notable media resources.</p>
        </section>

        {gameAttributions.map((game) => (
          <section id={game.slug} className="section-card attribution-section" mix={[css(sectionCardStyles), css(attributionSectionStyles)]}>
            <div className="section-card-heading" mix={[css(sectionCardHeadingStyles)]}>
              <div>
                <h2>{game.name}</h2>
                <p className="section-muted" mix={[css(sectionMutedStyles)]}><span className="section-label" mix={[css(sectionLabelStyles)]}>Code license:</span> {game.codeLicense}</p>
              </div>
              <a href={withBasePath(`/${game.slug}/`, siteBasePath)}>Open game</a>
            </div>
            <p>{game.summary}</p>
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
        ))}
      </div>
    </Document>
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}