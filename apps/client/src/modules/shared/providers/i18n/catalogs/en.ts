/**
 * Canonical key set + English copy. `en` is the source of truth: its keys
 * define `TKey`, and `uk.ts` is typed against it so missing/extra keys are a
 * compile error. Strings here are verbatim the pre-i18n literals so existing
 * tests (which assert English text under the default `en` locale) stay green.
 *
 * Plural concepts carry `.one/.few/.many/.other` + a base key. English only
 * ever selects `one`/`other` via Intl.PluralRules; the `few`/`many` entries
 * exist for key parity with `uk` and are unused at runtime for `en`.
 */
export const en = {
  // common / shared
  'common.lost': 'Lost',
  'common.found': 'Found',
  'common.dash': '—',
  'common.phone': 'Phone: {value}',
  'common.email': 'Email: {value}',
  'species.dog': 'Dog',
  'species.cat': 'Cat',
  'species.bird': 'Bird',
  'species.other': 'Other',
  'status.lost': 'Lost',
  'status.found': 'Found',
  'status.active': 'Active',
  'status.proposed': 'Proposed',
  'status.confirmed': 'Confirmed',
  'status.rejected': 'Rejected',
  'status.reunited': 'Reunited',
  'status.resolved': 'Resolved',
  'status.closed': 'Closed',

  // app shell / nav
  'nav.brand': 'PetFinder',
  'nav.primaryAria': 'Primary',
  'nav.browse': 'Browse',
  'nav.reportPet': 'Report a pet',
  'nav.myReports': 'My reports',
  'nav.logout': 'Log out',
  'nav.login': 'Log in',

  // locale switcher
  'locale.aria': 'Language',
  'locale.uk': 'УКР',
  'locale.en': 'ENG',

  // landing
  'landing.kicker': 'PetFinder',
  'landing.title': "Lost a pet? Found one? Let's get them home.",
  'landing.lede':
    'Publish a report in under a minute. We watch for matches nearby and only reveal contact details once both sides confirm.',
  'landing.lostCtaTitle': 'I lost a pet',
  'landing.lostCtaSub': 'File a Lost Report and start watching for matches',
  'landing.foundCtaTitle': 'I found a pet',
  'landing.foundCtaSub': 'File a Found Report so the owner can find you',
  'landing.feedHead': 'Active near you',
  'landing.browseAll': 'Browse all reports →',
  'landing.loading': 'Loading reports…',
  'landing.error': "We couldn't load reports right now ({kind}).",
  'landing.emptyTitle': 'No active reports yet',
  'landing.emptyMessage':
    "Be the first — file a report and we'll watch for matches as new ones come in.",
  'landing.emptyCta': 'Report a pet',

  // browse
  'browse.title': 'Browse reports',
  'browse.kind': 'Kind',
  'browse.species': 'Species',
  'browse.all': 'All',
  'browse.loading': 'Loading reports…',
  'browse.empty':
    "No reports match these filters yet — file one and we'll watch for matches.",
  'browse.error': 'Could not load reports ({kind}).',
  'browse.paginationAria': 'Pagination',
  'browse.previous': 'Previous',
  'browse.page': 'Page {page}',
  'browse.next': 'Next',
  'browse.badge': '{kind} · {status}',

  // report detail
  'detail.loading': 'Loading report…',
  'detail.error': 'Could not load this report ({kind}).',
  'detail.species': 'Species',
  'detail.breed': 'Breed',
  'detail.color': 'Color',
  'detail.description': 'Description',
  'detail.lastSeen': 'Last seen / found',
  'detail.coords': '{lat}, {lng} on {date}',
  'detail.contactAria': 'Contact details',
  'detail.yourContact': 'Your contact details',
  'detail.viewCandidates': 'View candidates',
  'detail.privacy': 'Contact details are hidden until a match is confirmed.',

  // candidates
  'candidates.back': '← Back to the report',
  'candidates.title': 'Possible matches',
  'candidates.loading': 'Looking for possible matches…',
  'candidates.empty':
    "No possible matches yet — we'll keep checking as new reports come in.",
  'candidates.error': 'Could not load candidates ({kind}).',
  'candidates.sameSpecies': 'Same species ({species})',
  'candidates.differentSpecies': 'Different species ({species})',
  'candidates.underOneKm': 'Under 1 km away',
  'candidates.kmAway': '{km} km away',
  'candidates.sameDay': 'Same day',
  'candidates.daysApart': '{days} days apart',
  'candidates.daysApart.one': '{days} day apart',
  'candidates.daysApart.few': '{days} days apart',
  'candidates.daysApart.many': '{days} days apart',
  'candidates.daysApart.other': '{days} days apart',

  // create report
  'create.titleLost': 'Report a lost pet',
  'create.titleFound': 'Report a found pet',
  'create.section1': '1 — Kind & core facts',
  'create.kind': 'Kind',
  'create.species': 'Species',
  'create.name': 'Name',
  'create.breed': 'Breed',
  'create.color': 'Color',
  'create.description': 'Description',
  'create.section2': '2 — Location & date',
  'create.latitude': 'Latitude',
  'create.longitude': 'Longitude',
  'create.date': 'Date last seen / found',
  'create.section3': '3 — Photo (optional)',
  'create.photoHint':
    'A clear photo helps people recognise the pet. You can skip this and add one later.',
  'create.photo': 'Photo',
  'create.selected': 'Selected: {name}',
  'create.remove': 'Remove',
  'create.noPhoto': 'No photo selected — you can add one later.',
  'create.section4': '4 — Contact',
  'create.contactPhone': 'Contact phone',
  'create.contactEmail': 'Contact email',
  'create.publishing': 'Publishing…',
  'create.publish': 'Publish report',
  'create.err.dateRequired': 'Date is required',
  'create.err.email': 'Enter a valid email',
  'create.err.contactRequired':
    'Provide a phone or an email so you can be reached',
  'create.err.publishFailed': 'Could not publish the report. Try again.',

  // my reports
  'myReports.title': 'My reports',
  'myReports.loading': 'Loading your reports…',
  'myReports.emptyText': "You haven't published any reports yet.",
  'myReports.emptyLostLink': 'Report a lost pet',
  'myReports.emptyOr': ' or ',
  'myReports.emptyFoundLink': 'a found one',
  'myReports.emptyPeriod': '.',
  'myReports.error': 'Could not load your reports ({kind}).',
  'myReports.group.active': 'Active',
  'myReports.group.recovered': 'Reunited / Resolved',
  'myReports.group.closed': 'Closed',
  'myReports.groupEmpty': 'None.',
  'rowAction.close': 'Close',
  'rowAction.markReunited': 'Mark reunited',
  'rowAction.markResolved': 'Mark resolved',
  'row.candidate': '{count} candidates',
  'row.candidate.one': '{count} candidate',
  'row.candidate.few': '{count} candidates',
  'row.candidate.many': '{count} candidates',
  'row.candidate.other': '{count} candidates',
  'rowError.generic': 'Something went wrong. Please try again.',
  'rowError.invalidTransition':
    'This change is not allowed yet — marking reunited needs a confirmed match.',
  'rowError.forbidden': 'Only the reporter can change this report.',

  // my matches
  'myMatches.title': 'My matches',
  'myMatches.openFromReport': 'Open this from a report to see its matches.',
  'myMatches.loading': 'Loading matches…',
  'myMatches.empty': 'No matches for this report yet.',
  'myMatches.error': 'Could not load matches ({kind}).',
  'myMatches.awaitingYou': 'Awaiting your decision',
  'myMatches.awaitingOther': 'Awaiting the other party',
  'matchList.empty': 'Nothing here.',
  'matchList.row': 'Lost {lost} ↔ Found {found} — {status}',

  // match detail
  'matchDetail.title': 'Match',
  'matchDetail.loading': 'Loading match…',
  'matchDetail.error': 'Could not load this match ({kind}).',
  'matchDetail.statusLabel': 'Status:',
  'matchDetail.confirm': 'Confirm match',
  'matchDetail.reject': 'Reject match',
  'matchDetail.rejected': 'This match was rejected.',
  'reveal.aria': 'Revealed contact details',
  'reveal.title': 'Contact details revealed',
  'reveal.explain':
    'These details are shown because this match is confirmed. They stay hidden everywhere else.',
  'reveal.lostReport': 'Lost report',
  'reveal.foundReport': 'Found report',

  // propose match button
  'propose.proposedPrefix': 'Match proposed — ',
  'propose.viewIt': 'view it',
  'propose.submitting': 'Proposing…',
  'propose.label': 'Propose a match',
  'propose.error': 'Could not propose this match ({kind}).',

  // auth: login
  'login.title': 'Log in',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submitting': 'Logging in…',
  'login.submit': 'Log in',
  'login.noAccount': 'No account?',
  'login.register': 'Register',
  'login.err.invalid': 'Invalid email or password.',

  // auth: register
  'register.title': 'Register',
  'register.email': 'Email',
  'register.password': 'Password',
  'register.submitting': 'Creating account…',
  'register.submit': 'Create account',
  'register.haveAccount': 'Already have an account?',
  'register.login': 'Log in',
  'register.err.emailTaken': 'That email is already registered.',
  'register.err.generic':
    'Could not create the account. Check the form and try again.',

  // auth: account
  'account.title': 'Account',
  'account.signedInAs': 'Signed in as',
  'account.myReports': 'My reports',
  'account.browseReports': 'Browse reports',
  'account.logout': 'Log out',
  'account.unknown': 'unknown',

  // connectivity: not found
  'notFound.code': '404',
  'notFound.title': 'This page wandered off',
  'notFound.message':
    "The page you're looking for doesn't exist or has moved. Let's get you back on track.",
  'notFound.home': 'Back to home',

  // connectivity: health
  'health.title': 'PetFinder',
  'health.loading': 'Checking connection…',
  'health.ok': 'API reachable — status ok',
  'health.error': 'API unreachable ({kind})',
  'health.toggleAria': 'Toggle theme',
  'health.theme': 'Theme: {theme}',

  // shared leaf components
  'spinner.default': 'Loading…',
  'errorState.defaultTitle': 'Something went wrong',
  'errorState.retry': 'Try again',
  'reportPhoto.noPhoto': 'No photo yet',
  'reportPhoto.placeholderAria': '{alt} — no photo yet',
  'theme.toLight': 'Switch to light theme',
  'theme.toDark': 'Switch to dark theme',
} as const satisfies Record<string, string>;
