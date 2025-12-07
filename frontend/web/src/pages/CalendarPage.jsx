import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { calendarService } from '../services/calendarService';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus, FiClock, FiCalendar, FiTag, FiAlignLeft, FiX, FiTrash2, FiCheck, FiChevronLeft, FiChevronRight, FiSearch, FiFilter
} from 'react-icons/fi';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

// --- Components ---

const EventFormPanel = ({ isOpen, onClose, onSubmit, onDelete, initialDate, initialEvent }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('PERSONAL');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialEvent) {
                setTitle(initialEvent.title);
                setType(initialEvent.resource?.type || 'PERSONAL');
                setStart(format(new Date(initialEvent.start), "yyyy-MM-dd'T'HH:mm"));
                setEnd(format(new Date(initialEvent.end), "yyyy-MM-dd'T'HH:mm"));
                setDescription(initialEvent.resource?.description || '');
            } else if (initialDate) {
                setTitle('');
                setType('PERSONAL');
                const s = new Date(initialDate);
                const e = addHours(s, 1);
                setStart(format(s, "yyyy-MM-dd'T'HH:mm"));
                setEnd(format(e, "yyyy-MM-dd'T'HH:mm"));
                setDescription('');
            }
        }
    }, [isOpen, initialEvent, initialDate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            id: initialEvent?.id,
            title,
            type,
            startTime: new Date(start).toISOString(),
            endTime: new Date(end).toISOString(),
            description
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-50 border-l border-slate-200 dark:border-slate-800 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {initialEvent ? 'Edit Event' : 'New Event'}
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Add title"
                                    className="w-full text-lg font-semibold border-b-2 border-slate-200 dark:border-slate-700 bg-transparent py-2 focus:border-indigo-500 outline-none transition-colors"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start</label>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <FiClock className="text-slate-400" />
                                        <input
                                            type="datetime-local"
                                            value={start}
                                            onChange={e => setStart(e.target.value)}
                                            className="bg-transparent text-sm font-medium outline-none w-full"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End</label>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <FiClock className="text-slate-400" />
                                        <input
                                            type="datetime-local"
                                            value={end}
                                            onChange={e => setEnd(e.target.value)}
                                            className="bg-transparent text-sm font-medium outline-none w-full"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {['PERSONAL', 'ACADEMIC', 'EXAM', 'STREAK', 'TODO'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${type === t
                                                ? 'bg-indigo-500 text-white shadow-md transform scale-105'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Add notes..."
                                        rows={4}
                                        className="w-full bg-transparent text-sm outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            {initialEvent ? (
                                <button
                                    type="button"
                                    onClick={() => onDelete(initialEvent.id)}
                                    className="flex items-center gap-2 text-red-500 hover:text-red-600 font-medium px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <FiTrash2 /> Delete
                                </button>
                            ) : (
                                <div></div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
                                >
                                    {initialEvent ? 'Save Changes' : 'Create Event'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const CustomToolbar = ({ label, onNavigate, onView, view }) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{label}</h2>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => onNavigate('PREV')} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"><FiChevronLeft /></button>
                    <button onClick={() => onNavigate('TODAY')} className="px-3 py-1 text-xs font-bold uppercase hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all mx-1">Today</button>
                    <button onClick={() => onNavigate('NEXT')} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all"><FiChevronRight /></button>
                </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                {['month', 'week', 'day', 'agenda'].map(v => (
                    <button
                        key={v}
                        onClick={() => onView(v)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${view === v
                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [unscheduledEvents, setUnscheduledEvents] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    // eslint-disable-next-line no-unused-vars
    const [draggedEvent, setDraggedEvent] = useState(null);
    const [quickAddText, setQuickAddText] = useState('');

    // Panel State
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Modal State
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        isDanger: false
    });

    useEffect(() => {
        fetchEvents();
        fetchUnscheduledEvents();
    }, [date, view]);

    const fetchEvents = async () => {
        const start = new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString();
        const end = new Date(date.getFullYear(), date.getMonth() + 2, 0).toISOString();

        try {
            const data = await calendarService.getEvents(start, end);
            const formattedEvents = data.map(e => ({
                id: e.id,
                title: e.title,
                start: new Date(e.startTime),
                end: new Date(e.endTime),
                allDay: e.allDay,
                resource: e
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const fetchUnscheduledEvents = async () => {
        try {
            const data = await calendarService.getUnscheduledEvents();
            setUnscheduledEvents(data);
        } catch (error) {
            console.error("Failed to fetch unscheduled events", error);
        }
    };

    const handleSelectSlot = ({ start }) => {
        setSelectedDate(start);
        setSelectedEvent(null);
        setIsPanelOpen(true);
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setSelectedDate(null);
        setIsPanelOpen(true);
    };

    const handleSaveEvent = async (eventData) => {
        try {
            if (eventData.id) {
                await calendarService.createEvent(eventData);
            } else {
                await calendarService.createEvent({ ...eventData, userId: 'current-user' });
            }
            setIsPanelOpen(false);
            fetchEvents();
            fetchUnscheduledEvents();
        } catch (error) {
            console.error("Failed to save event", error);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        setConfirmationModal({
            isOpen: true,
            title: "Delete Event",
            message: "Are you sure you want to delete this event?",
            isDanger: true,
            onConfirm: async () => {
                try {
                    await calendarService.deleteEvent(eventId);
                    setIsPanelOpen(false);
                    fetchEvents();
                } catch (error) {
                    console.error("Failed to delete event", error);
                }
            }
        });
    };

    const handleEventDrop = async ({ event, start, end }) => {
        const updatedEvent = {
            ...event.resource,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
        };
        try {
            await calendarService.createEvent(updatedEvent);
            fetchEvents();
        } catch (error) {
            console.error("Failed to move event", error);
        }
    };

    const handleEventResize = async ({ event, start, end }) => {
        const updatedEvent = {
            ...event.resource,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
        };
        try {
            await calendarService.createEvent(updatedEvent);
            fetchEvents();
        } catch (error) {
            console.error("Failed to resize event", error);
        }
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickAddText.trim()) return;

        const event = {
            title: quickAddText,
            type: 'TODO',
            userId: 'current-user'
        };
        try {
            await calendarService.createEvent(event);
            setQuickAddText('');
            fetchUnscheduledEvents();
        } catch (error) {
            console.error("Failed to quick add task", error);
        }
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#6366f1';
        // eslint-disable-next-line no-unused-vars
        let borderLeft = 'none';

        switch (event.resource.type) {
            case 'ACADEMIC': backgroundColor = '#10b981'; break;
            case 'EXAM': backgroundColor = '#ef4444'; break;
            case 'STREAK': backgroundColor = '#8b5cf6'; break;
            case 'TODO': backgroundColor = '#f59e0b'; break;
            default: backgroundColor = '#3b82f6';
        }

        return {
            style: {
                backgroundColor: `${backgroundColor}20`,
                color: backgroundColor,
                borderLeft: `4px solid ${backgroundColor}`,
                fontWeight: '600',
                borderRadius: '4px',
                border: 'none',
                display: 'block'
            }
        };
    };

    return (
        <div className="h-screen flex bg-white dark:bg-black text-slate-900 dark:text-white overflow-hidden">
            {/* Sidebar: Waiting List */}
            <div className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Waiting List</h2>
                        <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-600 dark:text-slate-400">{unscheduledEvents.length}</span>
                    </div>

                    <form onSubmit={handleQuickAdd} className="relative">
                        <input
                            type="text"
                            placeholder="Add a task..."
                            value={quickAddText}
                            onChange={(e) => setQuickAddText(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
                        />
                        <FiPlus className="absolute left-3 top-2.5 text-slate-400" />
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {unscheduledEvents.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            No unscheduled tasks.
                            <br />Great job! 🎉
                        </div>
                    ) : (
                        unscheduledEvents.map(event => (
                            <motion.div
                                layout
                                key={event.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', JSON.stringify(event));
                                    setDraggedEvent(event);
                                }}
                                onClick={() => handleSelectEvent({ ...event, start: new Date(), end: new Date() })}
                                className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                                <div className="flex items-start justify-between pl-2">
                                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                                </div>
                                <div className="mt-2 pl-2 flex items-center gap-2 text-xs text-slate-400">
                                    <FiClock size={12} />
                                    <span>Unscheduled</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Calendar */}
            <div className="flex-1 flex flex-col h-full relative">
                <div className="flex-1 p-6 overflow-hidden">
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        onEventDrop={handleEventDrop}
                        onEventResize={handleEventResize}
                        resizable
                        selectable
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}
                        components={{
                            toolbar: CustomToolbar
                        }}
                        eventPropGetter={eventStyleGetter}
                        className="modern-calendar"
                    />
                </div>
            </div>

            {/* Event Form Panel */}
            <EventFormPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                onSubmit={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialDate={selectedDate}
                initialEvent={selectedEvent}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
                isDanger={confirmationModal.isDanger}
            />
        </div>
    );
};

export default CalendarPage;
