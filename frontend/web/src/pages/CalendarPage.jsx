import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Clock, MapPin, MoreVertical, Trash2 } from 'lucide-react';
import { calendarService } from '../services/calendarService';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Setup localizer
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// Custom Toolbar Component
const CustomToolbar = ({ label, onNavigate, onView, view }) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 p-4 rounded-2xl glass-card">
            <h2 className="text-2xl font-serif font-medium text-primary mb-4 md:mb-0 first-letter:uppercase">{label}</h2>

            <div className="flex gap-4">
                <div className="flex bg-surface-800/50 rounded-lg p-1 border border-black/5 dark:border-white/10">
                    <button onClick={() => onNavigate('PREV')} className="px-3 py-1 text-sm font-medium hover:text-white text-secondary transition-colors">Prev</button>
                    <button onClick={() => onNavigate('TODAY')} className="px-3 py-1 text-sm font-medium hover:text-white text-primary transition-colors border-x border-white/10">Today</button>
                    <button onClick={() => onNavigate('NEXT')} className="px-3 py-1 text-sm font-medium hover:text-white text-secondary transition-colors">Next</button>
                </div>

                <div className="flex bg-surface-800/50 rounded-lg p-1 border border-black/5 dark:border-white/10">
                    {['month', 'week', 'day', 'agenda'].map(v => (
                        <button
                            key={v}
                            onClick={() => onView(v)}
                            className={`px-3 py-1 text-sm font-medium capitalize rounded-md transition-all ${view === v ? 'bg-white/10 text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // Modals & Interaction
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, onConfirm: () => { } });

    useEffect(() => {
        fetchEvents();
    }, [date, view]);

    const fetchEvents = async () => {
        // Broad fetch for now, optimize range later if needed
        const start = moment(date).startOf('month').subtract(1, 'week').toISOString();
        const end = moment(date).endOf('month').add(1, 'week').toISOString();
        try {
            const data = await calendarService.getEvents(start, end);
            // Convert strings to Date objects for RBC
            const formatted = data.map(e => ({
                ...e,
                start: new Date(e.startTime),
                end: new Date(e.endTime),
            }));
            setEvents(formatted);
        } catch (e) {
            console.error(e);
        }
    };

    const handleEventDrop = async ({ event, start, end }) => {
        const updated = { ...event, start, end, startTime: start.toISOString(), endTime: end.toISOString() };

        // Optimistic UI update
        setEvents(prev => prev.map(e => e.id === event.id ? updated : e));

        try {
            await calendarService.updateEvent(event.id, {
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });
        } catch (e) {
            console.error('Move failed', e);
            fetchEvents(); // Revert on failure
        }
    };

    const handleEventResize = async ({ event, start, end }) => {
        const updated = { ...event, start, end, startTime: start.toISOString(), endTime: end.toISOString() };
        setEvents(prev => prev.map(e => e.id === event.id ? updated : e));

        try {
            await calendarService.updateEvent(event.id, {
                startTime: start.toISOString(),
                endTime: end.toISOString()
            });
        } catch (e) { console.error('Resize failed', e); fetchEvents(); }
    };

    const handleSelectSlot = useCallback(
        ({ start, end }) => {
            const title = window.prompt('New Event Name');
            if (title) {
                const newEvent = {
                    title,
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    type: 'PERSONAL'
                };

                // Optimistic add (local only, real id needed)
                const mock = { ...newEvent, id: Math.random(), start, end };
                setEvents(prev => [...prev, mock]);

                calendarService.createEvent(newEvent).then(() => fetchEvents());
            }
        },
        []
    );

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        setConfirmationModal({
            isOpen: true,
            title: "Delete Event",
            message: "Are you sure?",
            isDanger: true,
            showCancel: true,
            confirmText: "Delete",
            onConfirm: async () => {
                try {
                    await calendarService.deleteEvent(selectedEvent.id);
                    setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
                    setShowEventModal(false);
                } catch (e) { console.error(e); }
            }
        });
    };

    // Custom CSS to override RBC default styles for the Dark/Glass Theme
    const darkThemeStyles = `
      .rbc-calendar {
         font-family: 'Inter', sans-serif;
         color: #e4e4e7;
      }
      .rbc-off-range-bg {
         background: transparent;
         opacity: 0.3;
      }
      .rbc-header {
         border-bottom: 1px solid rgba(255,255,255,0.1);
         padding: 12px 0;
         font-weight: 500;
         color: #a1a1aa;
         text-transform: uppercase;
         font-size: 0.75rem;
         letter-spacing: 0.1em;
      }
      .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
         border: 1px solid rgba(255,255,255,0.1);
         border-radius: 16px;
         background: rgba(255,255,255,0.02);
         backdrop-filter: blur(10px);
      }
      .rbc-day-bg + .rbc-day-bg {
         border-left: 1px solid rgba(255,255,255,0.05);
      }
      .rbc-month-row + .rbc-month-row {
          border-top: 1px solid rgba(255,255,255,0.05);
      }
      .rbc-date-cell {
         padding: 8px;
         font-size: 0.9rem;
         opacity: 0.8;
      }
      .rbc-today {
         background: rgba(var(--accent-blue-rgb), 0.1);
      }
      .rbc-event {
         background: rgba(74, 144, 226, 0.2);
         border: 1px solid rgba(74, 144, 226, 0.4);
         color: #fff;
         border-radius: 6px;
         font-size: 0.8rem;
         backdrop-filter: blur(4px);
      }
      .rbc-event:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.6);
      }
      .rbc-time-content, .rbc-time-header-content {
         border-left: 1px solid rgba(255,255,255,0.05);
      }
      .rbc-timeslot-group {
         border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .rbc-time-view .rbc-row {
          min-height: 20px;
      }
    `;

    return (
        <div className="h-screen bg-background text-primary p-6 md:p-8 overflow-hidden flex flex-col">
            <style>{darkThemeStyles}</style>

            <CustomToolbar
                label={moment(date).format('MMMM YYYY')}
                onNavigate={(action) => {
                    if (action === 'PREV') setDate(moment(date).subtract(1, view === 'agenda' ? 'month' : view === 'week' ? 'week' : 'day').toDate());
                    if (action === 'NEXT') setDate(moment(date).add(1, view === 'agenda' ? 'month' : view === 'week' ? 'week' : 'day').toDate());
                    if (action === 'TODAY') setDate(new Date());
                }}
                view={view}
                onView={setView}
            />

            <div className="flex-1 min-h-0 relative">
                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    date={date}
                    view={view}
                    onNavigate={setDate}
                    onView={setView}

                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    resizable

                    className="h-full pb-8"

                    components={{
                        toolbar: () => null // We used custom toolbar outside
                    }}
                />
            </div>

            {/* Event Detail Modal */}
            <AnimatePresence>
                {showEventModal && selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-medium text-primary">{selectedEvent.title}</h3>
                                <button onClick={() => setShowEventModal(false)}><X size={20} className="text-secondary" /></button>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-secondary text-sm">
                                    <Clock size={16} />
                                    <span>
                                        {moment(selectedEvent.start).format('MMM D, h:mm a')} - {moment(selectedEvent.end).format('h:mm a')}
                                    </span>
                                </div>
                                {selectedEvent.description && <p className="text-secondary/80 text-sm">{selectedEvent.description}</p>}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button onClick={handleDeleteEvent} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2">
                                    <Trash2 size={16} /> Delete
                                </button>
                                <button onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
                isDanger={confirmationModal.isDanger}
                showCancel={confirmationModal.showCancel}
                confirmText={confirmationModal.confirmText}
            />
        </div>
    );
}
