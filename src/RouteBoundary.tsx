import { Component } from 'react'
import type { ReactNode } from 'react'
import ScreenState from './ScreenState'

export default class RouteBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <ScreenState kind="error" /> : this.props.children
  }
}
