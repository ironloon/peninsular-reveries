import assert from 'node:assert/strict'
import test from 'node:test'
import { DESTINATIONS, getDestination, getTransportType, pickNextMysteryTarget } from './destinations'

test('destination data stays internally consistent', () => {
  const ids = new Set<string>()

  for (const destination of DESTINATIONS) {
    assert.ok(destination.name.length > 0)
    assert.ok(destination.country.length > 0)
    assert.equal(destination.facts.length, 3)
    assert.equal(destination.clues.length, 3)
    assert.equal(destination.scene.pixels.length, destination.scene.width * destination.scene.height)
    assert.ok(destination.scene.pixels.every((pixel) => pixel >= 0 && pixel < destination.scene.palette.length))
    assert.ok(destination.coords.x >= 0 && destination.coords.x <= 100)
    assert.ok(destination.coords.y >= 0 && destination.coords.y <= 100)
    assert.ok(destination.memoryLabel.length > 0)
    assert.ok(!ids.has(destination.id))
    ids.add(destination.id)
  }
})

test('transport selection reaches every vehicle type', () => {
  const paris = getDestination('paris')
  const reykjavik = getDestination('reykjavik')
  const cairo = getDestination('cairo')
  const nairobi = getDestination('nairobi')
  const newYork = getDestination('new-york')
  const rio = getDestination('rio')
  const tokyo = getDestination('tokyo')

  assert.ok(paris && reykjavik && cairo && nairobi && newYork && rio && tokyo)
  assert.equal(getTransportType(paris, reykjavik), 'bus')
  assert.equal(getTransportType(cairo, nairobi), 'train')
  assert.equal(getTransportType(newYork, rio), 'boat')
  assert.equal(getTransportType(tokyo, rio), 'plane')
})

test('mystery targeting advances in a stable order', () => {
  assert.equal(pickNextMysteryTarget([]), 'paris')
  assert.equal(pickNextMysteryTarget(['paris', 'cairo']), 'tokyo')
  assert.equal(pickNextMysteryTarget(DESTINATIONS.map((destination) => destination.id)), null)
})