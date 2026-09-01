# Changelog

All notable changes to the dados.gov.pt frontend (`dadosgov-fe`).

This project has no version tags, so entries are grouped by month (newest first), each linking the pull request that introduced the change.

## Unreleased

- **fix(i18n): stop double-escaping interpolated translation values**
  - Dates rendered as `Atualizado às 01&#x2F;09&#x2F;2026 10:27:06` on the
    backoffice log page. i18next escapes interpolated values by default and
    React escapes again whatever it renders as a text child, so the value was
    escaped twice and the entities reached the screen. The same page showed the
    tell: `Modificado: 01/09/2026` was correct because it is rendered directly,
    and only the interpolated string was broken.
  - Fixed once in the i18next init instead of per call. Around ten strings
    interpolate a date — common, datasets, profile, organizations, learning,
    admin-logs — and all were wrong; repairing one call site would have left
    the rest, and the next one added would regress. Removing the interpolation
    was not an option either, since word order is per locale (`Atualizado às
    {{time}}` against `Updated at {{time}}`), which is what interpolation is
    for.
  - The setting holds only while no translation output is injected as raw HTML,
    which was audited: the single `dangerouslySetInnerHTML` in the tree is an
    unused pass-through prop. A new test pins the property the change rests on
    — it interpolates an attack payload, renders it, and asserts no element was
    created and the payload survives as text. Nothing covered the real i18next
    configuration until now, since every other test mocks `react-i18next`.

- **feat(migrate-account)!: one answer on the creation step, whatever the address turns out to be**
  - The step routed on the backend's `candidate_found`: a claimable legacy
    address went to the credentials screen, anything else taken raised "already
    registered". Both readings answered, for any address anyone typed, whether
    it has an account at the portal — the enumeration oracle the backend has
    just stopped answering, reintroduced a layer up. `skipMigration` no longer
    reads the field, and every submission lands on the mailbox screen. What
    tells the two cases apart is the mail, which only the address's owner can
    read.
  - The copy of both post-submission screens loses its claim that an account
    was created. "A sua conta já foi criada" is false for someone whose address
    already had one, and the `confirmation-pending` screen is what a reload
    shows next — saying it there would give the answer away in prose after the
    API stopped giving it away in JSON. Both locales; `errorEmailTaken` goes
    with the branch that raised it.
  - The cost is the shortcut this replaces: the owner of a legacy address is
    no longer walked straight to the credentials screen, and reads what to do
    in the mail instead.
  - Deploy this before the backend change. Against the old backend a taken
    address still answers 409, which this client no longer special-cases, so
    the user sees the generic creation error — degraded but correctable. The
    reverse pairing is worse: the old client would promise a confirmation link
    that was never sent.

- **feat(login): make the email tab the account-association entry point**
  - The "E-mail e palavra-passe" tab showed a password form and only revealed
    the migration notice once the backend refused the login. The notice is now
    the tab: the discontinuation warning, "Associar conta à Chave Móvel Digital"
    and "Associar conta à Autenticação Europeia" with their support links, and
    the "Representa uma entidade?" box. `EmailLoginForm` is gone, and with it
    the last password sign-in surface in the frontend.
  - Both buttons start a SAML login, so they carry the same `samlEnabled` gate
    the CMD and eIDAS tabs use — otherwise an environment with SAML off would
    leave the only controls on the tab firing a request that cannot succeed —
    and they render the SAML error themselves, which nothing on this tab did
    except the form that is now gone.
  - The organisation box renders `StatusCard` directly instead of reusing
    `SupportStatusCard`: that component carries page layout of its own and is
    already rendered once below the tabs, so reusing it would stack two boxes
    and nest a 12-column grid inside the tab panel.
- **feat(migrate-account)!: land on the legacy credentials and finish by link**
  - Three screens stood between the CMD/eIDAS return and the credentials the
    user is actually asked for: "is this yours?", an account search, and a
    choice of proof. The credentials screen does not depend on a candidate being
    pointed — the backend links whichever account the password proves, homonyms
    included — so a matched candidate and an ambiguous set of homonyms land on
    the same screen and the user types the address they know. Only `no_match`
    still opens account creation.
  - The password no longer ends the flow: the wizard goes to "Validar email"
    with the resend cooldown already armed, and the success screen and its
    redirect to an authenticated home page are gone along with the session they
    claimed. Every destination that pointed at a removed step is re-pointed, so
    nothing dangles — including the own-email divert, which now lands on the
    credentials screen pre-filled with the address just typed.
  - A correct password can now fail on the send cap or on a lost wizard session.
    Both are distinguished, because falling through to "credenciais inválidas"
    would tell the user their password is wrong when it is not.
  - Every screen names the provider the backend reports, so an eIDAS user stops
    reading "Chave Móvel Digital"; `signInDescription` no longer promises the
    account "será associada", which the click now does. The 25 locale keys
    belonging to the removed screens are deleted rather than left for a
    translator to maintain.
- **feat(migrate-account): offer password recovery inline**
  - "Esqueceu-se da palavra-passe?" navigated to screens that no longer exist.
    Recovery now runs as a step inside the wizard, so the pending migration —
    and the identity just proved at Autenticação.gov — survives it and the user
    can come back and finish. The wizard wraps itself in
    `GoogleReCaptchaProvider`, conditional on the key: without a provider the
    recovery request goes out with a null token and the backend rejects it, so
    the failure is silent rather than loud.
- **test(e2e): authenticate through the login route instead of the form**
  - `performLogin` drove the password form, which is what produced the
    storage-state every backoffice project depends on. It now posts the same
    fields to the same route through `page.request`, which shares the browser
    context's cookie jar and baseURL, so the setup files and the disposable
    project on port 3001 are unchanged.
- **Deploy the backend change first**: the wizard depends on the new
  `{"sent": true}` contract of `POST /saml/migration/confirm` and on the
  provider field in `GET /saml/migration/pending`.

- **feat(migrate-account): validate the legacy account by link instead of a code**
  - The linking branch no longer asks for a 6-digit code. Choosing the email
    method now sends a validation link to the address already on the account
    and shows a waiting screen — "Validar email" — in the same shape as the one
    the account-creation branch ends on, with the same resend-behind-a-cooldown
    control. Following the link is what links the account and signs the user
    in; nothing here is authenticated before that.
  - A failed click comes back as `/migrate-account?flash=...`. A visitor
    arriving that way has no wizard session, and the bootstrap effect answers a
    missing session by pushing to `/login`, which swallowed the message they
    were sent to read: the flash is latched on the first render and the
    bootstrap skipped entirely when it is set. Every case — expired, used,
    superseded — offers re-authentication, there being no session left to
    resend from, and the backend deliberately not reissuing from a link click.
  - The send-limit message is its own rather than the account-creation one:
    that cap lasts the life of the account, this one lifts after an hour, so
    "contact support" would be the wrong advice.
  - `confirmMigration` stays for the password proof, narrowed to that arm;
    `sendMigrationCode` and the code-step strings are gone from both locales.
  - **Depends on the matching backend change, which must be deployed first**:
    this screen calls `POST /saml/migration/send-link`, which does not exist
    until that lands.

- **chore(ci): run the test and typecheck workflows once per push, not twice**
  - Both workflows triggered on `push` **and** `pull_request` with no branch
    filter, so every push to a branch with an open PR started two identical runs
    of each — four jobs, and the tests one runs `npm ci` twice on its own to
    compare test counts against the base branch. The `push` trigger is now
    limited to the environment branches (`develop`, `tst`, `ppr`, `main`), which
    is what `udata-pt` already does, and feature branches stay covered by
    `pull_request`.
  - Added `concurrency` with `cancel-in-progress`, so a second push supersedes
    the run for the first instead of queueing behind it. Nothing about what the
    suites check changes.

- **fix(migrate-account): the wizard follows the answer instead of reporting a rejection**
  - On the account-creation step, typing the address of one's own portal
    account got "an account with this email already exists" — and a message
    telling the user to go back and link it, when the way there is not back
    but a link called "Já tenho conta — procurar", and when the server had
    just resolved that very account. `skipMigration` now recognises the
    backend's `candidate_found` and returns it as an outcome rather than
    throwing, and the creation handler routes to the confirm-account step with
    the masked address, exactly as the search does — including re-reading the
    pending state so the back controls do not loop the user through the search
    a second time.
  - **Nothing is linked by this.** The confirm-account step still asks whether
    the account is theirs, and ownership is still proven afterwards by password
    or by a code mailed to that account. The account-creation branch is
    unchanged for people who really have no account.
  - The remaining rejection now means one thing only — an account holds the
    address and this identity cannot claim it — so `errorEmailTaken` says that,
    instead of pointing at a step that does not exist.
  - **Deploy the backend release first.** The new field rides on the existing
    status code and error key, so an older backend never sends it — but this
    build has also narrowed the already-registered message to "cannot be
    linked, contact support", which is false advice while the backend still
    refuses an address the user could in fact claim.
  - Turning down the offered account no longer loops. "Não é a minha conta"
    returns to the creation step with the address-taken message, and
    submitting that same address again repeats the explanation instead of
    silently offering the same account for ever. A failure to re-read the
    pending state after a divert no longer strands the user either: the
    candidate is pointed server-side regardless, so the wizard goes on.

- **feat(migrate-account): stop asking what the backend already decided, and confirm the email before granting a session**
  - The account-linking wizard opened on a manual choice — "Já possuo uma conta"
    / "Criar nova conta" — repeating a decision the backend had already taken
    when the CMD returned, and one the user is not equipped to make: whether a
    legacy account matches depends on an email and name comparison they never
    see. The wizard now reads that decision and opens on the right step. Three
    outcomes, because the backend distinguishes them: one matching account goes
    straight to linking, nothing matched goes straight to account creation, and
    several homonyms go to the search — that last case still needs a human,
    since nobody can say which account is whose, and falling into account
    creation there would strand people who do have one.
  - Creating an account no longer happens on a click. A new step collects an
    email address, pre-filled with the CMD's own when no account holds it but
    always requiring an explicit submission, and the account is created only
    once that is supplied. Rejections (malformed, already in use) are
    distinguishable and correctable in place — which needed `skipMigration` to
    read the error body, something it alone among its siblings did not do, so
    every failure arrived as one opaque message.
  - The success screen changes nature: it no longer assumes a session and
    redirects, because by design there is not one. It names the address the
    confirmation link went to and offers a resend on a 60s cooldown. Logging in
    with the CMD again before following the link — the obvious thing to try —
    now lands on a screen that explains why access is still blocked, rather
    than a silent bounce to the login.
  - Clicking the confirmation link finally renders something. The backend
    already redirected to the homepage with a `?flash=` marker, but nothing
    displayed it. Three outcomes are shown, not two: an already-used link is a
    success from the user's point of view, and reporting it as invalid sent
    them chasing a problem they did not have.
  - Requires the matching backend release: the wizard now sends an email to
    `POST /saml/migration/skip` and reads two new fields from the pending
    endpoint.

- **feat(admin): widen column sorting across the backoffice tables**
  - Sorting was uneven across the admin lists: the system topics table had none
    at all, the system harvesters view declared it on one column where the org
    view had four, and the organizations, posts and members tables each rendered
    a column that could not be sorted. Those columns are now sortable, in both
    directions, and nothing new was built for it — the existing
    `useAdminListController`, `useClientTableState` and `listHelpers` were
    enough, since a column becomes sortable by declaring `sortField`.
  - The mechanism follows how each screen gets its data, because a client-side
    sort over a server-paginated table orders one page while the arrow claims to
    order the set. Topics, discussions, organizations and users sort through the
    API; harvesters, posts and members sort the whole set they already load.
  - The org discussions view was the worst case: it asked for discussions without
    a page size, received the endpoint's default of 20, and sorted and paginated
    those — so both the list and its total were truncated for any organization
    with more. It now sorts and paginates on the server, which the endpoint
    supports for title, creation and closing date.
  - The system harvesters last-run cell showed only the end timestamp while the
    comparator ordered by start-then-end-then-created. Cell and comparator now
    agree, so the arrow cannot promise an order the rows do not show. Sorting
    posts by state was also silently doing nothing: `published` is a date string,
    so the old numeric comparison produced NaN.
  - Two columns keep no sort control, on purpose. The topics dataset and reuse
    counts are not serialised by the API at all, so they render 0 for every topic
    and an arrow there would order nothing. Sorting organizations by member count
    needs a sort key the API does not offer, and this screen paginates and
    searches server-side, so a client-side sort would order one page. Both need a
    backend change, tracked separately.

- **fix(harvesters): authorize the harvester preview instead of relying on it not being checked**
  - The edit screen previewed through `POST /harvest/source/preview/` without ever
    naming an organization. That endpoint only tests
    `organization.permissions["harvest"]` when the payload names one, so this was
    the one path in the backoffice reaching a branch with no authorization test at
    all — and it worked *because* nothing checked it. It also made the preview
    lie: the harvest backends attribute previewed datasets to the source's
    organization when there is one and fall back to the owner otherwise, with the
    owner filled in from the session, so the preview showed the datasets belonging
    to whoever clicked it rather than to the producer.
  - The payload now names the source's organization, and the screen picks the
    route that can actually authorize the person asking. Previewing an unsaved
    config only makes sense with edit rights, and without them every field in the
    configuration tab is disabled — so the config is the stored one, and
    `GET /harvest/source/<id>/preview/` returns the same preview while authorizing
    per source through `source.permissions["preview"]`. The route is chosen on
    edit rights *and* the source having an organization, because those are the two
    things the config route needs to authorize anyone: an organization's editors
    have neither, and the owner of an owner-only source has edit rights but no
    organization to be authorized against, so both go through the per-source
    route that admits them.
  - The preview button now follows `canPreview`, from the same backend-computed
    `source.permissions` the save and delete buttons already use. It was the only
    action on the form rendered unconditionally, and the harvester detail routes
    sit under no route guard, so any authenticated account saw it.

- **fix(filters): the advanced-filter search boxes now query the API, and a failure says so**
  - Typing in **Palavras-chave**, **Formatos** or **Cobertura Espacial** returned
    "Nenhum resultado encontrado" for every term, because the request was never
    made. The sidebar handed `onSearchChange` the group's *translated label*
    while the datasets filters compared it against internal identifiers —
    `"tags"`, `"format"`, `"geozone"`. Nothing matched, so no suggestion was ever
    fetched. Confirmed in a browser: with the three suggest endpoints
    intercepted, no request was ever observed.
  - Routing now goes by the group's `param` — the query-string name, stable
    across locales and label changes — and every caller of the shared sidebar
    compares params, including the reuses and organizations filters, which
    happened to work by comparing the translated label. Two contracts in one
    shared component is what produced the bug. The search page and the data
    stories declare advanced filters that nothing renders, so they were never
    affected and are left alone.
  - A failure is also no longer painted as "no results". The suggest helpers
    return `null` on failure instead of the `[]` they returned for both cases,
    the sidebar gained an opt-in error state with a retry action, rendered
    alongside the option list so it is still reported when the filter already
    has a selection, and the datasets and reuses filters pass it. The requests
    are debounced by 300 ms and a stale answer is discarded, so a slow failure
    cannot show an error over a query that was answered. The console logging that
    the failures already had is untouched. This is the confusion
    `rethrowControlFlow` describes in its own docstring: "the backend being down
    … renders as an empty result set, indistinguishable from a search that found
    nothing".

- **fix(datasets): stop collapsing multi-value listing filters into one value**
  - Selecting a second option in "Cobertura espacial" or "Granularidade
    espacial" emptied the listing. The datasets page read those two params with
    `String(...)`, so two selected values arrived as the array stringified to
    `"a,b"` — one value matching no zone and no granularity. The backend had
    accepted repeats all along: `?granularity=country` returns 212 datasets,
    `?granularity=other` 1052, and picking both returned 0 instead of the union.
  - The page had grown its own copy of the query parsing next to
    `parseDatasetsFilters`, and only the copy in the page was wrong. It now uses
    the shared helper, which gained a variant for the `Record<string, string |
    string[]>` shape a Server Component receives, and lists every repeatable
    param in one place — so a filter can no longer be multi-value in the URL and
    single-value on the way to the API. Covered by unit tests on the parser.
- **fix(datasets): drop `format_family` values the API would reject**
  - The API declares `format_family` with a closed set of choices and answers 400
    on anything else, and the listing fetch deliberately has no fallback, so
    forwarding an unknown value took the whole `/datasets` page to the error
    boundary — an HTTP 500 from `?format_family=garbage`, from a comma-joined
    `tabular,documents`, or from the pre-rename `structured`. Any mangled or
    hand-edited link could trigger it, while every other listing filter degrades
    to an empty result instead.
  - Values outside the known families are dropped in the parser, so such URLs
    render the unfiltered listing. Only params the API constrains with `choices=`
    are filtered this way: the others accept anything and must stay forwarded,
    since dropping an unknown value there would silently widen the listing
    instead of narrowing it. The family list is now shared between the parser and
    the sidebar, so validation happens against the very list the UI renders.

- **fix(datasets): make the "Outros" format option filter instead of clearing**
  - The "Formato" sidebar group carried its own copy of the backend's format
    lists and expanded a selection into `?format=csv&format=xls&…`. "Outros"
    cannot be written that way — it is the complement of the other groups — so
    the option deleted the param and wrote nothing, behaving exactly like
    "Todos", with no count next to it either.
  - The group now sends `?format_family=` and its options are the backend's
    format families, so the extension lists live in one place instead of two
    copies that a comment asked readers to keep in sync, and each option's count
    comes from the same query the filter applies. Two option ids are renamed to
    their family (`structured` → `machine_readable`, `geographic` →
    `geographical`); the visible labels are unchanged in both locales.
    Selecting a group no longer wipes individual formats chosen in the advanced
    filters — the group owns `format_family`, the advanced filter owns `format`,
    and the backend combines them as an AND.
  - Needs the backend that serves `?format_family=` deployed first: the API
    ignores unknown params, so a frontend arriving alone would leave the group
    returning every dataset.
- **fix(admin): an optional input is no longer marked as required**
  - Agora's inputs declare `required = true` and only drop it when the field is
    `disabled` or `readOnly`, so a caller that simply omits the prop gets the
    opposite of what the code reads like. `IsolatedInput` forwarded that absent
    value straight through, which marked every optional admin field as
    mandatory. On the harvester screen that blocked saving an edit on the default
    license and the geographic zones - two settings the backend never required,
    and which were empty on every harvester configured before they existed.
  - The default is flipped in `IsolatedInput` rather than patched at each call
    site, so the next optional field added anywhere in the admin does not
    inherit the bug. The three fields that really are mandatory - a dataset's
    title, a reuse's name and its URL, all `required` in the API - now say so
    explicitly; a dataset's acronym and the harvester schedule stop claiming it.
  - The harvester edit screen is the one admin form without `noValidate`, which
    is why it was the only place the default actually blocked a submit instead of
    just drawing a marker. Every control on that form now states whether it is
    required, so the filter value - which is not an `IsolatedInput` and could
    block the same way once a filter was added - stops relying on the default too.
  - This is the cause behind the hand-written asterisk removed from the
    harvester description: that label was compensating for the same default.

- **fix(admin-harvesters): the harvester description is no longer marked as required**
  - The edit screen labelled it "Descrição *" while the creation screen labelled
    it "Descrição", nothing in either screen validated it, and the backend calls
    it optional details about the harvester. The asterisk and the translation key
    that carried it are gone, along with the label override prop that existed
    only for them, so both screens agree with each other and with the API.
  - The backend stopped reading that field as a configuration blob: the CKAN PT
    harvester's default license and geographic zones are ordinary harvest
    settings now, so the generic settings section renders them like any other and
    they get Portuguese labels instead of the English ones the API sends.
  - Those settings also show the explanation the API sends with them, which no
    harvester screen rendered before. It matters here because the geographic zones
    are typed as one comma-separated value, and nothing in the form said so.

- **fix(admin-harvesters): keep the GeoDCAT-AP and remote URL prefix settings**
  - The creation wizard collected the GeoDCAT-AP switch and the "Remote URL
    prefix" field and submitted neither. Both are real harvest config, read when
    the harvester runs, so whoever configured them saw them accepted in the form
    and lost without a word — the same silent drop the harvester filters had.
  - Both are now sent inside the single `config` object the API reads. The three
    parts of that object — filters, features and extra configs — are composed in
    one place, because building it once per part would leave only the last and
    drop the others.
  - Which fields appear, and the keys they submit, now come from the backend
    metadata instead of a hand-written list of implementation types. That gives a
    UI to the "Inspire" option of the OpenDataSoft PT backend, which has been
    declared all along and was reachable from no screen.
  - The edit screen gained controls for both, seeded from what is stored. It had
    none at all, so a harvester created with these settings could be seen only
    through the API and changed only through it.
  - Clearing the last setting a harvester has now works. A save that carried no
    configuration at all used to leave the stored one untouched, so blanking the
    remote URL prefix — or removing the last filter — reported success and
    changed nothing.
  - A save keeps the configuration keys no screen shows, instead of replacing the
    whole configuration with what the form knows about.
  - Values are always gated by what the selected implementation declares, on both
    screens, so changing the type no longer leaves the previous type's settings
    behind to be refused by the API.
  - No stored harvester is affected: these settings were never written by the
    interface, and a harvester that has none behaves exactly as before — the
    harvest falls back to each option's declared default.
- **fix(admin-harvesters): keep the filters set when a harvester is created**
  - A "Marcação" filter added in the creation wizard never reached the
    harvester. The select emitted the key `tag` while every backend that
    supports the filter declares `tags`, and the harvest config validation
    rejects any key the selected backend does not declare — the key goes
    straight into the CKAN Solr query, where `tags` is the indexed field.
  - The filter keys and the visibility of the whole filters block now come from
    the same backend metadata the edit screen reads, instead of from literals in
    the wizard. That also stops hiding the block for the OpenDataSoft PT and OGC
    backends, both of which declare filters the API accepts.
  - The creation payload sent the filters at the top level of the request, where
    the API has no such field and dropped them without an error, so a harvester
    created through the wizard was created unfiltered whatever key was used.
    They are now nested under `config`, like the update and preview payloads
    always were.
  - A row whose key was deselected — clicking the already-selected option clears
    the selection — is dropped instead of submitted. Now that the field reaches
    the API, an empty key would answer 400 and block the wizard on the step it
    was previously passing by discarding the filters.
  - The filter labels are translated by key rather than by the label the API
    sends: those labels are marshalled in the deployment's default language, so
    matching on the English ones never worked and the edit screen showed the
    API's own wording instead of the portal's.
  - No stored harvester is affected: the API only ever accepted filter keys the
    backend declares, so the wrong key could not be persisted — on creation it
    was discarded with the rest of the field, and on edit it was filtered out
    before the request and would have been refused anyway.
- **fix(admin-harvesters): list every enabled harvest backend in the creation "Tipo" field**
  - The creation wizard decided the "Tipo" options locally, with ten
    `DropdownOption` literals, while the edit screen listed whatever
    `GET /api/1/harvest/backends/` returned. Five enabled backends
    (`apambiente`, `ine`, `inehvd`, `dgt`, `dgtIne`) were therefore impossible
    to pick when creating a harvester, and the labels of the ones that were
    listed did not match the `display_name` each backend declares.
  - The literal also ignored the deployment's `HARVESTER_BACKENDS`, so it could
    offer a type disabled in that environment whose submission
    `POST /harvest/sources/` then rejects — the `backend` field is an enum over
    the enabled backends. Both screens now read the same endpoint, so a backend
    registered in udata shows up in the wizard without a frontend change.
  - When the endpoint answers with nothing to offer, an explicit warning
    replaces the select instead of leaving a blank required field. Step 1 now
    validates the type as well: an empty one used to pass validation and reach
    the API as `backend: "dcat"`, so a failed catalogue request could silently
    create a DCAT source against a CKAN URL.
  - The select is seeded from the type already chosen, so stepping back from
    the preview no longer shows the placeholder over a type the wizard would
    still submit.
- **fix(harvesters): scope the producer select to what the user may harvest for**
  - The "Produtor" field of the harvester wizard was fed only by the
    memberships in `/api/1/me/`, which have nothing to do with the global
    admin role. A portal admin with no memberships therefore saw an empty
    required select and could not pass step 1, even though the backend lets
    them create a source for any organization (every udata `Permission`
    carries `RoleNeed("admin")`). Admins now get a server-side organization
    typeahead over `/organizations/suggest/` — debounced, seeded with a
    non-empty list, and keeping the chosen organization pinned so a later
    search does not clear the selection.
  - For everyone else the list is filtered by the backend-computed
    `permissions.harvest` flag, the same check `POST /harvest/sources/`
    performs. Organization editors no longer see organizations whose
    submission would fail with a 403; when nothing is eligible an explicit
    warning with a link to create an organization replaces the silently
    empty select.
- **fix(admin-harvesters): search the whole harvester catalogue, not the visible page**
  - The backoffice harvester lists paginated on the server but searched and
    filtered in memory, so both only ever saw the current page: matches on
    later pages stayed invisible unless the page size was raised, and the
    results counter and paginator kept reporting the unfiltered total, which
    announced pages that rendered empty.
  - The sources endpoint cannot search, filter by validation state or sort, and
    the catalogue is small, so the system view now loads it once and does all
    three client-side — the shape the organization view already used. The
    counter and paginator describe the filtered set, so a search with no
    matches shows the empty state instead of an empty table with live
    pagination, and column sorting covers the whole set rather than one page.
  - The organization view's search input had no change handler and the
    controller's query was never read, leaving a field that looked functional
    and did nothing; it now runs the same filter, combined with the status
    filter.

- **feat(auth): complete-registration page for CMD accounts without a usable email**
  - CMD/SAML accounts created without a usable email carry a minted
    `saml-*@autenticacao.gov.pt` placeholder. The backend now redirects such
    logins to the new `/complete-registration` page (Ágora `InputText`,
    `Button`, `StatusCard`), where the user provides a valid email and
    confirms it through the emailed link (existing `/auth/change-email`
    proxy with server-side CSRF minting) to conclude registration.
  - A global `CompleteRegistrationGate` (mounted next to `NewAccountNotice`)
    reads the new `pending_registration` flag from `/me` and keeps
    placeholder accounts on the page while browsing; confirmation-link
    failures (`?flash=change_email_*` on the homepage redirect) are
    forwarded and rendered as translated errors. Old backends without the
    flag simply disable the gate.
  - The migration wizard's "create new account" step now reads
    `pending_registration` from `/saml/migration/skip` and lands on
    `/complete-registration` instead of the homepage when the new account
    got a placeholder email.
- **feat(datasets): serve the resource preview from the self-hosted api-tabular service**
  - The dataset-detail preview now queries the hydra/api-tabular pipeline
    through new server-side proxies (`/internal-api/proxy-tabular-data` and
    `/internal-api/proxy-tabular-profile`, reading `TABULAR_API_URL`), so the
    table is paginated server-side (5 rows per page over the whole file),
    headers sort ascending/descending on the server, and the "Estrutura de
    dados" tab shows the real csv-detective column types instead of
    client-side heuristics — replicating data.gouv.fr's preview behaviour.
  - Resources not yet ingested (no successful `analysis:parsing` extras, or a
    404 from api-tabular) and ods files keep the previous byte-proxy preview
    (`proxy-csv`/`proxy-spreadsheet`), so nothing loses the preview it has
    today; both paths now show 5 rows per page.
  - Both paths also offer the same sortable headers, so the preview behaves
    the same whichever serves it. api-tabular sorts on the server; the byte
    proxy sorts the rows it already holds in memory, over the whole file
    rather than the page on screen, typed by the same heuristics that fill
    the "Estrutura de dados" tab (numbers as numbers, dates as dates).
  - The proxies live under `/internal-api/` because every `/api/*` path is
    shadowed by the rewrite to the Flask backend, and the CSP blocks the
    browser from reaching the internal api-tabular host directly.

- **feat(upload): raise the resource upload guard to 1 GiB**
  - `MAX_UPLOAD_SIZE` goes from 800 MB to 1 GiB, mirroring the backend's new
    `RESOURCES_FILE_MAX_SIZE`. The guard exists to spare the user a doomed
    upload — a file above it is refused before the first part leaves the
    browser — so keeping it below the backend ceiling would hide capacity the
    platform now offers, and keeping it above would trade an instant error for a
    long upload that fails at the combine step.
  - Chunking is unchanged: parts stay at 1 MB (`uiConfig.resourceFileUploadChunk`)
    because the perimeter WAF is what dictates that size, so a 1 GiB file is now
    ~1074 sequential part requests plus the combine. Nothing in the Next.js proxy
    or `client_max_body_size` needs to move — each request is still ~1 MB.
  - XML and SVG keep their own tighter caps (100 MB / 5 MB): they are read fully
    into memory to be sanitized, so they cannot follow the binary ceiling. A
    1 GiB XML is still refused client-side, by design.
  - Community resources keep their own 420 MB form limit; only the dataset
    resource path moves.

- **feat(datasets)!: filter "Elevado Valor" on the HVD badge instead of the raw tag**
  - The option moved from `?tag=hvd` to `?badge=hvd`, so both options in "Tipo de
    dados" now rest on the badge — the curated signal, granted by the backend's
    `update-badges` job — instead of a free-form tag any harvested source can set.
    The sidebar count moved with it, so the number next to the option is the
    number of results it returns.
  - **Expect fewer results than before** (measured in dev: 251 tagged → 144
    badged). The badge job only grants HVD to datasets owned by certified
    public-service organizations, so 107 tagged datasets fall outside it;
    widening that is a policy decision on the badge job, tracked separately.
  - In an environment where `update-badges` has never run, the option shows 0
    and returns 0 — coherent, but empty until the job runs.

- **feat(datasets): add the "Inspire" option to the listing "Tipo de dados" filter** [#536](https://github.com/amagovpt/dadosgov-fe/pull/536)
  - New "Inspire" option below "Conjuntos de dados de Elevado Valor", filtering
    on `?badge=inspire`. The INSPIRE badge is the curated signal: it is granted
    from the `inspire` tag, which the DCAT harvester sets when a dataset carries
    a GEMET INSPIRE theme. The backend serves the matching sidebar count.
  - The group's options now live in a single `ROTULO_FILTER_MAP` carrying the
    query param each one filters on, so the option list, the URL-state detection
    and the param writer can no longer drift apart. Switching option only clears
    the values this group owns, leaving tags and badges picked in the advanced
    filters untouched. "Elevado Valor" keeps filtering on `?tag=hvd`; its badge
    covers only datasets of certified public-service organizations, so moving it
    is handled separately. The group stays single-select, as the other sidebar
    toggle groups do.

- **feat(documentation): link the Swagger UI and the OpenAPI JSON on the API reference page** [#532](https://github.com/amagovpt/dadosgov-fe/pull/532)
  - The reference page embedded the interactive documentation but offered no way
    out of it: the old portal had a link to the Swagger and a download link for
    the spec, both of which had been lost. The "Referência" section now shows
    "Abrir no Swagger UI" (`/api/1/`, the backend's standalone Flask-RestX page,
    opened in a new tab) and "Descarregar especificação (JSON)"
    (`/api/1/swagger.json`, saved as `dados-gov-api-swagger.json`).
  - Both URLs are same-origin — `/api/` is forwarded to the backend by the Next
    proxy — so the `download` attribute is honoured by the browser instead of
    being ignored as a cross-origin navigation.

- **fix(docker): make the `.next/cache` bind mount writable by the app user** [#524](https://github.com/amagovpt/dadosgov-fe/pull/524)
  - Docker auto-creates the `./.next/cache` bind dir as `root:root` 755, but
    the container runs as `nextjs` (uid 10001), so every disk-cache write
    failed with `EACCES` — constant "Failed to update prerender cache" log
    spam and no fetch/ISR or image-optimizer caching at all in PPR. The
    one-shot init container that already fixes `./logs` ownership on each
    `up` (renamed `init-logs` → `init-dirs`) now chowns both bind mounts,
    so no manual `chown` on the host is ever needed.

- **fix(listings): share the SSR listing cache across visitors** [#522](https://github.com/amagovpt/dadosgov-fe/pull/522)
  - The aggregated listing fetches (datasets / organizations / reuses) used
    `next: { revalidate: 60 }` while relaying the visitor's `X-Forwarded-For`,
    but the Next.js Data Cache includes request headers in its cache key — so
    every client IP got its own ~500 KB entry, each visitor's first load
    always hit the backend, and the on-disk fetch-cache grew with
    IP × query combinations. The fetches now go through a shared in-memory
    cache keyed by URL alone (`src/service/utils/listingCache.ts`, 60s TTL
    matching the backend `@cache.cached(60)`, in-flight dedupe, LRU cap).
    The real client IP is still relayed on the single upstream miss, so the
    backend rate limiter keeps per-visitor attribution.

- **fix(publications): cache PDF page counts instead of PDF bytes** [#522](https://github.com/amagovpt/dadosgov-fe/pull/522)
  - The publications page counted each PDF's pages by fetching the asset with
    `cache: "force-cache"`, but Next's Data Cache rejects entries over 2 MB —
    so most PDFs were silently re-downloaded and re-parsed from the CMS on
    every request (the page is `force-dynamic`), and the few under 2 MB were
    cached forever, going stale if the asset changed under the same slug.
    Page counts are now cached in memory (`src/lib/pdfPageCount.ts`, 1h TTL,
    same singleton pattern as the Apollo CMS cache) and the PDF bytes are
    fetched with `cache: "no-store"` only on a cache miss.

- **fix(cms): stop a slow CMS from hanging SSR — timeout + stale-while-revalidate** [#523](https://github.com/amagovpt/dadosgov-fe/pull/523)
  - Root cause of the intermittent multi-second loads/timeouts in PRD
    (measured 2026-07-30: homepage 500s with 6–25s TTFB while the backend
    answered in 60–80ms): every public SSR page depends on Squidex, the
    Apollo cache was fully reset each TTL, and no CMS request had a deadline
    — so an expired cache + slow CMS blocked renders until the F5 time limit.
  - Server-side GraphQL requests now carry a per-request 5s abort signal
    (`CMS_FETCH_TIMEOUT_MS`), and the Apollo client serves
    stale-while-revalidate instead of resetting: past the TTL the last good
    result is returned immediately and refreshed in the background (a failed
    refresh keeps the stale copy). A slow CMS now degrades freshness, never
    latency. The CMS asset proxy (`/assets/*`) also gets a 10s deadline.
  - Hardened the uncaught CMS call sites: the 12 `generateMetadata` functions
    that queried the CMS bare now fall back to the layout's default metadata
    on error, and a new `[locale]/error.tsx` route boundary renders a
    friendly retry page (header/footer intact) instead of the framework 500
    for any remaining uncaught render error — the likely source of the
    intermittent PRD 500s.

- **feat(dataservices): restrict API creation to public-service organizations**
  - The "nova API" producer step no longer offers personal ("Eu próprio")
    publishing and lists only the user's organizations carrying the
    "Serviço público" badge. When the user belongs to no eligible
    organization, the producer section shows a blocking message and the step
    cannot be submitted. A valid organization is preselected so the created
    API is always org-owned. Mirrors the backend enforcement (LEDG-2190),
    which is the source of truth (also covers direct API calls).

- **fix(dataservices): show the real associated-datasets count on the API listing cards**
  - The card read `datasets.length`, but the API serializes a dataservice's
    `datasets` as a paginated subsection reference (`{ rel, href, total, type }`),
    not an array — so the count always rendered `0`. Use `datasets.total` (fixed
    the TS type accordingly) so an API with N associated datasets shows "N
    datasets". Also fixed the same access on the (create publish step) card.
  - Added the intro subtitle on the APIs listing hero: "Explore as APIs
    partilhadas por organizações que prestam serviço público, e integre dados
    abertos, de forma automatizada, nos seus serviços e aplicações."

- **feat(datasets): translate the public datasets area, mirroring the `reuses` i18n pattern**
  - The listing and its filters already used the `datasets` namespace, but the
    whole detail page (`DatasetDetailClient`, `DatasetTabs`, `DatasetInfo`,
    `DatasetResourcesTable/*`) was hardcoded PT, so `/en/datasets/<slug>`
    rendered almost entirely in Portuguese. Those components now follow the
    same shape as reuses: `useTranslation("common")` for shared strings plus
    `useTranslation("datasets")` for feature strings, plurals via `_one`/`_other`,
    and interpolation for counts, dates and aria-labels.
  - Label maps that fed the public UI moved into the namespace: contact-point
    roles, metadata-quality criteria, licenses, resource types and resource
    `extras` keys. Namespaced ids (`pt:distrito`, `check:headers:content-type`)
    are stored with `_` instead of `:`, since i18next reads `:` as its
    namespace separator.
  - `frequencyLabels` / `granularityLabels` gained an optional `t` argument: the
    public page passes it and gets the active locale, while the backoffice call
    sites keep the existing PT map and stay untouched.
  - Consolidated the duplicated `QUALITY_CRITERIA` copies onto the shared
    `utils/datasetQuality` (now keys-only, labels come from i18n), which also
    grew `getQualityDetails` / `getQualityMissing`.
  - Dates and byte sizes on the dataset pages now follow the locale: dropped the
    local `formatDate`/`toLocaleDateString("pt-PT")` copies in favour of the
    shared `formatDateLong(date, i18n.language)`, and `formatBytes` takes the
    locale (`INTL_LOCALES` is now exported from `utils/formatDate`).
  - Fixes on the listing: the sort toggles' `aria-label` interpolated `key` into
    a `{{label}}` placeholder (and the PT string was stored wrapped in
    backticks), and the card's "updated N ago" was always rendered in Portuguese
    and had no `created_at` fallback.
  - The CMS stays the source of truth for hero/search/no-results, with the
    namespace as the fallback (`pageContent?.x ?? tds("x")`), and the listing no
    longer 500s when Squidex is unreachable — both CMS calls fall back instead
    of throwing. Also fixed two bugs there: `generateMetadata` was asking the CMS
    for the **reuses** page, and the search placeholder was cast
    (`search as unknown as string`) from an object, so it rendered
    `[object Object]` instead of `search.placeholder`.
  - `"Ler mais"`/`"Ler menos"` in the shared `DescriptionWithReadMore` and
    `ExpandableMarkdownDescription` now use `common:readMore`/`readLess` (new),
    which also fixes organizations, dataservices and the reuse detail page.

- **feat(breadcrumb): add a dynamic breadcrumb derived from the current route**
  - New `BreadcrumbDynamic` client component + pure `buildBreadcrumbItems` helper
    derive the crumbs from `usePathname()` / `stripLocale` instead of hand-built
    arrays, translating each segment via the `common` namespace with a slug
    "prettify" fallback (`prettifySegment`) and per-segment `overrides` (for
    dynamic id segments such as a dataset id → its title).
  - Reuses the existing `Breadcrumb` primitive (pageless-URL sanitization) and
    widens `HeroGeneral`'s `breadcrumbItems` label to `ReactNode` to match it.
  - Migrated the datasets listing hero to derive its breadcrumb from the route
    instead of a hardcoded `[home, datasets]` array.

- **refactor(i18n): make the `formatDate` date helpers locale-aware**
  - `formatDateToTimeAgo` now selects the date-fns locale from the passed
    `locale` (`pt` → `pt`, `en` → `en-GB`, previously silently `en-US`) and
    strips both the Portuguese and English fuzzy prefixes (`cerca de`,
    `about`, `almost`, …) so the distance reads cleanly in either language.
  - `formatDateLong` gained a `locale` argument mapping to the `pt-PT` /
    `en-GB` Intl locale instead of the hardcoded `pt-PT`, plus an
    invalid-date guard so it falls back to the original string (matching the
    old inline `try/catch` behaviour).
  - `pt` stays the default on both, so existing call sites are unchanged;
    callers opt into `en` by passing the active locale (`i18n.language`).
  - Removed three duplicated inline `formatDate` copies (`DatasetInfo`,
    `ReuseDetailClient`, `PublicProfileClient`) — all now consume the shared
    `formatDateLong(dateStr, i18n.language)`, so the long date follows the
    active locale instead of being hardcoded to Portuguese.
    
- **fix(routing): retire the legacy `/pages` URL segment for good** [#483](https://github.com/amagovpt/dadosgov-fe/pull/483)
  - Public routes moved from `src/app/pages/...` to the `[locale]/(pages)`
    route group a while ago, so URLs no longer carry `/pages` — but old links
    (sent emails, bookmarks, indexed pages) still do. `next.config.ts` now
    issues permanent redirects stripping the prefix, with explicit mappings
    for renamed routes (`/pages/posts/*` → `/noticias/*`, `/pages/support` →
    `/ajuda-e-contactos`, `/pages/resources/publications` →
    `/recursos/publicacoes`), in both bare and locale-prefixed forms.
  - Admin post links now open the real public route (`/noticias/<slug>`
    instead of the nonexistent `/posts/<slug>`).
  - E2E specs updated to the prefix-free URLs (homepage post links assert
    `/noticias/`, the header "Publicações" card asserts the CMS link by path
    instead of a hardcoded environment host).
  - Pairs with the backend change that stops generating `/pages/...` links in
    mails, model `self_web_url` and SAML redirects.

- **fix(harvesters): create the organization harvester detail/config page and gate editing by role**
  - On the org harvesters list, clicking the name or the edit pencil navigated
    to `/admin/org/harvesters/{id}` — a route that never existed (the link was
    also missing the `{orgId}` segment) — returning a 404. Added the route
    `admin/org/[orgId]/harvesters/[slug]` reusing `HarvesterDetailClient`, and
    fixed the list link/breadcrumb to `/admin/org/{orgId}/harvesters/{id}` (the
    edit pencil opens the Configuração tab).
  - The Configuração tab now enforces role-based editing in the organization
    context: an org **editor** (backend `permissions.edit = false`) sees the
    whole form read-only; an org **admin** may edit only Nome, Descrição and
    Filtros, while the advanced fields (URL, Tipo/Implementação, Planeamento,
    switches) stay editable to portal administrators only. Implemented via a
    new `canEditAdvanced` prop on `HarvesterConfigForm` and per-field `disabled`
    wiring (basic vs advanced).

- **feat(dataservices): add a Swagger section to the API detail page**
  - Mirrors data.gouv.fr: when an API exposes a `machine_documentation_url`,
    the detail page now shows a "Swagger" button in the technical box and a
    "Swagger" accordion with the spec version, base URL (copy), endpoints
    grouped by tag, the list of models, and an "Abrir no Swagger UI" link.
  - The spec is fetched server-side through a new SSRF-guarded same-origin
    proxy (`/internal-api/proxy-swagger`) to avoid CORS, then parsed by a
    small OpenAPI 3.x / Swagger 2.0 reader. Non-JSON (e.g. YAML) specs are
    skipped gracefully (the section is hidden).

- **fix(dataservices): revise the API form auxiliary texts on the create flow**
  - The live "nova API" page (`views/ApiRegistrationClient` → shared
    `dataserviceAuxiliaryContent` config) still showed the old pt-BR help
    texts and "O que é uma API?" intro, while the edit page already had the
    revised pt-PT copy. Updated the create-flow intro and all auxiliary items
    to the reviewed wording (LEDG-2022), matching the edit flow.

- **fix(dataservices): fix the admin "Modificado em" column across all three API listings**
  - The column showed `NaN/NaN/NaN` and was inconsistent between the Meu
    perfil / Organização / Sistema listings, and org-owned APIs showed no
    author. Root cause: an earlier fix (LEDG-1935) edited dead root-level
    components, while the live pages render the `views/` variants that share
    `createDataserviceColumns` — which never got the fix. Fixed at the shared
    config: fall back to `metadata_modified_at` when `last_modified` is empty
    (date and sort), attribute to `owner` **or** `organization.name`, and
    unify the label to "por <…>" (removed the per-listing `ownerMetaStyle`).
  - Hardened `formatDateToDMY` to return "—" for empty/invalid dates instead
    of `NaN/NaN/NaN`, so this class of bug can't recur in other listings.
  - Removed the three dead admin root components
    (`DataservicesClient`/`OrgDataservicesClient`/`SystemDataservicesClient`)
    that no page imported.

- **fix(dataservices): stop the native "fill this field" validation on the API edit datasets tab**
  - Editing an API → "Conjuntos de dados associados" tab: clicking Guardar
    fired the browser's "Preencha este campo" bubble on the empty (optional)
    "Link para o conjunto de dados" input, even though the save went through.
    Same bug already fixed on API creation step 2 (#420): the form had no
    `noValidate` and the design-system `InputText` is required by default.
    Mirrored that fix — added `noValidate` to the datasets form,
    `required={false}` on the URL input, and `type="button"` on "Adicionar"
    so it never triggers form submission.

- **fix(upload): send `totalfilesize` and harden chunked-upload retries against silent corruption** [#462](https://github.com/amagovpt/dadosgov-fe/pull/462)
  - Resource files uploaded/replaced via the admin were sometimes corrupted in
    production: behind the F5/WAF a dropped connection triggers the client's
    transparent retry, and the backend reassembled the chunks with no
    integrity verification (see the matching udata-pt fix, which must be
    deployed first).
  - Every part and the combine request now carry `totalfilesize` so the
    backend can verify the reassembled file's size and reject a corrupted
    result instead of storing it.
  - A combine that needed a network retry and then gets a 400 with code
    `upload-not-found`/`combine-in-progress` almost certainly succeeded on the
    first attempt (only the response was lost); the client no longer surfaces
    it as a generic failure — it asks the user to refresh and check before
    retrying, avoiding duplicate resources.
  - Retries now probe that the selected file is still readable; when the file
    was modified on disk mid-upload (Chrome's `ERR_UPLOAD_FILE_CHANGED`, which
    would otherwise be retried blindly or upload mixed old/new bytes), the
    upload aborts with a clear PT message asking to re-select the file.
  - Also fixed a wrong comment claiming chunk parts were already idempotent on
    the backend (they weren't — a retried part used to 500 with `FileExists`).

- **fix(dataservices): remove the "Palavras-chave" (keywords) filter from the API listing**
  - Dataservices have no author-facing way to be tagged (the admin exposes no
    keyword input), and the filter's typeahead pulled suggestions from the
    `Tag` collection, which is populated only from datasets and reuses — never
    from dataservices. So the filter offered irrelevant suggestions and
    returned empty/misleading results. Upstream data.gouv.fr keeps the `tags`
    field (harvested HVD/DCAT) but exposes no keyword filter on its
    `/dataservices/search` either. Dropped the filter and its `tag` param
    wiring; the remaining filters (access type, update date, organization
    type, organizations) now match the upstream set. Backend untouched.

- **refactor(reuses,datasets): fetch the detail pages server-side with the visitor's session**
  - The reuse and dataset detail pages fetched their entity (and, for reuses,
    each associated dataset) in a client `useEffect`, so the content was absent
    from the initial server HTML and flashed a loading state. The `[rid]` /
    `[slug]` Server Components now call `fetchReuse` / `fetchDataset` directly and
    pass the entity down as a prop; the client components keep only the
    interactive islands (favorite toggle, tabs, discussions, pagination).
  - The SSR fetch is authenticated: a new `serverAuthHeaders()` relays the
    request `Cookie` (alongside the existing `X-Forwarded-*` IP headers) to the
    direct backend, so per-user `permissions.edit` and private-draft
    (`Rascunho`) visibility render correctly server-side. A missing entity now
    resolves to a real `notFound()` (404) instead of a client-side message.
  - `fetchDataset` was switched from the always-relative `API_AUTH_URL` to
    `API_BASE_URL` so it is callable from Server Components (client callers are
    unaffected).

- **chore(images): set `minimumCacheTTL` to 30 days to curb `.next/cache` growth** [#447](https://github.com/amagovpt/dadosgov-fe/pull/447)
  - The Next.js image optimizer writes every optimized variant to
    `.next/cache/images` and, with the default short TTL, keeps
    re-generating (and re-writing) the same images once each entry goes
    stale. On the persisted (bind-mounted) cache this bloated the host disk.
    A 30-day `minimumCacheTTL` cuts the re-optimization churn.

- **fix(docker): remove `./:/app` source bind mount that broke the container (502 in DEV)** [#444](https://github.com/amagovpt/dadosgov-fe/pull/444)
  - The image builds Next.js in standalone mode, copying the generated
    `server.js` to `/app/server.js`. Mounting the host `frontend/` folder over
    `/app` shadowed that artifact (the host folder has no `server.js`), so
    `node server.js` failed to start and the reverse proxy returned 502.
    Dropped the source mount and kept only `./logs:/logs` and
    `./.next/cache:/app/.next/cache`, so the image serves its own built `/app`.

- **feat(analytics): add Google Analytics (GA4) tag to the shared layout**
  - Loads `gtag.js` for measurement ID `G-6EQQ3VB8JY` from the root
    `[locale]/layout.tsx` (common to every page) via `next/script`
    (`afterInteractive`). Both the loader and the `gtag('config', ...)` init
    script carry the per-request CSP nonce (`x-nonce` header minted in
    `src/proxy.ts`), so they pass the strict `script-src` without
    `'unsafe-inline'`. The CSP was extended to allow the GA endpoints:
    `www.googletagmanager.com` in `script-src`/`img-src`/`connect-src` and
    `www.google-analytics.com` (+ `*.google-analytics.com`,
    `*.analytics.google.com`) in `img-src`/`connect-src`.

- **perf(harvesters): read job list counts from the lightweight API shape** [#427](https://github.com/amagovpt/dadosgov-fe/pull/427)
  - The harvester detail page showed no jobs for large sources (e.g. INE,
    ~13k items per job): the jobs list endpoint used to inline the full
    `items` array (~8.4 MB / ~29 s), so the fetch timed out. The backend now
    returns per-status `item_counts` and only the failed `error_items`; the
    jobs table consumes those instead of deriving counts from `items`, and the
    error panel reads `error_items`. `HarvestJob.items` is now optional in the
    types (still present on the job detail endpoint). Pairs with the udata-pt
    backend change.

- **fix(resources): resolve CMS base URL from runtime env in the assets proxy**
  - The `/assets/[...path]` proxy route read `NEXT_PUBLIC_API_URL`, which
    webpack inlines at `docker build` time and can't be corrected once the
    image is deployed to a VM with a different CMS URL. It now prefers the
    runtime-only `API_URL_INTERNAL` (same pattern already used by the Apollo
    client), fixing the publications page's missing "N páginas" count and
    any other asset served through that proxy. Also logs proxy/fetch
    failures instead of failing silently.

<!-- Add new entries here before the next promotion. -->

## 2026-07 (julho de 2026)

- **fix: vuln 2092 users access control** (#413)
- **feat: refactor i18n datasets add text to squidex** (#410)
- **refactor: Refactor organization card labels and migrate article features** (#411)
- **fix: organizations datasets adjust cards height to identical values** (#406)
- **fix: adjustments organization details page** (#402)
- **fix: change api link label on create api form** (#403)
- **chore: sync package-lock name with package.json (dados-gov)** (#398)
- **fix(profile): fix off-by-one page navigation on public profile datasets** (#395)
- **fix(harvesters): fix blank page on job detail items pagination** (#394)
- **feat(datasets): file-action loader + upload/edit reliability** (#391)
- **fix(statistics): make 'rows per page' selector work on statistics tables** (#392)
- **fix(ui): open internal TextLink navigation in the same tab** (#390)
- **feat(harvesters): show producer organization on the harvester detail** (#389)
- **feat: i18n admin sidebar** (#387)
- **fix(organizations): show only public datasets on the public org page** (#384)
- **fix(admin): account for i18n locale prefix in client route matching** (#383)
- **fix: Support - add Emblemas component and integrate into FAQ section** (#377)
- **fix: file card updated date matches modified** (#380)
- **fix: api create api update labels** (#371)
- **fix: know more button link on SupportHero** (#375)
- **feat: i18n - datastories - list** (#376)
- **feat: refactor DatasetResourcesTable** (#373)
- **refactor: Reorganize footer pages and improve GraphQL query naming** (#372)

## 2026-06 (junho de 2026)

- **chore: Fix title portal** (#353)
- **feat: refactor members page and components** (#350)
- **refactor(admin): consume backend permissions across the back office** (#346)
- **fix(upload): lower resource upload chunk size from 2MB to 1MB** (#342)
- **feat: datastory dashboard new tab** (#341)
- **chore: updating logo on support mail** (#339)
- **chore: updating icon of reuses on backoffice and frontoffice** (#337)
- **feat(support): refactor support page with FAQ and contact form** (#336)
- **fix: org datasets tab count** (#335)
- **refactor: bo forms** (#324)
- **fix(upload): raise XML sanitization size cap to 100MB** (#331)
- **fix(header): temporarily hide "Publicações" navigation link** (#329)
- **fix(upload): apply 800MB upload cap instead of leaking the 50MB XML cap to all files** (#325)
- **fix(documentation): remove propose-change action section from doc pages** (#323)
- **docs: add develop integration step to promotion flow** (#319)
- **docs: add environment promotion flow to contributor guide** (#317)
- **fix: update subtitles and descriptions for better clarity across multiple components** (#315)
- **chore: new_links_navigation** (#310)
- **refactor: update dataset information message for clarity and formatting** (#309)
- **fix: extra space removed** (#296)
- **fix: Remove actions section from roadmap page** (#295)
- **feat: Add publications resources listing and UI components** (#294)
- **chore(upload): drop proxyClientMaxBodySize override now uploads are chunked** (#303)
- **fix(upload): chunk large resource uploads to pass the perimeter WAF** (#300)
- **chore: adjusting the frontoffice breadcrumbs to the new menu navigation** (#299)
- **fix(upload): large-file uploads through the Next proxy (body limit + connection reset)** (#297)
- **chore: org badges frontoffice** (#293)
- **chore: presenting logs on harversters id remote and internal id** (#292)
- **feat(datasets): pré-visualização tabular CSV/XLS/XLSX (scoped ao catálogo)** (#286)
- **fix: Update Datastory breadcrumbs handling and remove unused code** (#288)
- **feat: Refactor and reorder profile page** (#287)
- **chore: implementing public profile** (#291)
- **chore: adding public profile on organizations** (#290)
- **chore: fixing bug on breadcrumb backoffice** (#289)
- **fix: redirect datasets pages** (#285)
- **feat: Add in-page anchors, layout tweaks, and datasets** (#284)
- **feat: tematic areas page and related components** (#281)
- **chore: adding test search general** (#283)
- **chore: orgsnizacoes_search_1914** (#282)
- **feat(auth): implement new login components for CMD, eIDAS, and email authentication** (#277)
- **fix: datastories hero section add index** (#279)
- **refactor: Refactor bo lists** (#274)
- **feat: hide api temporarily** (#280)
- **fix: Remove duplicate page and update licenses page** (#278)
- **feat(filters): add spatial zone label persistence and localization tests** (#276)
- **fix: default organization dataset table pagination size** (#272)
- **feat: add organization badges to profile** (#271)
- **fix: forward real client IP on the organization-detail SSR fetch** (#270)
- **fix: forward real client IP on SSR reads — listings + org detail re-land** (#269)
- **fix: ISR-cache static reference-data fetches (IP-collapse rate-limit, Tier 3)** (#268)
- **fix: ignore URL echoes while typing to stop dropping characters (follow-up to #266)** (#267)
- **fix: prevent search input from dropping last typed character** (#266)
- **fix: prevent stale card image on listing re-render** (#265)
- **perf: cache SSR listing fetches in the Next.js Data Cache (revalidate 60)** (#264)
- **feat: Adicionar reCAPTCHA v3 ao formulário de Ajuda e Contactos** (#263)
- **refactor: reorganize API structure and update imports across components** (#251)
- **fix: Validate harvester schedule field as a 5-field cron expression** (#262)
- **fix: keep harvester config tab active while editing schedule field** (#261)
- **fix: change-password/email modals broken by missing route + CSRF session overwrite** (#260)
- **feat: Frontend & L12 - Frontoffice - Desenvolvimento do toggle na página Ajuda e Contactos** (#259)
- **fix: send Referer on proxied backend requests to satisfy SSL-strict CSRF** (#258)
- **fix(home): update image source fallback for latest news cards** (#253)
- **perf: short-circuit /me proxy for anonymous requests** (#257)
- **fix: stop forwarding backend's cross-origin redirect on logout** (#256)
- **fix: mint CSRF token server-side on password login to stop CSRF 400** (#255)
- **fix: relay X-Forwarded-For from server-side proxy handlers** (#254)
- **chore: dataset owner public attribution** (#252)
- **fix(services): shorten homepage ISR window from 60s to 10s** (#250)
- **fix: Force dynamic rendering for roadmap page** (#249)
- **fix: Add new type definitions for various services** (#246)
- **feat: Add Google site verification metadata** (#247)
- **chore: recaptcha_recuperar_pass** (#248)
- **feat: Add roadmap page with components, types, and data fetching** (#245)
- **feat: Refactor large components and consolidate API layer** (#244)
- **test: add frequency filter visibility and functionality tests** (#243)
- **test: add partial search functionality for organizations** (#242)
- **refactor(pages): use aggregated /site/*-listing endpoints** (#241)
- **fix: correct spelling of "licenses" in getFaqs calls** (#240)
- **chore: licencas_mostrar_link** (#239)

## 2026-05 (maio de 2026)

- **fix: expose HTTP status / network failure in listing error banner** (#238)
- **chore: correcao_ocultar_items_menu** (#237)
- **chore: licencas_squidex** (#236)
- **chore: distinguish fetch errors from empty results** (#235)
- **refactor: api calls and types** (#234)
- **fix: prevent search input from dropping characters during fast typing** (#233)
- **feat: Add dynamic metadata to FAQ pages** (#232)
- **chore: updating count on datasets backoffice** (#231)
- **feat: Add server-rendered FAQ pages with Markdown support and syntax highlighting** (#230)
- **chore: updating logo on datasets page and home** (#229)
- **chore: updating logo on organizations bug** (#228)
- **chore: fixing logo on datasets** (#227)
- **fix: members list for editors** (#226)
- **fix: editor org permissions** (#225)
- **refactor: Replace contentWrapperClassName with className** (#224)
- **fix: refactor ui create shared components** (#223)
- **refactor: Refactor Harvesters, Posts and enhance dataset components** (#222)
- **chore: Use internal routes instead of dados.gov.pt links** (#219)
- **chore: adding new logo on tabs** (#221)
- **chore: Ticket 56b csp nonce middleware** (#220)
- **chore: fixing modal issues on closing** (#218)
- **fix: Add Conhecimento breadcrumb to Learn pages** (#217)
- **refactor: Refactor admin tables; add harvester utilities** (#216)
- **chore: updating breadcrumb on pages layout** (#215)
- **fix(cards): render and size organization logos on listing + home** (#214)
- **chore: fixing bugs in portal with new logo and texts** (#213)
- **refactor: Add AdminLayout/AdminStepper and refactor admin pages** (#212)
- **fix: refactor admin tables create handler for pagination props** (#211)
- **feat(datasets): add download attribute to resource links** (#210)
- **fix: refactor global create create components for links and icons** (#208)
- **chore: fixing bug website 404** (#209)
- **chore: recuperar passe frontend** (#207)
- **fix: Proxy assets route; update home layout & asset URL** (#206)
- **fix: added anchor to the query of other courses** (#202)
- **fix: datastories update tailwind safelist** (#200)
- **chore: fixing bug recover password error** (#204)
- **chore: bug_1748_reuses** (#205)
- **chore: ajustes_organizacao** (#203)
- **chore: membros_organizacao** (#201)
- **chore: fixing bug support links** (#199)
- **fix: preserve next and email query params on /pages/register redirect** (#198)
- **feat: Add usedDailyBy support & flatten fixes** (#197)
- **chore: Refractor edit dataset page** (#195)
- **chore: fixing reuses and datasets name order card 1695** (#196)
- **chore(proxy): forward /swaggerui/* to the backend** (#194)
- **chore: correcoes_email_recuperar** (#193)
- **fix: refactor format date** (#191)
- **feat: implement password recovery flow with reCAPTCHA integration** (#192)
- **chore: bug_1569_search** (#190)
- **fix: skip url validation when unchanged** (#189)
- **fix: handle nullish organization logo in ReusesEditDatasetsTab** (#188)
- **chore: bug_1754_conhecimento** (#187)
- **fix: popup prop sync** (#186)
- **refactor: improve formatting of description in HeroCourses component** (#184)
- **fix: refactor footer use ads footer v2** (#183)
- **fix: Fix datasets spatial zones** (#179)
- **fix: Fix datastories remove advanced filter and cards size change** (#176)
- **chore: bug_1741** (#185)
- **chore: emails_link** (#182)
- **fix: pr2 url metadata fields** (#181)
- **fix: pr1 load and render remote datasets** (#180)
- **fix: reduce max logo size to 500KB and update UI rendering for avatars** (#178)
- **chore: bug_1740_referencias_ama** (#177)
- **fix(datasets): isolate resource metadata popups per resource** (#175)
- **chore: bug_1742_discussao** (#174)
- **chore: 1672_melhorias** (#173)
- **fix: fixed path to "serviços publicos: canal presencial"** (#172)
- **chore: Refractor edit reuse page with fix** (#168)
- **chore: bug_1670_auxiliar** (#170)
- **chore: fixing bug statistics on backoffice** (#167)
- **revert: PR #159 (refractor/edit-reuse-page) — breaks docker build** (#166)
- **fix(me/route): forward real backend status + Set-Cookie** (#164)
- **fix: update breadcrumb label for pressure tourism datastory page** (#163)
- **fix: correct breadcrumb label for "Serviços públicos: canal presencial"** (#160)
- **chore: Refractor edit reuse page** (#159)
- **fix: admin notifications page** (#162)
- **fix: admin harvester schedule cursor jump** (#161)
- **chore: bug_1733** (#158)
- **fix: admin harvester schedule controlled** (#157)
- **fix: update breadcrumb label for data story and add SVG icons for life expectancy** (#155)
- **chore: reuses name order bug fix** (#156)
- **fix(auth): proxy /confirm, /reset and /confirm-change-email to backend** (#154)
- **chore: bug_1730_email** (#153)
- **fix: PDT 8213 datastories densidade vs consumo multiple fixes** (#152)
- **chore: bug_1731** (#151)
- **fix: Update card classes for monospace font and layout consistency** (#150)
- **fix: rehype sanitize articles** (#149)
- **chore: bug_1670_auxiliar** (#148)
- **fix: adjust title styling for steps in CourseStepClient component** (#147)
- **fix: fix multiple typograph files** (#146)
- **chore: fixing bug card 1724** (#145)
- **fix: refactor footer pages optimize code** (#144)
- **test(e2e): regression suite for KITS24 legacy VULNs (1594, 1596, 1497, 1515/1595)** (#143)
- **fix(xss): sanitize user-controlled markdown across detail pages ( /)** (#141)
- **fix: Refactor MiniCourses page with sorting and pagination support** (#142)
- **test(e2e): add frontend-vulnerabilities Playwright project** (#140)
- **fix: Add Breadcrumb navigation to mini-course introduction page** (#137)
- **fix: Standardize search UI layout and spacing** (#136)
- **fix: vitest vulns** (#139)
- **chore: fixing bug title** (#138)
- **fix: datasets and reuses search** (#135)
- **chore: fixing bug paragraph on articles** (#133)
- **chore: Refractor: frontoffice xxxclient states** (#129)
- **chore: fixing url bug reuses** (#132)
- **fix: correct triggerHarvest endpoint path from /sources/ to /source/** (#131)
- **feat: harvester validation ui** (#128)
- **fix: ticket 60 vuln 2079 ssrf hardening** (#130)
- **refactor: improve css to better responsive design** (#127)
- **fix: refactor project fix classnames to tailwind v3** (#126)
- **fix: sanitize HTML output and harden CSP (TICKET-56/57 / VULN-2075/2076)** (#125)
- **refactor: improve styling and structure of GitHubArticlePage component** (#124)
- **fix: fix default sort on reuses page** (#122)
- **refactor: optimize spacing and improve consistency in OrganizationDetailClient and OrganizationTabs components** (#121)
- **fix: surface client-side security rejections in all upload UIs** (#123)
- **Refactor: frontoffice filters componentization** (#119)
- **refactor: drag and drop uploader primitive** (#120)
- **feat: client-side upload security layer (Stored XSS prevention)** (#117)
- **refactor: wrap DragAndDropUploader as local primitive** (#115)
- **chore: putting back the ecossystem menu** (#118)
- **chore: fixing bug create dataset and adding tests** (#116)
- **feat: Rename courses to learn and update routes** (#114)
- **refactor: clean up code and improve layout in ReuseDetailClient and ReusesClient components** (#113)
- **feat: Refactor header navigation and add active icons** (#112)
- **chore: correcoes_1685** (#111)
- **chore: bug_1685** (#110)
- **refactor: Refactor PageBanner to HeroGeneral and update related components** (#109)
- **fix: restyle admin system logs page using existing admin components** (#108)
- **fix: add utility functions for quality score calculation, date formatting, and number formatting** (#105)
- **chore: fixing bug deleting organizations** (#107)
- **feat: admin system logs viewer** (#106)
- **chore: datasets_data** (#104)
- **fix: home datasets organizations component and refactor cards with metrics** (#99)
- **chore: reutilizacoes_auxiliar** (#103)
- **chore: correcoes_1670_bugs** (#102)
- **chore: Fix transfer popup api wiring** (#101)
- **chore: bug_1670** (#100)
- **fix: Refactor datastory handling to use new home query and update types** (#96)
- **fix: Only render course lists; switch to ButtonNavigate** (#95)
- **chore: adding order to datasets key words** (#98)
- **style: add bottom margin to dataset title in detail view** (#97)
- **fix: Data stories - hero section** (#94)
- **fix: fix reuses search and add tags+seeMore component** (#93)
- **fix: Add datastories layout** (#92)
- **fix: Force dynamic rendering for datastories pages** (#91)
- **fix: Force dynamic rendering for multiple app pages** (#90)
- **chore: Fix7/datastories/add breadcrumbs to hero section** (#89)
- **fix: Remove debug log, delete page, fix imports** (#88)
- **fix: datastories list and details use squidex be** (#84)
- **feat: Refactor courses and mini-courses structure with new listing page** (#87)
- **style: hide description in header card wrapper on mobile devices** (#86)
- **chore: fix admin posts draft visibility** (#85)
- **chore: bug_1671** (#83)
- **chore: bug_1664_score** (#82)
- **fix: fix change footer from 2022 to 2026** (#81)
- **fix: change layout palavras-chave in information tab** (#80)
- **fix: Refactor components and improve configuration for better semantics** (#79)
- **chore: bug_1654** (#78)

## 2026-04 (abril de 2026)

- **fix: date format on home page** (#76)
- **fix: change string on statistics** (#75)
- **chore: bug_1668** (#77)
- **fix(support): actually submit the support form to the backend** (#74)
- **fix: backoffice keywords search** (#73)
- **fix: update dataset titles and descriptions** (#72)
- **chore: E2e new tests** (#71)
- **fix: Refactor DataSourcesSection component in datastories** (#68)
- **fix: pages admin system posts new fix input select** (#59)
- **chore: correcoes_upload** (#70)
- **chore: fixing fields of creation and editing datasets** (#69)
- **chore: recursos_drop** (#67)
- **fix: admin tables broken sort buttons** (#66)
- **chore: bug_1537_alteracoes** (#65)
- **feat: update harvester menu item to use a custom SVG icon** (#64)
- **chore: correction_item_discussion** (#63)
- **chore: ajustes_gerais_portal** (#62)
- **fix: bug fix after downgrade tw** (#60)
- **fix: IsolatedSelect propagates children changes when searchable** (#61)
- **chore: downgrading tailwind v4 to v3** (#56)
- **fix: persist organization favorite via follow API** (#58)
- **chore: Estatistics update backoffice** (#57)
- **fix(members): search users live when adding to organization** (#55)
- **feat: spatial coverage name code** (#54)
- **fix: status filters all admin pages** (#53)
- **chore: adding update of label on reuses** (#52)
- **chore: update pagination component** (#51)
- **chore: fixing bug card 1632** (#50)
- **fix: patch SSRF in /internal-api/proxy-csv (VULN-2079)** (#49)
- **chore: Updates to reutilization backoffice** (#48)
- **fix: keywords pattern across forms** (#47)
- **fix: fix upload component label and resource duplication bugs** (#46)
- **chore: Integrate Apollo client and add flatten util** (#38)
- **fix: Fix pagination and tweak UI text** (#41)
- **fix: change icon on hover button login page** (#42)
- **fix: reuse edit form issues** (#45)
- **chore: fixing bug card 1545** (#44)
- **chore: fixing bug card 1559** (#43)
- **refactor: remove unnecessary whitespace from HomeClient component props** (#40)
- **chore: implementing modal behavior to close after removing the articles** (#39)
- **chore: fixing bug card 1622** (#37)
- **fix: admin members wrong org** (#36)
- **fix: org statistics metrics fields** (#35)
- **fix: reuses step2 3 bugs** (#34)
- **fix(admin): bind org statistics cards to correct metrics fields** (#33)
- **fix: align dataset create keywords UX with reuses form** (#32)
- **chore: fixing bug fe & be card 1521** (#31)
- **fix: reuses create form bugs** (#30)
- **feat(admin): replace ButtonUploader with DragAndDropUploader across admin forms** (#29)
- **chore: fixing bug card 1456** (#28)
- **fix(admin/datasets): step 2 wording, contact validation, and description limit** (#27)
- **feat: Fix filename case issue** (#26)
- **feat: reuses producer datasets filter** (#25)
- **feat(reuses): filter datasets in reuse form by selected producer** (#24)
- **fix: Fix displayed domain to dados.gov.pt** (#23)
- **fix: make embedded Swagger UI use same-origin requests** (#22)
- **chore: update layout authentication to ecosystem arte** (#21)
- **fix: profile api key generation** (#20)
- **chore: datasets_upload_admin** (#19)
- **fix: data stories page search and filter fix** (#18)
- **chore: implementing updates to organizations card 1554** (#15)
- **feat: add ecosystem icons and update header styling** (#16)
- **fix: show error message when logo upload exceeds 4 MB** (#14)
- **fix: proxy /s/* requests to backend for flask_storage file serving** (#13)
- **feat: Add density-vs-consumo DataStory and UI tweaks** (#11)
- **feat: multi-select filters + organizations list filter** (#12)
- **fix: allow preprod and internal hosts in CSP** (#10)
- **fix: text updated** (#7)
- **fix: text updated** (#6)
- **fix: scroll to top when opening login help modals** (#9)
- **chore: Datastories home 3** (#8)
- **feat: dataset admin spatial granularity contact points** (#5)
- **chore: deleting button** (#4)
- **fix: - back office conjuntos de dados - feedback button** (#3)
- **fix: text updated** (#2)
- **fix: text updated and input select fixed** (#1)
- **chore: frontoffice filters review** (#374)
- **feat: implement form validation and success feedback in SupportPage** (#370)
- **fix: - fix text** (#365)
- **fix: - fix typo-2** (#364)
- **chore: Novas alteracoes bugs** (#369)
- **chore: 1594_others** (#368)
- **chore: bug_1594** (#366)
- **fix: updated required fields** (#363)
- **feat: Add life-expectancy datastory and UI fixes** (#362)
- **fix: - fix show invalid url error** (#360)
- **feat: display contact points and readable license title on dataset detail page** (#358)
- **chore: bug_1551** (#361)
- **chore: bug_1538** (#359)
- **fix: publicacao de conjunto de dados fix text and save data** (#357)
- **fix: text updated** (#354)
- **chore: ocultar_data_story_3** (#356)
- **fix: use datasets_count field for harvesters dataset count display** (#355)
- **feat: adding page data story public services presential channel** (#352)
- **fix: update scroll behavior to instant when navigating between routes** (#351)
- **chore: update dataset labels and search placeholder to plural form** (#349)
- **fix: make cover image optional in reuse creation form** (#348)
- **chore: bug_1595** (#347)
- **fix: scroll fixed** (#345)
- **fix: - change text** (#343)
- **feat: add new logos and update login component with styles** (#344)
- **fix: - fix typo** (#340)
- **fix: text updated** (#338)
- **fix: commented field** (#330)
- **fix: - ajustes listagem datastories** (#327)
- **fix: space removed** (#334)
- **fix: fix/** (#326)
- **fix:- text fixed** (#322)
- **fix: - text fixed** (#321)
- **chore: bug_1524_recursos** (#333)
- **chore: bug_1555** (#332)
- **fix: remove description hard limit and send tags on reuse creation** (#328)
- **fix: - text fixed** (#320)
- **feat: add followers and profile columns with filter to admin users list** (#318)
- **fix: markdown converted to html elements** (#316)
- **fix: - text fixed** (#314)
- **fix: texts fixed** (#313)
- **fix: redirect to login when unauthenticated user clicks dataset favorite button** (#312)
- **chore: bug_1524** (#311)
- **fix: text fixed** (#307)
- **chore: bug_1521** (#308)
- **chore: bug_1520** (#306)
- **chore: alteracoes_ux_geral** (#305)
- **chore: membros_ajustes** (#304)
- **chore: ordenacao_tabelas** (#302)
- **chore: bug_1504** (#301)
- **chore: fix_sorting** (#298)

## 2026-03 (março de 2026)

- **fix: resolve relative docapi links to absolute URL in GitHubArticlePage** (#275)
- **chore: ajustes_antonio** (#273)
- **feat: implementation page data story smart territories** (#169)
- **chore: ajustes_datasets_admin** (#171)
- **chore: reusesdetail** (#165)
- **chore: alyeracoes_ux_2** (#134)

## 2026-02 (fevereiro de 2026)

- **chore: Homepage comunidade** (#17)
