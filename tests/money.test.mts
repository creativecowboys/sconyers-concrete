import assert from 'node:assert/strict'
import { test } from 'node:test'
import { centsToInput, dollarsToCents, formatCents, parsePercent, splitContract } from '../lib/admin/money.ts'

test('dollarsToCents reads what people type', () => {
  assert.equal(dollarsToCents('1250'), 125_000)
  assert.equal(dollarsToCents('1,250.50'), 125_050)
  assert.equal(dollarsToCents('$ 1,250'), 125_000)
  assert.equal(dollarsToCents('0.1'), 10)
  assert.equal(dollarsToCents('.5'), 50)
})

test('dollarsToCents: blank, junk and negatives are null, not 0', () => {
  assert.equal(dollarsToCents(''), null)
  assert.equal(dollarsToCents('   '), null)
  assert.equal(dollarsToCents(null), null)
  assert.equal(dollarsToCents(undefined), null)
  assert.equal(dollarsToCents('abc'), null)
  assert.equal(dollarsToCents('-5'), null)
  assert.equal(dollarsToCents('1e3'), null)
})

test('dollarsToCents never leaves a floating-point tail', () => {
  assert.equal(dollarsToCents('0.29'), 29)
  assert.equal(dollarsToCents('1.15'), 115)
})

test('formatCents drops cents on whole dollars and keeps them otherwise', () => {
  assert.equal(formatCents(125_000), '$1,250')
  assert.equal(formatCents(125_050), '$1,250.50')
  assert.equal(formatCents(0), '$0')
  assert.equal(formatCents(null), '—')
  assert.equal(formatCents(125_000, { always: true }), '$1,250.00')
})

test('centsToInput round-trips through dollarsToCents', () => {
  for (const cents of [0, 5, 100, 125_050, 9_999_999]) {
    assert.equal(dollarsToCents(centsToInput(cents)), cents)
  }
  assert.equal(centsToInput(null), '')
  assert.equal(centsToInput(125_000), '1250')
  assert.equal(centsToInput(125_050), '1250.50')
})

test('parsePercent clamps to 0–100', () => {
  assert.equal(parsePercent('80'), 80)
  assert.equal(parsePercent('80.5%'), 80.5)
  assert.equal(parsePercent('150'), 100)
  assert.equal(parsePercent('-3'), 0)
  assert.equal(parsePercent(''), null)
  assert.equal(parsePercent('eighty'), null)
})

test('splitContract loses no pennies', () => {
  const s = splitContract(100_001, 80)
  assert.equal(s.crew + s.sconyers, 100_001)
  assert.equal(s.crew, 80_001)
  assert.deepEqual(splitContract(4_500_000, 80), { crew: 3_600_000, sconyers: 900_000 })
  assert.deepEqual(splitContract(4_500_000, 0), { crew: 0, sconyers: 4_500_000 })
})
