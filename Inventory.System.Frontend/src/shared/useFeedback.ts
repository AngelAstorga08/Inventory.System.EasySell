import { App } from 'antd'
import { errorText } from './format'

export function useFeedback() {
  const { message } = App.useApp()
  return (action: () => void, success?: string) => {
    try { action(); if (success) void message.success(success); return true }
    catch (error) { void message.error(errorText(error)); return false }
  }
}
