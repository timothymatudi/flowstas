import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TaskWorkspace, { type Task } from '@/components/task-workspace'

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <TaskWorkspace initialTasks={(data as Task[]) ?? []} userId={user.id} />
}
