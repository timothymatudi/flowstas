'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Loader2,
  LayoutGrid,
  List as ListIcon,
  Circle,
  CheckCircle2,
  Flag,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  status: Status
  priority: Priority
  due_date: string | null
}

const COLUMNS: { key: Status; label: string; accent: string }[] = [
  { key: 'todo', label: 'To Do', accent: 'border-t-slate-400' },
  { key: 'in_progress', label: 'In Progress', accent: 'border-t-blue-500' },
  { key: 'done', label: 'Done', accent: 'border-t-green-500' },
]

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'text-slate-500 bg-slate-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  high: 'text-red-500 bg-red-500/10',
}

const ORDER: Status[] = ['todo', 'in_progress', 'done']

export default function TaskWorkspace({
  initialTasks,
  userId,
}: {
  initialTasks: Task[]
  userId: string
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [adding, setAdding] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const supabase = createClient()

  const done = tasks.filter((t) => t.status === 'done').length

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    const value = title.trim()
    if (!value) return
    setAdding(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: value, priority, status: 'todo', user_id: userId })
      .select('id, title, status, priority, due_date')
      .single()
    setAdding(false)
    if (error || !data) {
      toast.error('Could not add task.')
      return
    }
    setTasks((prev) => [data as Task, ...prev])
    setTitle('')
    toast.success('Task added')
  }

  async function setStatus(task: Task, status: Status) {
    if (task.status === status) return
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)))
    const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id)
    if (error) {
      toast.error('Update failed')
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)))
    }
  }

  async function setTaskPriority(task: Task, p: Priority) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, priority: p } : t)))
    const { error } = await supabase.from('tasks').update({ priority: p }).eq('id', task.id)
    if (error) {
      toast.error('Update failed')
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, priority: task.priority } : t)))
    }
  }

  async function remove(task: Task) {
    const snapshot = tasks
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) {
      toast.error('Could not delete task')
      setTasks(snapshot)
    } else {
      toast.success('Task deleted')
    }
  }

  function move(task: Task, dir: -1 | 1) {
    const idx = ORDER.indexOf(task.status)
    const next = ORDER[idx + dir]
    if (next) setStatus(task, next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} total · {done} done
          </p>
        </div>
        {/* View toggle */}
        <div className="inline-flex rounded-xl border border-border/60 bg-card p-1 w-fit">
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              view === 'board' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <ListIcon className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {/* Add task */}
      <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 h-12 rounded-xl border border-border/60 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="h-12 rounded-xl border border-border/60 bg-background px-3 text-sm outline-none"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="h-12 px-5 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add task
        </button>
      </form>

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key)
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  const t = tasks.find((x) => x.id === dragId)
                  if (t) setStatus(t, col.key)
                  setDragId(null)
                }}
                className={`rounded-2xl border border-border/60 border-t-4 ${col.accent} bg-muted/30 p-3 min-h-[200px]`}
              >
                <div className="flex items-center justify-between px-1 pb-3">
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      className="group rounded-xl border border-border/60 bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium flex-1">{task.title}</p>
                        <button
                          onClick={() => remove(task)}
                          aria-label="Delete"
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => {
                            const order: Priority[] = ['low', 'medium', 'high']
                            const nextP = order[(order.indexOf(task.priority) + 1) % 3]
                            setTaskPriority(task, nextP)
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
                          title="Click to change priority"
                        >
                          <Flag className="w-3 h-3" />
                          {task.priority}
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => move(task, -1)}
                          disabled={task.status === 'todo'}
                          aria-label="Move left"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => move(task, 1)}
                          disabled={task.status === 'done'}
                          aria-label="Move right"
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">Drop tasks here</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-card divide-y divide-border/60">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No tasks yet — add your first one above.
            </p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="group flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setStatus(task, task.status === 'done' ? 'todo' : 'done')}
                  aria-label="Toggle done"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {task.title}
                </span>
                {task.due_date && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
                  <Flag className="w-3 h-3" />
                  {task.priority}
                </span>
                <button
                  onClick={() => remove(task)}
                  aria-label="Delete"
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
