import { renderToString } from 'remix/component/server'
import { attributionsPagePath, gameAttributions, repositoryCodeLicense } from '../data/attributions.js'
import { Document } from '../ui/document.js'
import { getSiteBasePath } from '../site-config.js'
import { withBasePath } from '../site-paths.js'

export async function attributionsAction() {
  const siteBasePath = getSiteBasePath()

  const html = await renderToString(
    <Document
      title="Attributions"
      description="Licensing and credits for Peninsular Reveries and its games."
      path={attributionsPagePath}
    >
      <div className="page-stack">
        <section className="page-hero">
          <h1>Attributions</h1>
          <p>One place for licensing and credits across the site and its games.</p>
        </section>

        <section className="section-card">
          <h2>Repository</h2>
          <p><span className="section-label">Code license:</span> {repositoryCodeLicense}</p>
          <p>Games should surface their own credits in the deployed UI whenever they use third-party or notable media resources.</p>
        </section>

        {gameAttributions.map((game) => (
          <section className="section-card attribution-section">
            <div className="section-card-heading">
              <div>
                <h2>{game.name}</h2>
                <p className="section-muted"><span className="section-label">Code license:</span> {game.codeLicense}</p>
              </div>
              <a href={withBasePath(`/${game.slug}/`, siteBasePath)}>Open game</a>
            </div>
            <p>{game.summary}</p>
            <div className="attribution-list">
              {game.entries.map((entry) => (
                <article className="attribution-item" aria-label={`${entry.title} attribution`}>
                  <h3>{entry.title}</h3>
                  <p className="section-muted">{entry.type} · {entry.creator}</p>
                  <p><span className="section-label">Used in:</span> {entry.usedIn}</p>
                  <p>
                    <span className="section-label">Source:</span>{' '}
                    {entry.sourceUrl
                      ? <a href={entry.sourceUrl} target="_blank" rel="noopener">{entry.source}</a>
                      : entry.source}
                  </p>
                  <p>
                    <span className="section-label">License:</span>{' '}
                    {entry.licenseUrl
                      ? <a href={entry.licenseUrl} target="_blank" rel="noopener">{entry.license}</a>
                      : entry.license}
                  </p>
                  <p><span className="section-label">Modifications:</span> {entry.modifications}</p>
                  {entry.notes ? <p><span className="section-label">Notes:</span> {entry.notes}</p> : null}
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