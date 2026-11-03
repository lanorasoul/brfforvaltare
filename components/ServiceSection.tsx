import { FeatureMark, FEATURE_LABEL, PresenceMark, PRESENCE_LABEL } from "./icons";
import { PricingDetail } from "./PricingDetail";
import { ScrollRegion } from "./ScrollRegion";
import { SourceLink } from "./SourceLink";
import { requireSource } from "@/lib/data";
import { CATEGORY, DISCLOSURE_KEYS, FEATURES } from "@/lib/schema";
import type { Category, Provider, ServiceBlock } from "@/lib/types";

/** Länk till sidan där ett tilläggs pris står, när den inte är avtalets huvudsida. */
function ExtraSourceLink({ provider, id }: { provider: Provider; id: string }) {
  const s = requireSource(provider, id);
  return (
    <span className="fine extra-src">
      <SourceLink url={s.url} checked={s.checked} label="Prissida" />
    </span>
  );
}

const SCOPE_TEXT = { national: "Hela landet enligt förvaltaren", regional: "Regionalt", unknown: "Verksamhetsområdet anges inte tydligt" } as const;

/** Allt vi vet om en förvaltares ekonomiska eller tekniska förvaltning, med källa vid varje del. */
export function ServiceSection({ provider: p, category, block: b }: { provider: Provider; category: Category; block: ServiceBlock }) {
  const label = CATEGORY[category].label;
  const mainSrc = requireSource(p, b.source);
  const noticeSrc = b.terms.noticeSource ? requireSource(p, b.terms.noticeSource) : null;
  const covSrc = requireSource(p, b.coverage.source);
  const id = category;

  return (
    <section className="pcat" id={id} aria-labelledby={`${id}-title`}>
      <h2 className="h2 pcat-title" id={`${id}-title`}>
        {label}
      </h2>
      <p className="lead pcat-lead">{b.summary}</p>
      <p className="fine pcat-src">
        <SourceLink url={mainSrc.url} checked={mainSrc.checked} label="Huvudsida" />
        {mainSrc.pageDate ? <>. Sidan anger: {mainSrc.pageDate}.</> : null}
      </p>

      <div className="psub" id={`${id}-pris`}>
        <h3 className="h4 psub-head">Pris</h3>
        <PricingDetail provider={p} pricing={b.pricing} />
      </div>

      <div className="psub" id={`${id}-villkor`}>
        <h3 className="h4 psub-head">Villkor</h3>
        {b.terms.notice ? (
          <>
            <p className="psec-text">
              <strong>Uppsägningstid.</strong> {b.terms.notice}
            </p>
            {noticeSrc && (
              <p className="fine psec-src">
                <SourceLink url={noticeSrc.url} checked={noticeSrc.checked} />
              </p>
            )}
          </>
        ) : (
          <p className="psec-text">
            <strong>Uppsägningstid.</strong> <span className="muted">Ej funnet på sidorna vi läste. Fråga förvaltaren och be om svaret skriftligt.</span>
          </p>
        )}
        {(b.terms.other ?? []).length > 0 && (
          <ul className="bullets psec-sub">
            {(b.terms.other ?? []).map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="psub" id={`${id}-tjanster`}>
        <h3 className="h4 psub-head">Tjänster</h3>
        {b.included.length > 0 ? (
          <>
            <p className="small muted psec-text">Så beskriver {p.name} tjänsten på sin egen sida.</p>
            <ul className="bullets bullets-two psec-sub">
              {b.included.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted psec-text">Förvaltaren listar inte vad tjänsten omfattar på sidorna vi läste.</p>
        )}

        <h4 className="psub-sub">Så läser vi det i jämförelsen</h4>
        <ul className="flist">
          {FEATURES[category].map((f) => {
            const s = b.features[f.key] ?? "none";
            return (
              <li key={f.key} className="flist-item" data-state={s} title={f.help}>
                <FeatureMark state={s} size={20} />
                <span className="flist-label">{f.label}</span>
                <span className="flist-state">{FEATURE_LABEL[s]}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {b.levels.length > 0 && (
        <div className="psub" id={`${id}-nivaer`}>
          <h3 className="h4 psub-head">Paket och nivåer</h3>
          <dl className="levels">
            {b.levels.map((l) => (
              <div key={l.name} className="level">
                <dt className="level-name">{l.name}</dt>
                <dd className="level-text">{l.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="psub" id={`${id}-tillval`}>
        <h3 className="h4 psub-head">Tillval</h3>
        {b.extras.length > 0 ? (
          <ScrollRegion label={`Tilläggstjänster och pris, ${label.toLowerCase()}`} className="dtable-wrap">
            <table className="dtable">
              <caption className="sr-only">Tilläggstjänster och pris, {label.toLowerCase()}</caption>
              <thead>
                <tr>
                  <th scope="col">Tjänst</th>
                  <th scope="col">Pris</th>
                </tr>
              </thead>
              <tbody>
                {b.extras.map((e) => (
                  <tr key={e.label}>
                    <th scope="row">{e.label}</th>
                    <td>
                      {e.price ?? <span className="muted">Pris anges inte</span>}
                      {e.price && e.source && e.source !== b.source && <ExtraSourceLink provider={p} id={e.source} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        ) : (
          <p className="muted psec-text">Förvaltaren listar inga tilläggstjänster på sidorna vi läste.</p>
        )}
      </div>

      {b.digital.length > 0 && (
        <div className="psub" id={`${id}-digitalt`}>
          <h3 className="h4 psub-head">Digitala tjänster</h3>
          <ul className="bullets">
            {b.digital.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {b.reporting.length > 0 && (
        <div className="psub" id={`${id}-felanmalan`}>
          <h3 className="h4 psub-head">Felanmälan och jour</h3>
          <ul className="bullets">
            {b.reporting.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="psub" id={`${id}-verkar`}>
        <h3 className="h4 psub-head">Var förvaltaren verkar</h3>
        <p className="psec-text">
          <strong>{SCOPE_TEXT[b.coverage.scope]}.</strong> {b.coverage.text}
        </p>
        {b.coverage.places.length > 0 && (
          <ul className="chips" aria-label="Orter som sidan nämner">
            {b.coverage.places.map((place) => (
              <li key={place} className="pill">
                {place}
              </li>
            ))}
          </ul>
        )}
        <p className="fine psec-src">
          <SourceLink url={covSrc.url} checked={covSrc.checked} />
        </p>
      </div>

      {b.claims.length > 0 && (
        <div className="psub" id={`${id}-pastaenden`}>
          <h3 className="h4 psub-head">Förvaltarens egna påståenden</h3>
          <p className="small muted psec-text">Det här är vad {p.name} själv skriver. Vi har inte kontrollerat det.</p>
          <ul className="claims">
            {b.claims.map((c) => {
              const s = requireSource(p, c.source);
              return (
                <li key={c.text} className="claim">
                  <p>{c.text}</p>
                  <p className="fine claim-src">
                    <SourceLink url={s.url} checked={s.checked} />
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="psub" id={`${id}-oppenhet`}>
        <h3 className="h4 psub-head">Vad {p.name} berättar öppet om {label.toLowerCase()}</h3>
        <ul className="open-list">
          {DISCLOSURE_KEYS[category].map((k) => {
            const v = b.disclosure[k.key];
            return (
              <li key={k.key} className="open-item" data-presence={v}>
                <PresenceMark presence={v} size={22} />
                <div>
                  <p className="open-line">
                    <strong>{k.label}</strong>
                    <span className="open-state">{PRESENCE_LABEL[v]}</span>
                  </p>
                  <p className="small muted">{k.help}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {(b.notes ?? []).length > 0 && (
        <div className="psub" id={`${id}-anteckningar`}>
          <h3 className="h4 psub-head">Anteckningar</h3>
          <ul className="bullets">
            {(b.notes ?? []).map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Visas när förvaltaren inte har den här delen. Säger vad vi vet och inte mer. */
export function MissingSection({ provider: p, category }: { provider: Provider; category: Category }) {
  const label = CATEGORY[category].label;
  const state = p.services[category];
  const text =
    state === "no"
      ? `${p.name} anger på sin egen sida att de inte erbjuder ${label.toLowerCase()}.`
      : `Vi hittade ingen ${label.toLowerCase()} på de sidor vi läste hos ${p.name}. Det kan betyda att tjänsten saknas eller att den inte beskrivs på webbplatsen.`;
  return (
    <section className="pcat" id={category} aria-labelledby={`${category}-title`}>
      <h2 className="h2 pcat-title" id={`${category}-title`}>
        {label}
      </h2>
      <p className="psec-text muted">{text}</p>
    </section>
  );
}
