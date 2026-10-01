import DreamResultView from './DreamResultView'
import { readDreamRecord } from './dream/record'

export default function HistoryContent({ kind, content }: { kind: string; content: string }) {
  const record = kind === 'dream' ? readDreamRecord(content) : null
  return record ? <DreamResultView record={record} /> : <p className="history-content">{content}</p>
}
