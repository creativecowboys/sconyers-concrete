import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  PLAN_MAX_BYTES,
  PLAN_MAX_FILES,
  checkPlanFile,
  cleanFileName,
  downloadFileName,
  formatBytes,
  isPlanPathname,
  parseAttachments,
  parseFailedCount,
  pathnameFromLinkSegments,
  planClientPayloadOk,
  planContentTypeForPathname,
  planExtension,
  planLinkPath,
  planPathname,
} from '../lib/plans.ts'
import { signPlanPath, verifyPlanSig } from '../lib/plans-link.ts'

const MB = 1024 * 1024

test('checkPlanFile: PDFs, photos and ZIPs are accepted, typed by extension', () => {
  assert.deepEqual(checkPlanFile({ name: 'S-101 Foundation.PDF', size: 2 * MB, type: 'application/pdf' }), {
    ok: true,
    ext: 'pdf',
    contentType: 'application/pdf',
  })
  for (const [name, type] of [
    ['IMG_0042.JPG', 'image/jpeg'],
    ['site.jpeg', 'image/jpeg'],
    ['scan.png', 'image/png'],
    ['IMG_0043.HEIC', 'image/heic'],
    ['photo.heif', 'image/heif'],
    ['plan.webp', 'image/webp'],
    ['sheet.tif', 'image/tiff'],
    ['sheet.tiff', 'image/tiff'],
    ['plan-set.zip', 'application/zip'],
  ]) {
    const check = checkPlanFile({ name, size: MB, type: '' })
    assert.equal(check.ok, true, name)
    assert.equal(check.ok && check.contentType, type, name)
  }
  // Windows reports a zip as x-zip-compressed; it is still uploaded as application/zip.
  const zip = checkPlanFile({ name: 'plans.zip', size: MB, type: 'application/x-zip-compressed' })
  assert.equal(zip.ok && zip.contentType, 'application/zip')
})

test('checkPlanFile: wrong types are refused, whatever the browser claims', () => {
  for (const [name, type] of [
    ['drawing.dwg', 'application/acad'],
    ['logo.svg', 'image/svg+xml'],
    ['page.html', 'text/html'],
    ['notes.txt', 'text/plain'],
    ['setup.exe', 'application/pdf'], // a lying type does not rescue a bad extension
    ['animation.gif', 'image/gif'],
    ['no-extension', 'application/octet-stream'],
    ['no-extension', ''],
  ]) {
    const check = checkPlanFile({ name, size: MB, type })
    assert.equal(check.ok, false, name)
    assert.equal(!check.ok && check.reason, 'type', name)
    assert.match(!check.ok ? check.message : '', /can’t be attached/, name)
  }
  // No extension but a type we know (a pasted or renamed file): typed by the browser's type.
  assert.equal(planExtension('scan', 'application/pdf'), 'pdf')
  assert.equal(planExtension('photo', 'image/jpg'), 'jpg')
})

test('checkPlanFile: size limit is 50 MB per file, and empty files are refused', () => {
  assert.equal(checkPlanFile({ name: 'a.pdf', size: PLAN_MAX_BYTES, type: '' }).ok, true)
  const big = checkPlanFile({ name: 'a.pdf', size: PLAN_MAX_BYTES + 1, type: '' })
  assert.equal(!big.ok && big.reason, 'size')
  assert.match(!big.ok ? big.message : '', /50 MB per file/)
  const huge = checkPlanFile({ name: 'Full set.pdf', size: 72.4 * MB, type: '' })
  assert.equal(!huge.ok && huge.message, '“Full set.pdf” is 72 MB. The limit is 50 MB per file.')
  const empty = checkPlanFile({ name: 'a.pdf', size: 0, type: '' })
  assert.equal(!empty.ok && empty.reason, 'empty')
})

test('formatBytes', () => {
  assert.equal(formatBytes(512), '512 bytes')
  assert.equal(formatBytes(1024), '1 KB')
  assert.equal(formatBytes(820 * 1024), '820 KB')
  assert.equal(formatBytes(2.44 * MB), '2.4 MB')
  assert.equal(formatBytes(50 * MB), '50 MB')
})

test('planPathname: dated folder, safe name, the extension we type it by', () => {
  assert.equal(
    planPathname('Tanner Outparcel – S-101 Foundation Plan.PDF', 'pdf', '2026-11-15'),
    'plans/2026-11-15/Tanner-Outparcel-S-101-Foundation-Plan.pdf'
  )
  assert.equal(planPathname('Café plans.jpg', 'jpg', '2026-11-15'), 'plans/2026-11-15/Cafe-plans.jpg')
  assert.equal(planPathname('../../etc/passwd.pdf', 'pdf', '2026-11-15'), 'plans/2026-11-15/etc-passwd.pdf')
  assert.equal(planPathname('.pdf', 'pdf', '2026-11-15'), 'plans/2026-11-15/plans.pdf')
  assert.equal(planPathname('scan', 'pdf', '2026-11-15'), 'plans/2026-11-15/scan.pdf')
  const long = planPathname(`${'x'.repeat(200)}.pdf`, 'pdf', '2026-11-15')
  assert.equal(long, `plans/2026-11-15/${'x'.repeat(60)}.pdf`)
  // Everything planPathname makes is a plan path, before and after Blob's random suffix.
  for (const name of ['a b.pdf', 'Ü.png', '—.zip', 'IMG_1.HEIC', 'x'.repeat(300) + '.tif']) {
    const p = planPathname(name, planExtension(name)!, '2026-11-15')
    assert.equal(isPlanPathname(p), true, p)
    const suffixed = p.replace(/(\.[a-z]+)$/, '-AbCdEfGhIjKlMnOpQrStUvWxYz1234$1')
    assert.equal(isPlanPathname(suffixed), true, suffixed)
  }
})

test('isPlanPathname / planContentTypeForPathname: only our folder, our types, no tricks', () => {
  assert.equal(planContentTypeForPathname('plans/2026-11-15/plan.pdf'), 'application/pdf')
  assert.equal(planContentTypeForPathname('plans/2026-11-15/plan.zip'), 'application/zip')
  for (const bad of [
    'plans/2026-11-15/plan.svg',
    'plans/2026-11-15/plan.html',
    'other/2026-11-15/plan.pdf',
    'plans/plan.pdf',
    'plans/2026-11-15/sub/plan.pdf',
    'plans/2026-11-15/../x.pdf',
    'plans/2026-11-15/a..pdf',
    'plans/2026-11-15/-plan.pdf',
    '/plans/2026-11-15/plan.pdf',
    'plans/2026-11-15/plan.pdf?x=1',
    '',
    null,
    42,
  ]) {
    assert.equal(planContentTypeForPathname(bad), null, String(bad))
  }
})

test('planClientPayloadOk: 1 to 5 files per form', () => {
  assert.equal(planClientPayloadOk('{"files":1}'), true)
  assert.equal(planClientPayloadOk(`{"files":${PLAN_MAX_FILES}}`), true)
  for (const bad of [null, '', '{}', '{"files":0}', `{"files":${PLAN_MAX_FILES + 1}}`, '{"files":2.5}', '{"files":"3"}', 'nope']) {
    assert.equal(planClientPayloadOk(bad), false, String(bad))
  }
})

test('parseAttachments: plan paths only, no duplicates, at most 5', () => {
  assert.deepEqual(parseAttachments(undefined), { items: [], dropped: 0 })
  assert.deepEqual(parseAttachments('plans/2026-11-15/a.pdf'), { items: [], dropped: 0 })
  const many = Array.from({ length: 7 }, (_, i) => ({ pathname: `plans/2026-11-15/f${i}.pdf`, name: `F ${i}.pdf` }))
  const parsed = parseAttachments([
    { pathname: 'plans/2026-11-15/f0.pdf', name: 'dup' },
    ...many,
    { pathname: 'secrets/x.pdf', name: 'x' },
  ])
  assert.equal(parsed.items.length, PLAN_MAX_FILES)
  assert.deepEqual(parsed.items[0], { pathname: 'plans/2026-11-15/f0.pdf', name: 'dup' })
  assert.equal(parsed.dropped, 4) // the duplicate, two over the limit, the foreign path
  // A name with control characters is cleaned; a missing name falls back to the file.
  const named = parseAttachments([
    { pathname: 'plans/2026-11-15/a.pdf', name: 'Plan\u0000\n  Set‮.pdf' },
    { pathname: 'plans/2026-11-15/b.pdf' },
  ])
  assert.deepEqual(named.items.map((item) => item.name), ['Plan Set.pdf', 'b.pdf'])
  assert.equal(cleanFileName('x'.repeat(200)).length, 118)
})

test('parseFailedCount', () => {
  assert.equal(parseFailedCount(2), 2)
  assert.equal(parseFailedCount('1'), 1)
  assert.equal(parseFailedCount(99), PLAN_MAX_FILES)
  for (const bad of [0, -1, 1.5, 'x', null, undefined]) assert.equal(parseFailedCount(bad), 0, String(bad))
})

test('signed links: round trip, and a wrong signature or path does not open', () => {
  const secret = 'test-secret-not-a-real-one'
  const pathname = 'plans/2026-11-15/Foundation-Plan-AbCdEfGhIjKlMnOpQrStUvWxYz1234.pdf'
  const sig = signPlanPath(pathname, secret)
  assert.equal(sig.length, 32)
  assert.match(sig, /^[A-Za-z0-9_-]+$/)
  assert.equal(verifyPlanSig(pathname, sig, secret), true)
  assert.equal(verifyPlanSig(pathname, sig, 'another-secret'), false)
  assert.equal(verifyPlanSig('plans/2026-11-15/other.pdf', sig, secret), false)
  assert.equal(verifyPlanSig(pathname, sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A'), secret), false)
  assert.equal(verifyPlanSig(pathname, sig.slice(1), secret), false)
  assert.equal(verifyPlanSig(pathname, sig, ''), false)

  const link = planLinkPath(pathname, sig)
  assert.equal(link, `/api/plans/file/${sig}/2026-11-15/Foundation-Plan-AbCdEfGhIjKlMnOpQrStUvWxYz1234.pdf`)
  const segments = link.split('/').slice(5)
  assert.equal(pathnameFromLinkSegments(segments), pathname)
  assert.equal(pathnameFromLinkSegments(['..', 'x.pdf']), null)
  assert.equal(pathnameFromLinkSegments(['2026-11-15', 'x.svg']), null)
  assert.equal(downloadFileName(pathname), 'Foundation-Plan.pdf')
  assert.equal(downloadFileName('plans/2026-11-15/short-name.pdf'), 'short-name.pdf')
})
