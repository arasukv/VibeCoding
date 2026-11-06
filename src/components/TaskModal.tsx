import React, { useState, useEffect } from 'react';
import { TaskItem, Course, TaskType, TaskPriority, TaskStatus, SubmissionPlatform, Subtask } from '../types';
import { Plus, Trash2, X, CheckSquare } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
  taskToEdit?: TaskItem | null;
  courses: Course[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  onDeleteTask,
  taskToEdit,
  courses,
}) => {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [type, setType] = useState<TaskType>('assignment');
  const [dueDate, setDueDate] = useState('2026-11-08T23:59');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [weightPercentage, setWeightPercentage] = useState(10);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [submissionPlatform, setSubmissionPlatform] = useState<SubmissionPlatform>('Gradescope');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCourseId(taskToEdit.courseId);
      setType(taskToEdit.type);
      setDueDate(taskToEdit.dueDate.substring(0, 16));
      setPriority(taskToEdit.priority);
      setWeightPercentage(taskToEdit.weightPercentage);
      setStatus(taskToEdit.status);
      setSubmissionPlatform(taskToEdit.submissionPlatform);
      setSubmissionUrl(taskToEdit.submissionUrl || '');
      setNotes(taskToEdit.notes || '');
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setCourseId(courses[0]?.id || '');
      setType('assignment');
      setDueDate('2026-11-08T23:59');
      setPriority('medium');
      setWeightPercentage(10);
      setStatus('todo');
      setSubmissionPlatform('Gradescope');
      setSubmissionUrl('');
      setNotes('');
      setSubtasks([]);
    }
  }, [taskToEdit, courses, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;

    const taskItem: TaskItem = {
      id: taskToEdit ? taskToEdit.id : 'task_' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      courseId,
      type,
      dueDate: dueDate.length === 16 ? `${dueDate}:00` : dueDate,
      priority,
      weightPercentage: Number(weightPercentage) || 0,
      status,
      submissionPlatform,
      submissionUrl: submissionUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      subtasks,
      estimatedMinutes: taskToEdit ? taskToEdit.estimatedMinutes : 60,
      syncedFromCalendarId: taskToEdit?.syncedFromCalendarId,
      isSyllabusItem: taskToEdit?.isSyllabusItem,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
    };

    onSaveTask(taskItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl my-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {taskToEdit ? 'Edit Task or Quiz' : 'Add New Academic Task'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Problem Set 5: Stokes Theorem"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Course & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Course *
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} – {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Deliverable Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="assignment">Assignment / HW</option>
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm Exam</option>
                <option value="final">Final Exam</option>
                <option value="lab">Lab Report</option>
                <option value="project">Course Project</option>
                <option value="reading">Assigned Reading</option>
              </select>
            </div>
          </div>

          {/* Due Date & Grade Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Due Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Weight (% of Final Grade)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={weightPercentage}
                  onChange={(e) => setWeightPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Priority, Status, Platform */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Platform
              </label>
              <select
                value={submissionPlatform}
                onChange={(e) => setSubmissionPlatform(e.target.value as SubmissionPlatform)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Gradescope">Gradescope</option>
                <option value="Canvas">Canvas</option>
                <option value="Blackboard">Blackboard</option>
                <option value="In-Person">In-Person</option>
                <option value="GitHub">GitHub</option>
                <option value="Turnitin">Turnitin</option>
                <option value="Moodle">Moodle</option>
              </select>
            </div>
          </div>

          {/* Submission URL */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Submission / Portal Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://www.gradescope.com/courses/..."
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Professor Notes &amp; Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Exam covers Lectures 1-12. One double-sided cheat sheet allowed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-2">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Milestones &amp; Subtasks Checklist ({subtasks.length})
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/70 rounded-md border border-slate-200 dark:border-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-300 truncate">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add subtask (e.g. Proofread LaTeX writeup)"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100"
              >
                Add
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {taskToEdit && onDeleteTask ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    onDeleteTask(taskToEdit.id);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors"
              >
                {taskToEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
