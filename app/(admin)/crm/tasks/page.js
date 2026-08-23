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
    getWhatsAppContactsUrl
} from '@/app/routes/whatsappRoutes';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '@/libs/axiosHelper';
import axios from 'axios';
import { showMessage } from '@/libs/commonHelper';
import LoadingComponent from '@/components/common/LoadingComponent';
import NotFound from '@/components/common/NotFound';

export default function TaskManagementKanbanPage() {
    const token = useSelector((state) => state.adminAuth?.token);
    const user = useSelector((state) => state.adminAuth?.user);

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
    const [filterStatus, setFilterStatus] = useState('');
    const [myTasksOnly, setMyTasksOnly] = useState(false);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [submittingTask, setSubmittingTask] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskActivities, setTaskActivities] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [newChecklistText, setNewChecklistText] = useState('');

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
            if (filterStatus) queryParams.push(`status=${encodeURIComponent(filterStatus)}`);
            if (myTasksOnly) queryParams.push(`my_tasks_only=true`);

            const url = `${getTasksListUrl}${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
            const res = await axiosGet(url, token);
            if (res?.status && Array.isArray(res.tasks)) {
                setTasks(res.tasks);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            showMessage('error', 'Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchAdminUsers();
            fetchContacts();
            fetchStats();
            fetchTasks();
        }
    }, [token]);

    // Refetch when filters change
    useEffect(() => {
        if (token) {
            const timer = setTimeout(() => {
                fetchTasks();
            }, 250);
            return () => clearTimeout(timer);
        }
    }, [searchTerm, filterAssignee, filterPriority, filterCategory, filterStatus, myTasksOnly]);

    // Open Create Modal
    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setEditTaskId(null);
        setTaskForm({
            title: '',
            description: '',
            assigned_to: user?.id ? String(user.id) : (adminUsers[0]?.id ? String(adminUsers[0].id) : ''),
            priority: 'medium',
            status: 'todo',
            category: 'CRM Follow-up',
            due_date: new Date().toISOString().split('T')[0],
            due_time: '18:00',
            checklists: [
                { id: 1, text: 'Call client to understand requirements', completed: false },
                { id: 2, text: 'Send detailed safari itinerary and package rates', completed: false }
            ],
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
            assigned_to: task.assigned_to ? String(task.assigned_to) : '',
            priority: task.priority || 'medium',
            status: task.status || 'todo',
            category: task.category || 'General',
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
            due_time: task.due_time || '',
            checklists: Array.isArray(task.checklists) ? [...task.checklists] : [],
            lead_contact_id: task.lead_contact_id ? String(task.lead_contact_id) : '',
            lead_name: task.lead_name || '',
            lead_phone: task.lead_phone || ''
        });
        setTempChecklistInput('');
        if (detailModalOpen) setDetailModalOpen(false);
        setCreateModalOpen(true);
    };

    // Add Checklist Item in Form
    const handleAddChecklistItem = () => {
        if (!tempChecklistInput.trim()) return;
        const newItem = {
            id: Date.now(),
            text: tempChecklistInput.trim(),
            completed: false
        };
        setTaskForm({
            ...taskForm,
            checklists: [...taskForm.checklists, newItem]
        });
        setTempChecklistInput('');
    };

    // Remove Checklist Item in Form
    const handleRemoveChecklistItem = (itemId) => {
        setTaskForm({
            ...taskForm,
            checklists: taskForm.checklists.filter(item => item.id !== itemId)
        });
    };

    // Lead select in Form
    const handleSelectLead = (contactId) => {
        if (!contactId) {
            setTaskForm({ ...taskForm, lead_contact_id: '', lead_name: '', lead_phone: '' });
            return;
        }
        const selected = contacts.find(c => String(c.id) === String(contactId));
        if (selected) {
            setTaskForm({
                ...taskForm,
                lead_contact_id: String(selected.id),
                lead_name: selected.name || 'Tourist',
                lead_phone: selected.wa_id || ''
            });
        }
    };

    // Save Task (Create or Update)
    const handleSaveTask = async (e) => {
        e.preventDefault();
        if (!taskForm.title.trim()) {
            showMessage('error', 'Task title is required.');
            return;
        }

        setSubmittingTask(true);
        try {
            if (isEditing && editTaskId) {
                const res = await axiosPut(`${updateTaskUrl}${editTaskId}`, taskForm, token);
                if (res?.status) {
                    showMessage('success', 'Task updated successfully!');
                    setCreateModalOpen(false);
                    fetchTasks();
                    fetchStats();
                } else {
                    showMessage('error', res?.msg || 'Failed to update task.');
                }
            } else {
                const res = await axiosPost(createTaskUrl, taskForm, token);
                if (res?.status) {
                    showMessage('success', res?.msg || 'Task created successfully!');
                    setCreateModalOpen(false);
                    fetchTasks();
                    fetchStats();
                } else {
                    showMessage('error', res?.msg || 'Failed to create task.');
                }
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error saving task.');
        } finally {
            setSubmittingTask(false);
        }
    };

    // Fast Status Shift (Kanban Move or Drop)
    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        // Optimistic UI update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            const res = await axios.patch(
                `${updateTaskStatusUrl}${taskId}/status`,
                { status: newStatus },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.data?.status) {
                fetchStats();
                if (selectedTask && selectedTask.id === taskId) {
                    setSelectedTask({ ...selectedTask, status: newStatus });
                }
            } else {
                showMessage('error', res.data?.msg || 'Failed to update status.');
                fetchTasks();
            }
        } catch (err) {
            console.error('Error updating task status:', err);
            showMessage('error', 'Failed to update status.');
            fetchTasks();
        }
    };

    // Delete Task
    const handleDeleteTask = async (taskId, taskCode) => {
        if (!window.confirm(`Are you sure you want to delete task ${taskCode}?`)) return;

        try {
            const res = await axiosDelete(`${deleteTaskUrl}${taskId}`, token);
            if (res?.status) {
                showMessage('success', `Task ${taskCode} deleted.`);
                if (detailModalOpen && selectedTask?.id === taskId) setDetailModalOpen(false);
                fetchTasks();
                fetchStats();
            } else {
                showMessage('error', res?.msg || 'Failed to delete task.');
            }
        } catch (err) {
            showMessage('error', err.response?.data?.msg || err.message || 'Error deleting task.');
        }
    };

    // Open Task Detail View
    const handleOpenDetailModal = async (task) => {
        setSelectedTask(task);
        setDetailModalOpen(true);
        setLoadingDetails(true);
        try {
            const res = await axiosGet(`${getSingleTaskUrl}${task.id}`, token);
            if (res?.status && res.task) {
                setSelectedTask(res.task);
                setTaskActivities(res.activities || []);
            }
        } catch (err) {
            console.error('Error loading task details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Toggle Checklist item in Detail view (Live update)
    const handleToggleChecklistItem = async (itemId) => {
        if (!selectedTask) return;
        const updatedChecklists = (selectedTask.checklists || []).map(item => {
            if (item.id === itemId) return { ...item, completed: !item.completed };
            return item;
        });

        setSelectedTask({ ...selectedTask, checklists: updatedChecklists });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, checklists: updatedChecklists } : t));

        try {
            await axiosPut(`${updateTaskUrl}${selectedTask.id}`, { checklists: updatedChecklists }, token);
        } catch (err) {
            console.error('Error updating checklist item:', err);
        }
    };

    // Add Checklist Item on the fly in detail view
    const handleAddLiveChecklistItem = async () => {
        if (!newChecklistText.trim() || !selectedTask) return;
        const newItem = {
            id: Date.now(),
            text: newChecklistText.trim(),
            completed: false
        };
        const updatedChecklists = [...(selectedTask.checklists || []), newItem];
        setSelectedTask({ ...selectedTask, checklists: updatedChecklists });
        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, checklists: updatedChecklists } : t));
        setNewChecklistText('');

        try {
            await axiosPut(`${updateTaskUrl}${selectedTask.id}`, { checklists: updatedChecklists }, token);
            showMessage('success', 'Subtask added.');
        } catch (err) {
            console.error('Error adding subtask:', err);
        }
    };

    // Post Comment in Detail view
    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedTask) return;

        setPostingComment(true);
        try {
            const res = await axiosPost(`${addTaskCommentUrl}${selectedTask.id}/comments`, { comment: newComment.trim() }, token);
            if (res?.status) {
                setNewComment('');
                // Refresh activity log
                const detailRes = await axiosGet(`${getSingleTaskUrl}${selectedTask.id}`, token);
                if (detailRes?.status && detailRes.activities) {
                    setTaskActivities(detailRes.activities);
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

    // Drag & Drop Handlers
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData('text/plain', taskId);
        setDraggedTaskId(taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
        if (taskId) {
            handleUpdateTaskStatus(parseInt(taskId), targetStatus);
        }
        setDraggedTaskId(null);
    };

    // Priority Badge UI Helper
    const renderPriorityBadge = (priority) => {
        switch (priority) {
            case 'urgent':
                return <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-fire-fill"></i> Urgent</span>;
            case 'high':
                return <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-arrow-up-circle-fill"></i> High</span>;
            case 'medium':
                return <span className="badge bg-info text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-equal-circle-fill"></i> Medium</span>;
            case 'low':
                return <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"><i className="ri ri-arrow-down-circle-fill"></i> Low</span>;
            default:
                return <span className="badge bg-light text-dark rounded-pill px-2.5 py-1">{priority}</span>;
        }
    };

    // Status Badge UI Helper
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'todo':
                return <span className="badge bg-label-secondary rounded-pill px-2.5 py-1">To Do</span>;
            case 'in_progress':
                return <span className="badge bg-label-primary rounded-pill px-2.5 py-1">In Progress</span>;
            case 'review':
                return <span className="badge bg-label-warning rounded-pill px-2.5 py-1">Under Review</span>;
            case 'completed':
                return <span className="badge bg-label-success rounded-pill px-2.5 py-1">Completed</span>;
            default:
                return <span className="badge bg-label-secondary rounded-pill px-2.5 py-1">{status}</span>;
        }
    };

    // Date formatting helper
    const formatDueDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            d.setHours(0, 0, 0, 0);

            const diffTime = d - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
            } else if (diffDays === 0) {
                return { text: 'Due Today', isToday: true };
            } else if (diffDays === 1) {
                return { text: 'Due Tomorrow', isUpcoming: true };
            } else {
                return { text: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), isUpcoming: true };
            }
        } catch (e) {
            return { text: dateStr };
        }
    };

    // Kanban Column Definitions
    const kanbanColumns = [
        { id: 'todo', title: 'To Do', icon: 'ri-todo-line', color: 'secondary', bgHeader: '#f1f5f9', borderCol: '#cbd5e1' },
        { id: 'in_progress', title: 'In Progress', icon: 'ri-loader-2-line', color: 'primary', bgHeader: '#eff6ff', borderCol: '#93c5fd' },
        { id: 'review', title: 'Under Review', icon: 'ri-eye-line', color: 'warning', bgHeader: '#fffbeb', borderCol: '#fde68a' },
        { id: 'completed', title: 'Completed', icon: 'ri-checkbox-circle-line', color: 'success', bgHeader: '#f0fdf4', borderCol: '#86efac' }
    ];

    // Group tasks for Kanban
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
            {/* 1. Header Banner & Actions */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div>
                    <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-heading">
                        <i className="ri ri-kanban-view-2 text-warning fs-3"></i>
                        <span>Task Management &amp; Kanban Board</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Create, assign, organize, and track administrative tasks, lead follow-ups, and operations across your team.
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {/* View Switcher: Kanban vs List */}
                    <div className="btn-group bg-white rounded-pill p-1 shadow-xs border" role="group">
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5 ${viewMode === 'kanban' ? 'btn-primary' : 'btn-light text-muted'}`}
                        >
                            <i className="ri ri-layout-masonry-line"></i>
                            <span>Kanban Board</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1.5 ${viewMode === 'list' ? 'btn-primary' : 'btn-light text-muted'}`}
                        >
                            <i className="ri ri-list-check-2"></i>
                            <span>List View</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm"
                        style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
                    >
                        <i className="ri ri-add-circle-fill"></i>
                        <span>+ Assign New Task</span>
                    </button>
                </div>
            </div>

            {/* 2. Top KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-4 col-lg-2">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
                        <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Tasks</span>
                        <h4 className="fw-bold text-dark mb-0">{stats.total_tasks}</h4>
                    </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-secondary">
                        <span className="text-muted small fw-bold text-uppercase d-block mb-1">📌 To Do</span>
                        <h4 className="fw-bold text-secondary mb-0">{stats.todo_count}</h4>
                    </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-info">
                        <span className="text-muted small fw-bold text-uppercase d-block mb-1">⏳ In Progress</span>
                        <h4 className="fw-bold text-info mb-0">{stats.in_progress_count}</h4>
                    </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
                        <span className="text-muted small fw-bold text-uppercase d-block mb-1">🔍 Review</span>
                        <h4 className="fw-bold text-warning mb-0">{stats.review_count}</h4>
                    </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
                        <span className="text-muted small fw-bold text-uppercase d-block mb-1">✅ Completed</span>
                        <h4 className="fw-bold text-success mb-0">{stats.completed_count}</h4>
                    </div>
                </div>
                <div className="col-6 col-md-4 col-lg-2">
                    <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-danger">
                        <span className="text-muted small fw-bold text-uppercase d-block mb-1">⚠️ Overdue</span>
                        <h4 className="fw-bold text-danger mb-0">{stats.overdue_count}</h4>
                    </div>
                </div>
            </div>

            {/* 3. Filter & Search Toolbar */}
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
                <div className="row g-2 align-items-center">
                    {/* Search */}
                    <div className="col-12 col-md-3">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light border-end-0"><i className="ri ri-search-line text-muted"></i></span>
                            <input
                                type="text"
                                className="form-control form-control-sm bg-light border-start-0"
                                placeholder="Search by title, code, tourist..."
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
                    <div className="col-6 col-md-2">
                        {user?.admin === 1 ? (
                            <select
                                className="form-select form-select-sm"
                                value={filterAssignee}
                                onChange={(e) => setFilterAssignee(e.target.value)}
                            >
                                <option value="">👤 All Assignees</option>
                                {adminUsers.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.first_name} {u.last_name} {u.admin === 1 ? '(Super Admin)' : '(Staff)'}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="badge bg-label-primary px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1 w-100 justify-content-center text-truncate">
                                <i className="ri ri-user-star-line"></i>
                                <span>My Tasks</span>
                            </span>
                        )}
                    </div>

                    {/* Filter Priority */}
                    <div className="col-6 col-md-2">
                        <select
                            className="form-select form-select-sm"
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                        >
                            <option value="">🎯 All Priorities</option>
                            <option value="urgent">🔴 Urgent</option>
                            <option value="high">🟠 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                        </select>
                    </div>

                    {/* Filter Category */}
                    <div className="col-6 col-md-2">
                        <select
                            className="form-select form-select-sm"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="">📂 All Categories</option>
                            {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Quick Toggle: My Tasks Only */}
                    <div className="col-6 col-md-3 d-flex justify-content-md-end gap-2">
                        <button
                            type="button"
                            onClick={() => setMyTasksOnly(!myTasksOnly)}
                            className={`btn btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 ${myTasksOnly ? 'btn-primary' : 'btn-outline-secondary'}`}
                        >
                            <i className="ri ri-user-line"></i>
                            <span>Assigned to Me</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. MAIN WORKSPACE */}
            {loading ? (
                <div className="p-5 text-center bg-white rounded-4 shadow-sm">
                    <LoadingComponent />
                    <p className="text-muted small mt-2">Loading tasks and kanban board...</p>
                </div>
            ) : viewMode === 'kanban' ? (
                /* KANBAN BOARD VIEW */
                <div className="kanban-board-wrapper" style={{ overflowX: 'auto', paddingBottom: '20px' }}>
                    <div className="row g-3 flex-nowrap" style={{ minWidth: '1080px' }}>
                        {kanbanColumns.map((col) => {
                            const colTasks = kanbanGrouped[col.id] || [];
                            return (
                                <div
                                    key={col.id}
                                    className="col-3"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    <div
                                        className="card border-0 rounded-4 shadow-sm h-100 d-flex flex-column"
                                        style={{ backgroundColor: '#f8fafc', minHeight: '650px', border: `1px solid ${col.borderCol}` }}
                                    >
                                        {/* Column Header */}
                                        <div
                                            className="p-3 border-bottom d-flex align-items-center justify-content-between rounded-top-4"
                                            style={{ backgroundColor: col.bgHeader }}
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                <i className={`ri ${col.icon} text-${col.color} fs-5`}></i>
                                                <h6 className="fw-bold mb-0 text-dark">{col.title}</h6>
                                            </div>
                                            <span className={`badge bg-${col.color} rounded-pill px-2.5 py-1`}>
                                                {colTasks.length}
                                            </span>
                                        </div>

                                        {/* Column Drop Area & Task Cards */}
                                        <div className="p-2.5 flex-grow-1 overflow-auto d-flex flex-column gap-2.5" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                                            {colTasks.length === 0 ? (
                                                <div className="text-center py-5 text-muted opacity-75">
                                                    <i className="ri ri-inbox-2-line fs-1 d-block mb-1"></i>
                                                    <small className="d-block">No tasks in {col.title}</small>
                                                    <small className="text-xs">Drag tasks here</small>
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
                                                            className="card border-0 shadow-xs rounded-3 p-3 bg-white cursor-grab transition-all"
                                                            style={{
                                                                cursor: 'grab',
                                                                borderLeft: `4px solid ${task.priority === 'urgent' ? '#dc2626' : task.priority === 'high' ? '#f59e0b' : task.priority === 'medium' ? '#0284c7' : '#94a3b8'}`
                                                            }}
                                                        >
                                                            {/* Card Top: Code, Priority & View Button */}
                                                            <div className="d-flex justify-content-between align-items-center mb-1.5 gap-1">
                                                                <span className="badge bg-light text-dark font-monospace border small px-2 py-0.5">
                                                                    {task.task_code}
                                                                </span>
                                                                <div className="d-flex align-items-center gap-1">
                                                                    {renderPriorityBadge(task.priority)}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenDetailModal(task)}
                                                                        className="btn btn-primary btn-xs rounded-pill px-2 py-0.5 d-inline-flex align-items-center gap-1 shadow-2xs"
                                                                        title="View Task Details"
                                                                        style={{ fontSize: '11px' }}
                                                                    >
                                                                        <i className="ri ri-eye-line"></i>
                                                                        <span>View</span>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Card Category Tag */}
                                                            <div className="mb-1">
                                                                <span className="text-xs text-uppercase fw-bold text-muted" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                                                                    {task.category}
                                                                </span>
                                                            </div>

                                                            {/* Card Title */}
                                                            <h6
                                                                className="fw-bold text-dark mb-1.5 cursor-pointer hover-text-primary"
                                                                style={{ fontSize: '13.5px', lineHeight: '1.3' }}
                                                                onClick={() => handleOpenDetailModal(task)}
                                                            >
                                                                {task.title}
                                                            </h6>

                                                            {/* Card Description Preview */}
                                                            {task.description && (
                                                                <p className="text-muted small mb-2 text-truncate-2" style={{ fontSize: '11.5px' }}>
                                                                    {task.description}
                                                                </p>
                                                            )}

                                                            {/* Attached Lead info */}
                                                            {task.lead_name && (
                                                                <div className="bg-light p-1.5 rounded-2 mb-2 d-flex align-items-center gap-1.5 text-xs text-dark">
                                                                    <i className="ri ri-user-voice-line text-primary"></i>
                                                                    <span className="text-truncate fw-semibold">{task.lead_name}</span>
                                                                    {task.lead_phone && <span className="text-muted">({task.lead_phone})</span>}
                                                                </div>
                                                            )}

                                                            {/* Checklist progress */}
                                                            {totalChecklists > 0 && (
                                                                <div className="mb-2">
                                                                    <div className="d-flex justify-content-between align-items-center text-xs text-muted mb-1">
                                                                        <span><i className="ri ri-checkbox-line me-1"></i>Subtasks</span>
                                                                        <span>{completedChecklists}/{totalChecklists}</span>
                                                                    </div>
                                                                    <div className="progress" style={{ height: '4px' }}>
                                                                        <div
                                                                            className={`progress-bar ${completedChecklists === totalChecklists ? 'bg-success' : 'bg-primary'}`}
                                                                            style={{ width: `${(completedChecklists / totalChecklists) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Card Footer: Assignee & Due Date */}
                                                            <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-1">
                                                                {/* Assignee */}
                                                                <div className="d-flex align-items-center gap-1.5" title={`Assigned to ${task.assignee_first_name} ${task.assignee_last_name}`}>
                                                                    <div
                                                                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                                                        style={{ width: '24px', height: '24px', fontSize: '10px' }}
                                                                    >
                                                                        {task.assignee_first_name ? task.assignee_first_name.charAt(0) : 'U'}
                                                                    </div>
                                                                    <span className="small text-muted text-truncate" style={{ maxWidth: '90px', fontSize: '11px' }}>
                                                                        {task.assignee_first_name || 'Admin'}
                                                                    </span>
                                                                </div>

                                                                {/* Due Date Indicator */}
                                                                {dueInfo && (
                                                                    <span className={`badge rounded-pill px-2 py-0.5 small ${dueInfo.isOverdue ? 'bg-danger text-white' : dueInfo.isToday ? 'bg-warning text-dark' : 'bg-light text-muted border'}`}>
                                                                        <i className="ri ri-calendar-line me-1"></i>
                                                                        {dueInfo.text}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Quick Action & Move Row */}
                                                            <div className="d-flex justify-content-between align-items-center mt-2 pt-1.5 border-top gap-1 flex-wrap">
                                                                <div className="d-flex gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleOpenDetailModal(task)}
                                                                        className="btn btn-outline-primary btn-xs rounded-pill py-0 px-2 text-xs d-inline-flex align-items-center gap-0.5"
                                                                        title="View Task Details"
                                                                    >
                                                                        <i className="ri ri-eye-line"></i>
                                                                        <span>View</span>
                                                                    </button>
                                                                    {(user?.admin === 1 || String(task.assigned_to) === String(user?.id)) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleOpenEditModal(task)}
                                                                            className="btn btn-outline-warning btn-xs rounded-pill py-0 px-2 text-xs d-inline-flex align-items-center gap-0.5"
                                                                            title="Edit Task"
                                                                        >
                                                                            <i className="ri ri-edit-line"></i>
                                                                            <span>Edit</span>
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="d-flex gap-1">
                                                                    {col.id !== 'todo' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleUpdateTaskStatus(task.id, 'todo')}
                                                                            className="btn btn-outline-secondary btn-xs rounded-pill py-0 px-1.5 text-xs"
                                                                            title="Move to To Do"
                                                                        >
                                                                            ← To Do
                                                                        </button>
                                                                    )}
                                                                    {col.id !== 'in_progress' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                                                                            className="btn btn-outline-primary btn-xs rounded-pill py-0 px-1.5 text-xs"
                                                                            title="Move to In Progress"
                                                                        >
                                                                            In Progress
                                                                        </button>
                                                                    )}
                                                                    {col.id !== 'review' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleUpdateTaskStatus(task.id, 'review')}
                                                                            className="btn btn-outline-warning btn-xs rounded-pill py-0 px-1.5 text-xs"
                                                                            title="Move to Review"
                                                                        >
                                                                            Review
                                                                        </button>
                                                                    )}
                                                                    {col.id !== 'completed' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                                                            className="btn btn-outline-success btn-xs rounded-pill py-0 px-1.5 text-xs"
                                                                            title="Mark Complete"
                                                                        >
                                                                            ✓ Complete
                                                                        </button>
                                                                    )}
                                                                </div>
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
                /* LIST / TABLE VIEW */
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="py-3 px-3">Task</th>
                                    <th className="py-3">Category</th>
                                    <th className="py-3">Priority</th>
                                    <th className="py-3">Assignee</th>
                                    <th className="py-3">Due Date</th>
                                    <th className="py-3">Subtasks</th>
                                    <th className="py-3">Status</th>
                                    <th className="py-3 text-end px-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-5">
                                            <NotFound title="No tasks found" message="Create your first task or change your filters." />
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.map((task) => {
                                        const dueInfo = formatDueDate(task.due_date);
                                        const totalChecklists = (task.checklists || []).length;
                                        const completedChecklists = (task.checklists || []).filter(c => c.completed).length;

                                        return (
                                            <tr key={task.id}>
                                                <td className="px-3">
                                                    <div className="d-flex align-items-start gap-2">
                                                        <span className="badge bg-light text-dark font-monospace border small">
                                                            {task.task_code}
                                                        </span>
                                                        <div>
                                                            <div
                                                                className="fw-bold text-dark cursor-pointer hover-text-primary"
                                                                onClick={() => handleOpenDetailModal(task)}
                                                            >
                                                                {task.title}
                                                            </div>
                                                            {task.lead_name && (
                                                                <small className="text-muted d-block">
                                                                    Tourist: <span className="fw-semibold text-dark">{task.lead_name}</span> ({task.lead_phone})
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-secondary border">
                                                        {task.category}
                                                    </span>
                                                </td>
                                                <td>{renderPriorityBadge(task.priority)}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1.5">
                                                        <div
                                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                                            style={{ width: '26px', height: '26px', fontSize: '11px' }}
                                                        >
                                                            {task.assignee_first_name ? task.assignee_first_name.charAt(0) : 'U'}
                                                        </div>
                                                        <span className="small text-dark fw-medium">
                                                            {task.assignee_first_name} {task.assignee_last_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {dueInfo ? (
                                                        <span className={`badge rounded-pill px-2.5 py-1 ${dueInfo.isOverdue ? 'bg-danger text-white' : dueInfo.isToday ? 'bg-warning text-dark' : 'bg-light text-muted border'}`}>
                                                            {dueInfo.text}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {totalChecklists > 0 ? (
                                                        <span className="small text-muted font-monospace">
                                                            {completedChecklists}/{totalChecklists} ({Math.round((completedChecklists / totalChecklists) * 100)}%)
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted small">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-select form-select-sm rounded-pill"
                                                        value={task.status}
                                                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                                        style={{ width: '135px' }}
                                                    >
                                                        <option value="todo">To Do</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="review">Under Review</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                </td>
                                                <td className="text-end px-3">
                                                    <div className="d-flex justify-content-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDetailModal(task)}
                                                            className="btn btn-sm btn-icon btn-light rounded-circle"
                                                            title="View Details"
                                                        >
                                                            <i className="ri ri-eye-line text-primary"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditModal(task)}
                                                            className="btn btn-sm btn-icon btn-light rounded-circle"
                                                            title="Edit Task"
                                                        >
                                                            <i className="ri ri-edit-line text-warning"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTask(task.id, task.task_code)}
                                                            className="btn btn-sm btn-icon btn-light rounded-circle"
                                                            title="Delete Task"
                                                        >
                                                            <i className="ri ri-delete-bin-line text-danger"></i>
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

            {/* 5. CREATE / EDIT TASK MODAL */}
            {createModalOpen && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <form onSubmit={handleSaveTask}>
                                <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                                        <i className={`ri ${isEditing ? 'ri-edit-line text-warning' : 'ri-add-circle-fill text-primary'}`}></i>
                                        <span>{isEditing ? `Edit Task ${editTaskId ? `(#${editTaskId})` : ''}` : 'Assign New Administrative Task'}</span>
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setCreateModalOpen(false)} aria-label="Close"></button>
                                </div>

                                <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                                    <div className="row g-3">
                                        {/* Task Title */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Task Title <span className="text-danger">*</span></label>
                                            <input
                                                type="text"
                                                className="form-control rounded-3"
                                                placeholder="e.g. Call tourist Kaushik to confirm hotel AC room requirement"
                                                value={taskForm.title}
                                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                                required
                                            />
                                        </div>

                                        {/* Assignee & Priority */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Assign To (Admin User) <span className="text-danger">*</span></label>
                                            {user?.admin === 1 ? (
                                                <select
                                                    className="form-select rounded-3"
                                                    value={taskForm.assigned_to}
                                                    onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                                                    required
                                                >
                                                    <option value="">Select Assignee</option>
                                                    {adminUsers.map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.first_name} {u.last_name} ({u.email || u.phone}) {u.admin === 1 ? '— Super Admin' : '— Staff'}
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
                                            <label className="form-label fw-semibold">Priority Level</label>
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
                                            <label className="form-label fw-semibold">Category / Module Tag</label>
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
                                            <label className="form-label fw-semibold">Initial Status</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={taskForm.status}
                                                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                                            >
                                                <option value="todo">📌 To Do</option>
                                                <option value="in_progress">⏳ In Progress</option>
                                                <option value="review">🔍 Under Review</option>
                                                <option value="completed">✅ Completed</option>
                                            </select>
                                        </div>

                                        {/* Due Date & Time */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Due Date</label>
                                            <input
                                                type="date"
                                                className="form-control rounded-3"
                                                value={taskForm.due_date}
                                                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                            />
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Due Time</label>
                                            <input
                                                type="time"
                                                className="form-control rounded-3"
                                                value={taskForm.due_time}
                                                onChange={(e) => setTaskForm({ ...taskForm, due_time: e.target.value })}
                                            />
                                        </div>

                                        {/* Associate with Tourist / CRM Lead */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Associate with WhatsApp Tourist Lead (Optional)</label>
                                            <select
                                                className="form-select rounded-3"
                                                value={taskForm.lead_contact_id}
                                                onChange={(e) => handleSelectLead(e.target.value)}
                                            >
                                                <option value="">— No specific lead attached —</option>
                                                {contacts.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name || 'Tourist'} ({c.wa_id})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Description */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Task Description &amp; Instructions</label>
                                            <textarea
                                                className="form-control rounded-3"
                                                rows="3"
                                                placeholder="Provide detailed context, special customer requirements, instructions, or links..."
                                                value={taskForm.description}
                                                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                            ></textarea>
                                        </div>

                                        {/* Subtasks / Checklist Builder */}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold d-flex justify-content-between align-items-center">
                                                <span>Checklist / Action Steps</span>
                                                <span className="small text-muted">{taskForm.checklists.length} items</span>
                                            </label>

                                            <div className="input-group mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control rounded-start-3"
                                                    placeholder="Add an actionable subtask step..."
                                                    value={tempChecklistInput}
                                                    onChange={(e) => setTempChecklistInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddChecklistItem}
                                                    className="btn btn-outline-primary rounded-end-3"
                                                >
                                                    <i className="ri ri-add-line"></i> Add Step
                                                </button>
                                            </div>

                                            {taskForm.checklists.length > 0 && (
                                                <div className="list-group rounded-3 border">
                                                    {taskForm.checklists.map((item, idx) => (
                                                        <div key={item.id || idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <i className="ri ri-checkbox-blank-circle-line text-muted small"></i>
                                                                <span className="small">{item.text}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveChecklistItem(item.id)}
                                                                className="btn btn-link text-danger p-0"
                                                            >
                                                                <i className="ri ri-delete-bin-line"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light py-3 px-4 d-flex justify-content-between">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setCreateModalOpen(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingTask}
                                        className="btn btn-primary rounded-pill px-5 d-inline-flex align-items-center gap-2 shadow-sm"
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
                                                <span>{isEditing ? 'Save Changes' : 'Create & Assign Task'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. TASK DETAIL & ACTIVITY DRAWER / MODAL */}
            {detailModalOpen && selectedTask && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="modal-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-light text-dark font-monospace border fs-6">
                                        {selectedTask.task_code}
                                    </span>
                                    {renderPriorityBadge(selectedTask.priority)}
                                    {renderStatusBadge(selectedTask.status)}
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(selectedTask)}
                                        className="btn btn-outline-warning btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1"
                                    >
                                        <i className="ri ri-edit-line"></i>
                                        <span>Edit</span>
                                    </button>
                                    <button type="button" className="btn-close" onClick={() => setDetailModalOpen(false)} aria-label="Close"></button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                                {/* Title */}
                                <h4 className="fw-bold text-dark mb-3">{selectedTask.title}</h4>

                                {/* Metadata Grid */}
                                <div className="row g-3 p-3 bg-light rounded-4 mb-4">
                                    <div className="col-6 col-md-3">
                                        <small className="text-muted d-block">Assigned To</small>
                                        <span className="fw-bold text-dark">
                                            {selectedTask.assignee_first_name} {selectedTask.assignee_last_name}
                                        </span>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <small className="text-muted d-block">Category</small>
                                        <span className="fw-semibold text-dark">{selectedTask.category}</span>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <small className="text-muted d-block">Due Date</small>
                                        <span className="fw-semibold text-dark">
                                            {selectedTask.due_date ? selectedTask.due_date.split('T')[0] : 'No deadline'} {selectedTask.due_time || ''}
                                        </span>
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <small className="text-muted d-block">Created By</small>
                                        <span className="fw-semibold text-dark">
                                            {selectedTask.creator_first_name} {selectedTask.creator_last_name}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Move Toolbar */}
                                <div className="mb-4 d-flex align-items-center justify-content-between p-2.5 bg-white border rounded-3">
                                    <span className="small fw-semibold text-muted">Change Status:</span>
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTaskStatus(selectedTask.id, 'todo')}
                                            className={`btn ${selectedTask.status === 'todo' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                        >
                                            To Do
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTaskStatus(selectedTask.id, 'in_progress')}
                                            className={`btn ${selectedTask.status === 'in_progress' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        >
                                            In Progress
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTaskStatus(selectedTask.id, 'review')}
                                            className={`btn ${selectedTask.status === 'review' ? 'btn-warning' : 'btn-outline-warning'}`}
                                        >
                                            Review
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTaskStatus(selectedTask.id, 'completed')}
                                            className={`btn ${selectedTask.status === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
                                        >
                                            Completed
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                {selectedTask.description && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-dark mb-2">Description &amp; Instructions</h6>
                                        <div className="p-3 bg-white border rounded-3 text-dark small" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                            {selectedTask.description}
                                        </div>
                                    </div>
                                )}

                                {/* Attached Lead Information */}
                                {selectedTask.lead_name && (
                                    <div className="mb-4 p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 d-flex justify-content-between align-items-center">
                                        <div>
                                            <small className="text-primary fw-bold text-uppercase d-block">Attached Tourist Lead</small>
                                            <span className="fw-bold text-dark">{selectedTask.lead_name}</span>
                                            {selectedTask.lead_phone && <span className="text-muted ms-2">({selectedTask.lead_phone})</span>}
                                        </div>
                                        {selectedTask.lead_phone && (
                                            <a
                                                href={`https://wa.me/${selectedTask.lead_phone}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-success btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm"
                                            >
                                                <i className="ri ri-whatsapp-fill"></i>
                                                <span>WhatsApp Lead</span>
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Interactive Checklist */}
                                <div className="mb-4">
                                    <h6 className="fw-bold text-dark mb-2 d-flex justify-content-between align-items-center">
                                        <span>Interactive Subtasks Checklist</span>
                                        <span className="badge bg-light text-dark border">
                                            {(selectedTask.checklists || []).filter(c => c.completed).length} of {(selectedTask.checklists || []).length} completed
                                        </span>
                                    </h6>

                                    <div className="list-group rounded-3 mb-2">
                                        {(selectedTask.checklists || []).length === 0 ? (
                                            <div className="list-group-item text-muted small py-3 text-center">
                                                No subtasks yet. Add steps below.
                                            </div>
                                        ) : (
                                            (selectedTask.checklists || []).map((item) => (
                                                <label
                                                    key={item.id}
                                                    className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-2 px-3 cursor-pointer ${item.completed ? 'bg-light text-muted text-decoration-line-through' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input mt-0"
                                                        checked={item.completed || false}
                                                        onChange={() => handleToggleChecklistItem(item.id)}
                                                    />
                                                    <span className="small">{item.text}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>

                                    {/* Add subtask on the fly */}
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Add a new checklist step..."
                                            value={newChecklistText}
                                            onChange={(e) => setNewChecklistText(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLiveChecklistItem(); } }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddLiveChecklistItem}
                                            className="btn btn-outline-primary"
                                        >
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* Comments & Activity Timeline */}
                                <div>
                                    <h6 className="fw-bold text-dark mb-2">Team Activity &amp; Discussion</h6>

                                    {/* Post comment input */}
                                    <form onSubmit={handlePostComment} className="mb-3">
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control rounded-start-3"
                                                placeholder="Write an update, note, or reply..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                disabled={postingComment || !newComment.trim()}
                                                className="btn btn-primary rounded-end-3 px-3 d-inline-flex align-items-center gap-1"
                                            >
                                                {postingComment ? <span className="spinner-border spinner-border-sm"></span> : <i className="ri ri-send-plane-fill"></i>}
                                                <span>Post</span>
                                            </button>
                                        </div>
                                    </form>

                                    {/* Timeline list */}
                                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                        {taskActivities.length === 0 ? (
                                            <small className="text-muted text-center py-2">No discussion notes yet.</small>
                                        ) : (
                                            taskActivities.map((act) => (
                                                <div key={act.id} className="p-2.5 bg-light rounded-3 border">
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span className="fw-bold text-dark small">
                                                            {act.first_name ? `${act.first_name} ${act.last_name || ''}` : 'Admin'}
                                                        </span>
                                                        <span className="text-xs text-muted">
                                                            {act.created_at ? new Date(act.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                    </div>
                                                    <p className="mb-0 text-dark small" style={{ fontSize: '12px' }}>
                                                        {act.content}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between">
                                <button
                                    type="button"
                                    onClick={() => handleDeleteTask(selectedTask.id, selectedTask.task_code)}
                                    className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                >
                                    <i className="ri ri-delete-bin-line me-1"></i> Delete Task
                                </button>
                                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-4" onClick={() => setDetailModalOpen(false)}>
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
