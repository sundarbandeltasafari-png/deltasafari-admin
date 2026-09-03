'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
    getTasksListUrl,
    createTaskUrl,
    getSingleTaskUrl,
    updateTaskStatusUrl,
    updateTaskUrl,
    deleteTaskUrl,
    getTaskStatsUrl,
    getTaskUsersUrl,
    addTaskCommentUrl,
    markTaskAsReadUrl,
    getWhatsAppContactsUrl
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

export default function TaskManagementKanbanPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);
    const isAdmin = Number(user?.admin) === 1 || Number(user?.admin) === 2;

    // State
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState({
        total_tasks: 0,
        todo_count: 0,
        in_progress_count: 0,
        review_count: 0,
        completed_count: 0,
        overdue_count: 0,
        due_today_count: 0,
        assigned_to_me_count: 0,
        urgent_count: 0
    });

    // View mode: 'kanban' or 'list'
    const [viewMode, setViewMode] = useState('kanban');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [myTasksOnly, setMyTasksOnly] = useState(false);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [submittingTask, setSubmittingTask] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskActivities, setTaskActivities] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);

    // Create / Edit Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editTaskId, setEditTaskId] = useState(null);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        status: 'todo',
        category: 'CRM Follow-up',
        due_date: '',
        due_time: '',
        checklists: [],
        lead_contact_id: '',
        lead_name: '',
        lead_phone: ''
    });
    const [tempChecklistInput, setTempChecklistInput] = useState('');

    // Drag and Drop State
    const [draggedTaskId, setDraggedTaskId] = useState(null);

    // Available Categories
    const categories = [
        'CRM Follow-up',
        'Booking Coordination',
        'Customer Support',
        'Marketing Campaign',
        'Accounts/Billing',
        'Safari Permit',
        'Hotel Booking',
        'General'
    ];

    // Fetch Initial Data
    const fetchAdminUsers = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getTaskUsersUrl, token);
            if (res?.status && Array.isArray(res.users)) {
                setAdminUsers(res.users);
            }
        } catch (err) {
            console.error('Error fetching admin users:', err);
        }
    };

    const fetchContacts = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getWhatsAppContactsUrl, token);
            if (res?.status && Array.isArray(res.contacts)) {
                setContacts(res.contacts);
            }
        } catch (err) {
            console.error('Error fetching contacts:', err);
        }
    };

    const fetchStats = async () => {
        if (!token) return;
        try {
            const res = await axiosGet(getTaskStatsUrl, token);
            if (res?.status && res.stats) {
                setStats(res.stats);
                const unreadCount = res.stats.unread_count !== undefined ? res.stats.unread_count : 0;
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('task_count_change', { detail: { count: unreadCount } }));
                }
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchTasks = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let queryParams = [];
            if (searchTerm) queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
            if (filterAssignee) queryParams.push(`assigned_to=${encodeURIComponent(filterAssignee)}`);
            if (filterPriority) queryParams.push(`priority=${encodeURIComponent(filterPriority)}`);
            if (filterCategory) queryParams.push(`category=${encodeURIComponent(filterCategory)}`);
            if (myTasksOnly) queryParams.push(`my_tasks_only=true`);

            const url = `${getTasksListUrl}${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
            const res = await axiosGet(url, token);

            if (res?.status && Array.isArray(res.tasks)) {
                setTasks(res.tasks);
            } else {
                setTasks([]);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchTasks();
            fetchAdminUsers();
            fetchContacts();
            fetchStats();
        }
    }, [token]);

    // Handle Quick Status Update
    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        if (newStatus === 'completed' && !isAdmin) {
            showMessage('error', '🔒 Permission Denied: Employees cannot complete tasks. Only an Administrator can mark tasks as completed. Please move to "Review" for admin sign-off.');
            fetchTasks();
            return;
        }

        // Optimistic UI update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(prev => ({ ...prev, status: newStatus }));
        }

        try {
            const res = await axiosPut(`${updateTaskStatusUrl}${taskId}/status`, { status: newStatus }, token);
            if (res?.status) {
                showMessage('success', res?.msg || 'Task status updated.');
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to update status.');
                fetchTasks();
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error updating status.');
            fetchTasks();
        }
    };

    // Drag & Drop Handlers
    const handleDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
        if (taskId) {
            if (targetStatus === 'completed' && !isAdmin) {
                showMessage('error', '🔒 Permission Denied: Employees cannot complete tasks. Only an Administrator can mark tasks as completed. Please move to "Review" for admin sign-off.');
                setDraggedTaskId(null);
                return;
            }
            handleUpdateTaskStatus(Number(taskId), targetStatus);
            setDraggedTaskId(null);
        }
    };

    // Open Create Modal
    const handleOpenCreateModal = (defaultStatus = 'todo') => {
        setIsEditing(false);
        setEditTaskId(null);
        setTaskForm({
            title: '',
            description: '',
            assigned_to: user?.id || '',
            priority: 'medium',
            status: defaultStatus || 'todo',
            category: 'CRM Follow-up',
            due_date: new Date().toISOString().split('T')[0],
            due_time: '18:00',
            checklists: [],
            lead_contact_id: '',
            lead_name: '',
            lead_phone: ''
        });
        setTempChecklistInput('');
        setCreateModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (task) => {
        setIsEditing(true);
        setEditTaskId(task.id);
        setTaskForm({
            title: task.title || '',
            description: task.description || '',
            assigned_to: task.assigned_to || '',
            priority: task.priority || 'medium',
            status: task.status || 'todo',
            category: task.category || 'CRM Follow-up',
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
            due_time: task.due_time || '',
            checklists: Array.isArray(task.checklists) ? task.checklists : [],
            lead_contact_id: task.lead_contact_id || '',
            lead_name: task.lead_name || '',
            lead_phone: task.lead_phone || ''
        });
        setTempChecklistInput('');
        setDetailModalOpen(false);
        setCreateModalOpen(true);
    };

    // Open Task Detail Drawer / Modal
    const handleOpenDetailModal = async (task) => {
        setSelectedTask(task);
        setNewComment('');
        setDetailModalOpen(true);

        const wasUnread = !task.is_read;
        if (wasUnread) {
            // Optimistically mark as read in local tasks state
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_read: 1 } : t));
            setStats(prev => ({
                ...prev,
                unread_count: Math.max(0, (prev.unread_count || 1) - 1)
            }));

            // Immediately notify sidebar and navbar
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('task_count_change', { detail: { delta: -1 } }));
                window.dispatchEvent(new CustomEvent('task_read', { detail: { taskId: task.id } }));
            }

            // Persist read status in backend
            try {
                axiosPost(`${markTaskAsReadUrl}${task.id}/read`, {}, token).catch(() => {});
            } catch (e) {}
        }

        try {
            const res = await axiosGet(`${getSingleTaskUrl}${task.id}`, token);
            if (res?.status && res.task) {
                setSelectedTask({ ...res.task, is_read: 1 });
                setTaskActivities(res.activities || []);
            }
        } catch (err) {
            console.error('Error fetching task details:', err);
        }
    };

    // Lead selection in form
    const handleSelectLead = (contactId) => {
        if (!contactId) {
            setTaskForm(prev => ({
                ...prev,
                lead_contact_id: '',
                lead_name: '',
                lead_phone: ''
            }));
            return;
        }
        const found = contacts.find(c => String(c.id) === String(contactId));
        if (found) {
            setTaskForm(prev => ({
                ...prev,
                lead_contact_id: found.id,
                lead_name: found.name || 'Tourist',
                lead_phone: found.wa_id || found.phone || ''
            }));
        }
    };

    // Checklist add/remove in Form
    const handleAddChecklistItem = () => {
        if (!tempChecklistInput.trim()) return;
        const newItem = {
            id: Date.now(),
            text: tempChecklistInput.trim(),
            completed: false
        };
        setTaskForm(prev => ({
            ...prev,
            checklists: [...prev.checklists, newItem]
        }));
        setTempChecklistInput('');
    };

    const handleRemoveChecklistItem = (id) => {
        setTaskForm(prev => ({
            ...prev,
            checklists: prev.checklists.filter(c => c.id !== id)
        }));
    };

    // Toggle Checklist in Details View
    const handleToggleChecklistDetail = async (chkId) => {
        if (!selectedTask) return;
        const updatedChecklists = (selectedTask.checklists || []).map(c =>
            c.id === chkId ? { ...c, completed: !c.completed } : c
        );

        setSelectedTask(prev => ({ ...prev, checklists: updatedChecklists }));
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, checklists: updatedChecklists } : t));

        try {
            await axiosPut(`${updateTaskUrl}${selectedTask.id}`, { checklists: updatedChecklists }, token);
        } catch (e) {
            console.error('Error updating checklist:', e);
        }
    };

    // Post Comment
    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedTask) return;
        setPostingComment(true);
        try {
            const res = await axiosPost(`${addTaskCommentUrl}${selectedTask.id}/comments`, {
                comment_text: newComment.trim()
            }, token);

            if (res?.status) {
                showMessage('success', 'Comment posted.');
                setNewComment('');
                // Refresh task details
                const dRes = await axiosGet(`${getSingleTaskUrl}${selectedTask.id}`, token);
                if (dRes?.status) {
                    setSelectedTask(dRes.task);
                    setTaskActivities(dRes.activities || []);
                }
            } else {
                showMessage('error', res?.msg || 'Failed to post comment.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error posting comment.');
        } finally {
            setPostingComment(false);
        }
    };

    // Save Task Submit (Create or Update)
    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!taskForm.title.trim()) {
            showMessage('error', 'Task title is required.');
            return;
        }

        setSubmittingTask(true);
        try {
            let res;
            if (isEditing && editTaskId) {
                res = await axiosPut(`${updateTaskUrl}${editTaskId}`, taskForm, token);
            } else {
                res = await axiosPost(createTaskUrl, taskForm, token);
            }

            if (res?.status) {
                showMessage('success', isEditing ? 'Task updated successfully!' : '🎉 Task created & assigned successfully!');
                setCreateModalOpen(false);
                fetchTasks();
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to save task.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving task.');
        } finally {
            setSubmittingTask(false);
        }
    };

    // Delete Task
    const handleDeleteTask = async (id, code) => {
        if (!confirm(`Are you sure you want to delete task ${code}?`)) return;
        try {
            const res = await axiosDelete(`${deleteTaskUrl}${id}`, token);
            if (res?.status) {
                showMessage('success', 'Task removed successfully.');
                setDetailModalOpen(false);
                fetchTasks();
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to delete task.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error deleting task.');
        }
    };

    // Priority Pill Renderer
    const renderPriorityPill = (priority) => {
        switch (priority) {
            case 'urgent':
                return <span className="badge rounded-pill bg-danger text-white px-2 py-0.5 fw-semibold" style={{ fontSize: '10px' }}>🔴 Urgent</span>;
            case 'high':
                return <span className="badge rounded-pill bg-warning text-dark px-2 py-0.5 fw-semibold" style={{ fontSize: '10px' }}>🟠 High</span>;
            case 'medium':
                return <span className="badge rounded-pill bg-info text-white px-2 py-0.5 fw-semibold" style={{ fontSize: '10px' }}>🟡 Medium</span>;
            case 'low':
                return <span className="badge rounded-pill bg-secondary text-white px-2 py-0.5 fw-semibold" style={{ fontSize: '10px' }}>🟢 Low</span>;
            default:
                return null;
        }
    };

    // Format Due Date
    const formatDueDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(d);
            target.setHours(0, 0, 0, 0);
            const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
            } else if (diffDays === 0) {
                return { text: 'Due Today', isToday: true };
            } else if (diffDays === 1) {
                return { text: 'Tomorrow', isUpcoming: true };
            } else {
                return { text: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), isUpcoming: true };
            }
        } catch (e) {
            return { text: dateStr };
        }
    };

    // Kanban 4 Basic Columns
    const kanbanColumns = [
        { id: 'todo', title: 'To Do', badgeClass: 'bg-secondary text-white', borderTop: '#64748b' },
        { id: 'in_progress', title: 'In Progress', badgeClass: 'bg-primary text-white', borderTop: '#0066cc' },
        { id: 'review', title: 'Review', badgeClass: 'bg-warning text-dark', borderTop: '#f59e0b' },
        { id: 'completed', title: 'Completed', badgeClass: 'bg-success text-white', borderTop: '#10b981' }
    ];

    // Group tasks by status
    const kanbanGrouped = useMemo(() => {
        return {
            todo: tasks.filter(t => t.status === 'todo'),
            in_progress: tasks.filter(t => t.status === 'in_progress'),
            review: tasks.filter(t => t.status === 'review'),
            completed: tasks.filter(t => t.status === 'completed')
        };
    }, [tasks]);

    return (
        <div className="container-xxl flex-grow-1 container-p-y">
            {/* 1. Simple, Clean Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h4 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                        <i className="ri ri-kanban-view-2 text-primary fs-4"></i>
                        <span>Task Kanban Board</span>
                    </h4>
                    <small className="text-muted">
                        Total {stats.total_tasks} tasks ({stats.in_progress_count} in progress, {stats.overdue_count} overdue)
                    </small>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* View Switcher: Kanban vs List */}
                    <div className="btn-group btn-group-sm bg-white rounded-pill p-0.5 border shadow-2xs" role="group">
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={`btn btn-xs rounded-pill px-3 py-1 ${viewMode === 'kanban' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                            style={viewMode === 'kanban' ? { backgroundColor: '#0066cc', borderColor: '#0066cc' } : {}}
                        >
                            <i className="ri ri-layout-masonry-line me-1"></i> Board
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`btn btn-xs rounded-pill px-3 py-1 ${viewMode === 'list' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                            style={viewMode === 'list' ? { backgroundColor: '#0066cc', borderColor: '#0066cc' } : {}}
                        >
                            <i className="ri ri-list-check-2 me-1"></i> List
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleOpenCreateModal('todo')}
                        className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-xs"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-add-line fs-6"></i>
                        <span>+ New Task</span>
                    </button>
                </div>
            </div>

            {/* 2. Basic Quick Filters Toolbar */}
            <div className="p-2.5 bg-white rounded-4 border shadow-2xs mb-3">
                <div className="row g-2 align-items-center">
                    {/* Search */}
                    <div className="col-12 col-md-4">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0"><i className="ri ri-search-line text-muted"></i></span>
                            <input
                                type="text"
                                className="form-control form-control-sm bg-light border-start-0"
                                placeholder="Search tasks by title, tourist name, code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm('')}>
                                    <i className="ri ri-close-line"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Assignee */}
                    <div className="col-6 col-md-3">
                        {user?.admin === 1 ? (
                            <select
                                className="form-select form-select-sm rounded-3"
                                value={filterAssignee}
                                onChange={(e) => setFilterAssignee(e.target.value)}
                            >
                                <option value="">👤 All Assignees</option>
                                {adminUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.first_name} {u.last_name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="badge bg-light text-dark px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1 w-100 justify-content-center border">
                                <i className="ri ri-user-line text-primary"></i> My Tasks
                            </span>
                        )}
                    </div>

                    {/* Filter Priority */}
                    <div className="col-6 col-md-2">
                        <select
                            className="form-select form-select-sm rounded-3"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                        >
                            <option value="">🎯 Priority</option>
                            <option value="urgent">🔴 Urgent</option>
                            <option value="high">🟠 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                        </select>
                    </div>

                    {/* Filter Category */}
                    <div className="col-6 col-md-2">
                        <select
                            className="form-select form-select-sm rounded-3"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">📂 Category</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Button: My Tasks */}
                    <div className="col-6 col-md-1 text-end">
                        <button
                            type="button"
                            onClick={() => { setMyTasksOnly(!myTasksOnly); fetchTasks(); }}
                            className={`btn btn-xs rounded-pill px-2.5 py-1 w-100 ${myTasksOnly ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                            title="Filter tasks assigned to me"
                        >
                            {myTasksOnly ? '✓ Mine' : 'Mine'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. MAIN WORKSPACE */}
            {loading ? (
                <div className="p-5 text-center bg-white rounded-4 shadow-sm border">
                    <LoadingComponent />
                    <p className="text-muted small mt-2">Loading tasks...</p>
                </div>
            ) : viewMode === 'kanban' ? (
                /* CLEAN KANBAN BOARD VIEW */
                <div className="kanban-board-container" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
                    <div className="row g-3 flex-nowrap" style={{ minWidth: '1140px' }}>
                        {kanbanColumns.map((col) => {
                            const colTasks = kanbanGrouped[col.id] || [];
                            return (
                                <div
                                    key={col.id}
                                    className="col-3"
                                    style={{ minWidth: '270px' }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    <div
                                        className="card border-0 rounded-4 shadow-2xs h-100 d-flex flex-column"
                                        style={{ backgroundColor: '#f8fafc', minHeight: '620px', borderTop: `3px solid ${col.borderTop}` }}
                                    >
                                        {/* Column Header */}
                                        <div
                                            className="border-bottom bg-white d-flex align-items-center justify-content-between rounded-top-4"
                                            style={{ padding: '14px 18px' }}
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <h6 className="fw-bold mb-0 text-dark small">{col.title}</h6>
                                                <span className={`badge ${col.badgeClass} rounded-pill px-2.5 py-1`} style={{ fontSize: '11px' }}>
                                                    {colTasks.length}
                                                </span>
                                                {col.id === 'completed' && !isAdmin && (
                                                    <span className="badge bg-light text-muted border rounded-pill px-2 py-0.5" style={{ fontSize: '10px' }} title="Only Administrators can mark tasks as completed">
                                                        <i className="ri ri-lock-line text-warning me-0.5"></i> Admin Only
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenCreateModal(col.id)}
                                                className="btn btn-xs btn-outline-secondary rounded-circle p-1"
                                                title={`Add task to ${col.title}`}
                                                style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <i className="ri ri-add-line"></i>
                                            </button>
                                        </div>

                                        {/* Column Task Cards */}
                                        <div
                                            className="flex-grow-1 overflow-auto d-flex flex-column gap-3"
                                            style={{ padding: '16px', maxHeight: 'calc(100vh - 280px)' }}
                                        >
                                            {colTasks.length === 0 ? (
                                                <div className="text-center py-5 text-muted opacity-60">
                                                    <i className="ri ri-inbox-line fs-2 d-block mb-1"></i>
                                                    <small className="d-block">No tasks</small>
                                                </div>
                                            ) : (
                                                colTasks.map((task) => {
                                                    const dueInfo = formatDueDate(task.due_date);
                                                    const totalChecklists = (task.checklists || []).length;
                                                    const completedChecklists = (task.checklists || []).filter(c => c.completed).length;

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            draggable={true}
                                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                                            onClick={() => handleOpenDetailModal(task)}
                                                            className="card border rounded-4 bg-white shadow-2xs hover-shadow transition-all"
                                                            style={{ padding: '16px', cursor: 'grab' }}
                                                        >
                                                            {/* Card Header: Task Code, Category & Priority */}
                                                            <div className="d-flex justify-content-between align-items-center mb-2 gap-1">
                                                                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                                    {task.task_code && (
                                                                        <span className="badge font-monospace border px-1.5 py-0.5 rounded" style={{ fontSize: '10.5px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600' }}>
                                                                            {task.task_code}
                                                                        </span>
                                                                    )}
                                                                    {!task.is_read && (
                                                                        <span className="badge bg-danger text-white rounded-pill px-2 py-0.5 shadow-2xs font-monospace" style={{ fontSize: '9.5px', fontWeight: '700', letterSpacing: '0.3px' }}>
                                                                            NEW
                                                                        </span>
                                                                    )}
                                                                    <span className="badge text-muted border fw-semibold px-2 py-0.5 rounded-pill" style={{ fontSize: '11px' }}>
                                                                        {task.category || 'General'}
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    {renderPriorityPill(task.priority)}
                                                                </div>
                                                            </div>

                                                            {/* Title (High-contrast, prominent headline) */}
                                                            <h6
                                                                className="fw-bold mb-2"
                                                                style={{ 
                                                                    fontSize: '14px', 
                                                                    lineHeight: '1.45', 
                                                                    color: '#0f172a',
                                                                    fontWeight: '700',
                                                                    wordBreak: 'break-word',
                                                                    letterSpacing: '-0.1px'
                                                                }}
                                                            >
                                                                {task.title || task.task_title || task.name || 'Untitled Task'}
                                                            </h6>

                                                            {/* Description excerpt if present */}
                                                            {task.description && (
                                                                <p 
                                                                    className="text-muted mb-2 text-truncate" 
                                                                    style={{ fontSize: '11.5px', lineHeight: '1.35', maxWidth: '100%' }}
                                                                    title={task.description}
                                                                >
                                                                    {task.description}
                                                                </p>
                                                            )}

                                                            {/* Tourist / Lead Attachment Badge */}
                                                            {task.lead_name && (
                                                                <div className="bg-light p-2 px-2.5 rounded-3 mb-2 d-flex align-items-center gap-2 text-muted" style={{ fontSize: '11.5px' }}>
                                                                    <i className="ri ri-user-voice-line text-primary"></i>
                                                                    <span className="text-truncate fw-medium" style={{ color: '#1e293b' }}>{task.lead_name}</span>
                                                                </div>
                                                            )}

                                                            {/* Checklist progress pill */}
                                                            {totalChecklists > 0 && (
                                                                <div className="d-flex align-items-center gap-2 mb-2 text-muted" style={{ fontSize: '11.5px' }}>
                                                                    <i className="ri ri-checkbox-line text-success"></i>
                                                                    <span>{completedChecklists}/{totalChecklists} done</span>
                                                                    <div className="progress flex-grow-1" style={{ height: '4px' }}>
                                                                        <div
                                                                            className={`progress-bar ${completedChecklists === totalChecklists ? 'bg-success' : 'bg-primary'}`}
                                                                            style={{ width: `${(completedChecklists / totalChecklists) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Card Meta Row: Assignee & Due Date (Separated from status select to prevent overflow) */}
                                                            <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-1">
                                                                {/* Assignee */}
                                                                <div className="d-flex align-items-center gap-1.5 overflow-hidden" title={`Assigned to ${task.assignee_first_name || 'Staff'}`}>
                                                                    <div
                                                                        className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-2xs"
                                                                        style={{ width: '22px', height: '22px', fontSize: '10px', backgroundColor: '#0066cc', flexShrink: 0 }}
                                                                    >
                                                                        {task.assignee_first_name ? task.assignee_first_name.charAt(0).toUpperCase() : 'U'}
                                                                    </div>
                                                                    <span className="text-dark fw-medium text-truncate" style={{ maxWidth: '100px', fontSize: '11.5px' }}>
                                                                        {task.assignee_first_name || 'Admin'}
                                                                    </span>
                                                                </div>

                                                                {/* Due Date Indicator */}
                                                                {dueInfo && (
                                                                    <span
                                                                        className={`badge rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1 ${dueInfo.isOverdue ? 'bg-danger text-white' : dueInfo.isToday ? 'bg-warning text-dark' : 'bg-light text-muted border'}`}
                                                                        style={{ fontSize: '10.5px', whiteSpace: 'nowrap' }}
                                                                    >
                                                                        <i className="ri ri-calendar-line"></i>
                                                                        {dueInfo.text}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Dedicated Quick Status Dropdown Row In Card */}
                                                            <div 
                                                                className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top bg-light-subtle px-2 py-1 rounded-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <span className="text-muted fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                                    <i className="ri ri-arrow-left-right-line text-secondary"></i> Status:
                                                                </span>
                                                                <select
                                                                    className="form-select form-select-sm py-0.5 px-2 rounded-2 border-secondary-subtle bg-white text-dark fw-medium shadow-2xs"
                                                                    value={task.status}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        e.stopPropagation();
                                                                        handleUpdateTaskStatus(task.id, e.target.value);
                                                                    }}
                                                                    style={{ 
                                                                        fontSize: '11.5px', 
                                                                        height: '28px', 
                                                                        width: '135px',
                                                                        cursor: 'pointer' 
                                                                    }}
                                                                >
                                                                    <option value="todo">To Do</option>
                                                                    <option value="in_progress">In Progress</option>
                                                                    <option value="review">Review</option>
                                                                    <option value="completed" disabled={!isAdmin}>
                                                                        {isAdmin ? 'Completed' : 'Completed (Admin)'}
                                                                    </option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                /* CLEAN LIST / TABLE VIEW */
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr className="small text-muted">
                                    <th className="py-2.5 px-3">Task Title</th>
                                    <th className="py-2.5">Category</th>
                                    <th className="py-2.5">Priority</th>
                                    <th className="py-2.5">Assignee</th>
                                    <th className="py-2.5">Due Date</th>
                                    <th className="py-2.5">Status</th>
                                    <th className="py-2.5 text-end px-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-5">
                                            <NotFound title="No tasks found" message="Create your first task or change your filters." />
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.map((task) => {
                                        const dueInfo = formatDueDate(task.due_date);
                                        return (
                                            <tr key={task.id} className="cursor-pointer" onClick={() => handleOpenDetailModal(task)}>
                                                <td className="px-3">
                                                    <div className="d-flex align-items-center gap-1.5 mb-0.5">
                                                        <span className="badge font-monospace border px-1.5 py-0.5 rounded" style={{ fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                                                            {task.task_code}
                                                        </span>
                                                        {!task.is_read && (
                                                            <span className="badge bg-danger text-white rounded-pill px-1.5 py-0.5 shadow-2xs font-monospace" style={{ fontSize: '9px', fontWeight: '700' }}>
                                                                NEW
                                                            </span>
                                                        )}
                                                        <span className="fw-bold small" style={{ color: '#0f172a', fontSize: '13px' }}>
                                                            {task.title || task.task_title || task.name || 'Untitled Task'}
                                                        </span>
                                                    </div>
                                                    {task.lead_name && (
                                                        <small className="text-muted d-block" style={{ fontSize: '11px' }}>Tourist: {task.lead_name}</small>
                                                    )}
                                                </td>
                                                <td><span className="badge bg-light text-secondary border small">{task.category}</span></td>
                                                <td>{renderPriorityPill(task.priority)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1.5">
                                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '10px' }}>
                                                            {task.assignee_first_name ? task.assignee_first_name.charAt(0) : 'U'}
                                                        </div>
                                                        <span className="small text-dark">{task.assignee_first_name} {task.assignee_last_name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {dueInfo ? (
                                                        <span className={`badge rounded-pill px-2 py-0.5 small ${dueInfo.isOverdue ? 'bg-danger text-white' : dueInfo.isToday ? 'bg-warning text-dark' : 'bg-light text-muted border'}`}>
                                                            {dueInfo.text}
                                                        </span>
                                                    ) : <span className="text-muted small">—</span>}
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        className="form-select form-select-sm rounded-pill"
                                                        value={task.status}
                                                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                                        style={{ width: '155px', fontSize: '12px' }}
                                                    >
                                                        <option value="todo">To Do</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="review">Review</option>
                                                        <option value="completed" disabled={!isAdmin}>Completed {!isAdmin ? '(Admin Only)' : ''}</option>
                                                    </select>
                                                </td>
                                                <td className="text-end px-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="d-flex justify-content-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditModal(task)}
                                                            className="btn btn-xs btn-outline-warning rounded-circle p-1"
                                                            title="Edit Task"
                                                        >
                                                            <i className="ri ri-edit-line"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTask(task.id, task.task_code)}
                                                            className="btn btn-xs btn-outline-danger rounded-circle p-1"
                                                            title="Delete Task"
                                                        >
                                                            <i className="ri ri-delete-bin-line"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. CREATE / EDIT TASK MODAL */}
            {createModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <form onSubmit={handleSaveTask}>
                                <div className="modal-header bg-primary text-white py-3 px-4 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0066cc' }}>
                                    <h5 className="modal-title fw-bold text-white mb-0 d-flex align-items-center gap-2">
                                        <i className={`ri ${isEditing ? 'ri-edit-line' : 'ri-add-circle-fill'}`}></i>
                                        <span>{isEditing ? 'Edit Task' : 'Create & Assign Task'}</span>
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setCreateModalOpen(false)} aria-label="Close"></button>
                                </div>

                                <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                    <div className="row g-3">
                                        {/* Task Title */}
                                        <div className="col-12">
                                            <label className="form-label small fw-bold">Task Title <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. Call tourist Kaushik to confirm AC room and boat slot"
                                                value={taskForm.title}
                                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                                required
                                            />
                                        </div>

                                        {/* Assignee & Priority */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold">Assign To (Staff Member) <span className="text-danger">*</span></label>
                                            {user?.admin === 1 ? (
                                                <select
                                                    className="form-select rounded-3"
                                                    value={taskForm.assigned_to}
                                                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                                                    required
                                                >
                                                    <option value="">-- Choose Team Member --</option>
                                                    {adminUsers.map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.first_name} {u.last_name} {u.admin === 1 ? '(Super Admin)' : '(Staff)'}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3 bg-light"
                                                    value={`${user?.first_name || 'My'} ${user?.last_name || 'Account'} (Assigned to You)`}
                                                    disabled
                                                />
                                            )}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold">Priority</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={taskForm.priority}
                                                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                            >
                                                <option value="urgent">🔴 Urgent</option>
                                                <option value="high">🟠 High</option>
                                                <option value="medium">🟡 Medium</option>
                                                <option value="low">🟢 Low</option>
                                            </select>
                                        </div>

                                        {/* Category & Status */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold">Category</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={taskForm.category}
                                                onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                                            >
                                                {categories.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold">Status</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={taskForm.status}
                                                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="review">Under Review</option>
                                                <option value="completed" disabled={!isAdmin}>Completed {!isAdmin ? '(Admin Only)' : ''}</option>
                                            </select>
                                            {!isAdmin && (
                                                <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                                    <i className="ri-information-line me-1"></i>Only Administrators can mark tasks as Completed. Please choose &quot;Under Review&quot; for admin approval.
                                                </small>
                                            )}
                                        </div>

                                        {/* Due Date */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold">Due Date</label>
                                            <input
                                                type="date"
                                                className="form-control rounded-3"
                                                value={taskForm.due_date}
                                                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                            />
                                        </div>

                                        {/* Associate Tourist */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small fw-bold">Attach WhatsApp Tourist Lead (Optional)</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={taskForm.lead_contact_id}
                                                onChange={(e) => handleSelectLead(e.target.value)}
                                            >
                                                <option value="">— None —</option>
                                                {contacts.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name || 'Tourist'} ({c.wa_id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Description */}
                                        <div className="col-12">
                                            <label className="form-label small fw-bold">Task Instructions &amp; Notes</label>
                                            <textarea
                                                className="form-control rounded-3"
                                                rows="3"
                                                placeholder="Provide details or instructions..."
                                                value={taskForm.description}
                                                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                            ></textarea>
                                        </div>

                                        {/* Subtasks Checklist */}
                                        <div className="col-12">
                                            <label className="form-label small fw-bold d-flex justify-content-between">
                                                <span>Checklist Subtasks</span>
                                                <span className="text-muted">{taskForm.checklists.length} items</span>
                                            </label>
                                            <div className="input-group input-group-sm mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Add a step..."
                                                    value={tempChecklistInput}
                                                    onChange={(e) => setTempChecklistInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                                                />
                                                <button type="button" onClick={handleAddChecklistItem} className="btn btn-primary">
                                                    + Add
                                                </button>
                                            </div>

                                            {taskForm.checklists.length > 0 && (
                                                <div className="list-group rounded-3 border">
                                                    {taskForm.checklists.map((item) => (
                                                        <div key={item.id} className="list-group-item d-flex justify-content-between align-items-center py-1.5 px-3 small">
                                                            <span>• {item.text}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveChecklistItem(item.id)}
                                                                className="btn btn-link text-danger p-0"
                                                            >
                                                                <i className="ri ri-close-line"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setCreateModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingTask}
                                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-1.5 shadow-sm"
                                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                                    >
                                        {submittingTask ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri ri-check-line"></i>
                                                <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. TASK DETAIL MODAL */}
            {detailModalOpen && selectedTask && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-light text-dark font-monospace border small">
                                        {selectedTask.task_code}
                                    </span>
                                    {renderPriorityPill(selectedTask.priority)}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(selectedTask)}
                                        className="btn btn-outline-warning btn-xs rounded-pill px-3 py-1"
                                    >
                                        <i className="ri ri-edit-line me-1"></i> Edit
                                    </button>
                                    <button type="button" className="btn-close" onClick={() => setDetailModalOpen(false)} aria-label="Close"></button>
                                </div>
                            </div>

                            <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                <h5 className="fw-bold mb-2" style={{ color: '#0f172a', fontSize: '18px', fontWeight: '700', wordBreak: 'break-word' }}>
                                    {selectedTask.title || selectedTask.task_title || selectedTask.name || 'Untitled Task'}
                                </h5>

                                {/* Meta pill bar */}
                                <div className="d-flex flex-wrap gap-2 mb-3 p-2 bg-light rounded-3 small">
                                    <span className="text-muted">Assigned: <strong style={{ color: '#1e293b' }}>{selectedTask.assignee_first_name} {selectedTask.assignee_last_name}</strong></span>
                                    <span className="text-muted">• Category: <strong style={{ color: '#1e293b' }}>{selectedTask.category}</strong></span>
                                    <span className="text-muted">• Due: <strong style={{ color: '#1e293b' }}>{selectedTask.due_date ? selectedTask.due_date.split('T')[0] : 'No deadline'}</strong></span>
                                </div>

                                {/* Status Change Bar */}
                                <div className="p-2 bg-light rounded-3 border mb-3 d-flex align-items-center justify-content-between">
                                    <span className="small fw-semibold text-muted">Status:</span>
                                    <div className="btn-group btn-group-sm" role="group">
                                        {kanbanColumns.map(c => {
                                            const isCompletedBtn = c.id === 'completed';
                                            const disabledForEmployee = isCompletedBtn && !isAdmin;
                                            return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    disabled={disabledForEmployee}
                                                    onClick={() => handleUpdateTaskStatus(selectedTask.id, c.id)}
                                                    className={`btn btn-xs ${selectedTask.status === c.id ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                                                    title={disabledForEmployee ? 'Only Administrators can mark tasks as completed' : `Set status to ${c.title}`}
                                                >
                                                    {disabledForEmployee && <i className="ri-lock-line me-1"></i>}
                                                    {c.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedTask.description && (
                                    <div className="mb-3">
                                        <label className="small fw-bold text-muted d-block mb-1">Description</label>
                                        <div className="p-3 bg-white border rounded-3 small" style={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedTask.description}
                                        </div>
                                    </div>
                                )}

                                {/* Subtasks Checklist */}
                                {(selectedTask.checklists || []).length > 0 && (
                                    <div className="mb-3">
                                        <label className="small fw-bold text-muted d-block mb-1">Checklist Subtasks</label>
                                        <div className="list-group rounded-3 border">
                                            {selectedTask.checklists.map((chk) => (
                                                <label key={chk.id} className="list-group-item d-flex align-items-center gap-2 py-2 px-3 small cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input mt-0"
                                                        checked={chk.completed}
                                                        onChange={() => handleToggleChecklistDetail(chk.id)}
                                                    />
                                                    <span className={chk.completed ? 'text-decoration-line-through text-muted' : 'text-dark'}>
                                                        {chk.text}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Comments Section */}
                                <div>
                                    <label className="small fw-bold text-muted d-block mb-1">Discussion &amp; Updates</label>
                                    <form onSubmit={handlePostComment} className="mb-3">
                                        <div className="input-group input-group-sm">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Write a comment or status update..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                            <button type="submit" disabled={postingComment} className="btn btn-primary">
                                                Post
                                            </button>
                                        </div>
                                    </form>

                                    {taskActivities.length > 0 && (
                                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                            {taskActivities.map((act) => (
                                                <div key={act.id} className="p-2 bg-light rounded-3 small border">
                                                    <div className="d-flex justify-content-between mb-0.5">
                                                        <strong className="text-dark">{act.first_name} {act.last_name}</strong>
                                                        <span className="text-muted" style={{ fontSize: '10px' }}>
                                                            {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-dark">{act.comment_text}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTask(selectedTask.id, selectedTask.task_code)}
                                    className="btn btn-xs btn-outline-danger rounded-pill px-3"
                                >
                                    Delete Task
                                </button>
                                <button type="button" className="btn btn-secondary btn-xs rounded-pill px-3" onClick={() => setDetailModalOpen(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
