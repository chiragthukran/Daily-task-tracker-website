import TaskTracker from "@/components/task-tracker"

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Daily Task Tracker</h1>
      <TaskTracker />
      <h3 className="text-center mt-4 text-sm text-muted-foreground"> Developed by Chirag Yadav</h3>
    </div>
  )
}

