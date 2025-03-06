"use client"

import { useEffect, useState } from "react"
import { format, parseISO, startOfDay, isEqual } from "date-fns"
import { CalendarIcon, ListTodo, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

// Task type definition
interface Task {
  id: string
  title: string
  description: string
  isRecurring: boolean
  date: string // ISO date string
  isCompleted: boolean
  completedAt: string | null // ISO datetime string
}

// History record type
interface HistoryRecord {
  id: string
  taskId: string
  title: string
  date: string // ISO date string
  completedAt: string // ISO datetime string
}

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("daily")

  // Load tasks and history from localStorage and check for reset
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks")
    const savedHistory = localStorage.getItem("taskHistory")
    const lastAccessDate = localStorage.getItem("lastAccessDate")

    const today = startOfDay(new Date()).toISOString()

    // Initialize tasks
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }

    // Initialize history
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }

    // Check if we need to reset daily tasks (new day)
    if (lastAccessDate && !isEqual(parseISO(lastAccessDate), startOfDay(new Date()))) {
      // Reset completion status of recurring tasks
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.isRecurring ? { ...task, isCompleted: false, completedAt: null } : task)),
      )
    }

    // Update last access date
    localStorage.setItem("lastAccessDate", today)
  }, [])

  // Save tasks and history to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem("taskHistory", JSON.stringify(history))
  }, [history])

  // Add a new task
  const addTask = (isRecurring: boolean) => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      isRecurring,
      date: selectedDate ? startOfDay(selectedDate).toISOString() : startOfDay(new Date()).toISOString(),
      isCompleted: false,
      completedAt: null,
    }

    setTasks([...tasks, newTask])
    setNewTaskTitle("")
    setNewTaskDescription("")
  }

  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    const now = new Date().toISOString()

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const completed = !task.isCompleted

          // Add to history if completed
          if (completed) {
            const historyRecord: HistoryRecord = {
              id: Date.now().toString(),
              taskId: task.id,
              title: task.title,
              date: startOfDay(new Date()).toISOString(),
              completedAt: now,
            }

            setHistory((prevHistory) => [...prevHistory, historyRecord])
          }

          return {
            ...task,
            isCompleted: completed,
            completedAt: completed ? now : null,
          }
        }
        return task
      }),
    )
  }

  // Filter tasks for display
  const getDailyTasks = () => {
    const today = startOfDay(new Date()).toISOString()
    return tasks.filter((task) => task.isRecurring || isEqual(parseISO(task.date), parseISO(today)))
  }

  const getSpecificDateTasks = (date: Date) => {
    const dateString = startOfDay(date).toISOString()
    return tasks.filter((task) => !task.isRecurring && task.date === dateString)
  }

  // Group history by date for display
  const groupedHistory = history.reduce(
    (acc, record) => {
      const date = format(parseISO(record.date), "yyyy-MM-dd")
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(record)
      return acc
    },
    {} as Record<string, HistoryRecord[]>,
  )

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="daily" className="flex gap-2 items-center">
            <ListTodo className="h-4 w-4" />
            Daily Tasks
          </TabsTrigger>
          <TabsTrigger value="specific" className="flex gap-2 items-center">
            <CalendarIcon className="h-4 w-4" />
            Specific Day
          </TabsTrigger>
          <TabsTrigger value="history" className="flex gap-2 items-center">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Daily Tasks Tab */}
        <TabsContent value="daily">
          <CardContent>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Today's Tasks</h2>
                {getDailyTasks().length > 0 ? (
                  <div className="space-y-3">
                    {getDailyTasks().map((task) => (
                      <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Checkbox
                          id={task.id}
                          checked={task.isCompleted}
                          onCheckedChange={() => toggleTaskCompletion(task.id)}
                          className="mt-1"
                        />
                        <div className="grid gap-1 flex-1">
                          <label
                            htmlFor={task.id}
                            className={`font-medium cursor-pointer ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}
                          >
                            {task.title}
                            {task.isRecurring && (
                              <Badge variant="outline" className="ml-2">
                                Daily
                              </Badge>
                            )}
                          </label>
                          {task.description && (
                            <p className={`text-sm ${task.isCompleted ? "text-muted-foreground" : ""}`}>
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No tasks for today. Add a new task below.</p>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Add New Daily Task</h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Task description (optional)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                  <Button onClick={() => addTask(true)} className="w-full">
                    Add Daily Task
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        {/* Specific Day Tab */}
        <TabsContent value="specific">
          <CardContent>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Add Task for Specific Day</h2>
                <div className="space-y-3">
                  <DatePicker selected={selectedDate} onSelect={setSelectedDate} />
                  <Input
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Task description (optional)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                  <Button onClick={() => addTask(false)} className="w-full">
                    Add One-time Task
                  </Button>
                </div>
              </div>

              {selectedDate && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Tasks for {format(selectedDate, "MMMM d, yyyy")}</h3>
                  {getSpecificDateTasks(selectedDate).length > 0 ? (
                    <div className="space-y-3">
                      {getSpecificDateTasks(selectedDate).map((task) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                          <Checkbox
                            id={task.id}
                            checked={task.isCompleted}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                            className="mt-1"
                          />
                          <div className="grid gap-1 flex-1">
                            <label
                              htmlFor={task.id}
                              className={`font-medium cursor-pointer ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}
                            >
                              {task.title}
                            </label>
                            {task.description && (
                              <p className={`text-sm ${task.isCompleted ? "text-muted-foreground" : ""}`}>
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No tasks for this date.</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Task Completion History</h2>
            {Object.keys(groupedHistory).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedHistory)
                  .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                  .map(([date, records]) => (
                    <div key={date} className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3">{format(new Date(date), "MMMM d, yyyy")}</h3>
                      <div className="space-y-2">
                        {records.map((record) => (
                          <div key={record.id} className="flex items-center gap-2 text-sm">
                            <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></div>
                            <span>{record.title}</span>
                            <span className="text-muted-foreground ml-auto">
                              {format(parseISO(record.completedAt), "h:mm a")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No task history yet. Complete some tasks to see them here.
              </p>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

