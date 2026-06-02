import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiClient } from './apiClient'

const OFFLINE_QUEUE_KEY = 'offline_action_queue_v1'

export type OfflineAction = {
  id: string
  method: 'POST' | 'PATCH' | 'DELETE'
  url: string
  body?: unknown
  description?: string
  createdAt: string
}

function actionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function readQueue(): Promise<OfflineAction[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as OfflineAction[]
  } catch {
    return []
  }
}

async function writeQueue(queue: OfflineAction[]) {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export async function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'createdAt'>) {
  const queue = await readQueue()
  queue.push({ ...action, id: actionId(), createdAt: new Date().toISOString() })
  await writeQueue(queue)
}

export async function getOfflineQueueSize() {
  const queue = await readQueue()
  return queue.length
}

export async function flushOfflineQueue(): Promise<{ processed: number; failed: number }> {
  const queue = await readQueue()
  if (!queue.length) return { processed: 0, failed: 0 }

  const remaining: OfflineAction[] = []
  let processed = 0

  for (const action of queue) {
    try {
      await apiClient.request(action.method, action.url, action.body)
      processed += 1
    } catch {
      remaining.push(action)
    }
  }

  await writeQueue(remaining)
  return { processed, failed: remaining.length }
}
