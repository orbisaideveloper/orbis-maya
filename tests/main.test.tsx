import { beforeEach, describe, expect, it, vi } from 'vitest'

const root = vi.hoisted(() => ({
  render: vi.fn(),
  createRoot: vi.fn(),
}))

root.createRoot.mockReturnValue({
  render: root.render,
})

vi.mock('react-dom/client', () => ({
  createRoot: root.createRoot,
}))

describe('Maya bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  it('mounts Maya into the application root', async () => {
    const element = document.getElementById('root')

    await import('../src/main')

    expect(root.createRoot).toHaveBeenCalledWith(element)
    expect(root.render).toHaveBeenCalledTimes(1)
  })
})
