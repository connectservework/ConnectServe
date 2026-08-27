import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { CheckCircle, XCircle, Award, Clock, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const AttendanceModal = ({ isOpen, onClose, eventId, onUpdated }) => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await eventService.getEventApplicants(eventId);
      if (res.success && res.data) {
        setEvent(res.data.event);
        setRegistrations(res.data.registrations || []);
      }
    } catch (err) {
      toast.error('Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      fetchApplicants();
    }
  }, [isOpen, eventId]);

  const handleStatusChange = async (regId, newStatus) => {
    setProcessingId(regId);
    try {
      const res = await registrationService.updateStatus(regId, newStatus);
      if (res.success) {
        toast.success(`Application marked as ${newStatus}`);
        setRegistrations(prev =>
          prev.map(r => (r._id === regId ? { ...r, status: newStatus } : r))
        );
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleAttendance = async (reg) => {
    setProcessingId(reg._id);
    const willAttend = !reg.attended;
    try {
      const res = await registrationService.markAttendance(
        reg._id,
        willAttend,
        event.hoursGranted
      );
      if (res.success) {
        toast.success(
          willAttend
            ? `Attendance marked! ${event.hoursGranted} hrs & digital certificate awarded.`
            : 'Attendance unmarked.'
        );
        setRegistrations(prev =>
          prev.map(r =>
            r._id === reg._id
              ? {
                  ...r,
                  attended: willAttend,
                  status: willAttend ? 'attended' : 'approved',
                  certificateIssued: willAttend,
                }
              : r
          )
        );
        if (onUpdated) onUpdated();
      }
    } catch (err) {
      toast.error('Failed to mark attendance.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? `Manage Volunteers: ${event.title}` : 'Volunteer Management'}
      maxWidth="max-w-2xl"
    >
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Loading volunteer roster...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No volunteer applications received yet.
          </p>
          <p className="text-xs text-slate-500">
            When volunteers apply for this drive, they will appear here for approval and attendance logging.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total Applicants: {registrations.length}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {event.hoursGranted} Hours per attendee
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto pr-1">
            {registrations.map((reg) => {
              const isProcessing = processingId === reg._id;
              return (
                <div
                  key={reg._id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Volunteer info */}
                  <div className="flex items-center gap-3">
                    <Avatar src={reg.user?.avatar} size="md" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {reg.user?.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {reg.user?.email} • {reg.user?.volunteerHours || 0} lifetime hrs
                      </p>
                      {reg.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-0.5">
                          "{reg.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions according to status */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {reg.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(reg._id, 'approved')}
                          icon={CheckCircle}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isProcessing}
                          onClick={() => handleStatusChange(reg._id, 'rejected')}
                          icon={XCircle}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {(reg.status === 'approved' || reg.status === 'attended') && (
                      <Button
                        size="sm"
                        variant={reg.attended ? 'secondary' : 'primary'}
                        disabled={isProcessing}
                        onClick={() => handleToggleAttendance(reg)}
                        icon={reg.attended ? Award : CheckCircle}
                        className={reg.attended ? 'border border-emerald-500 text-emerald-700 dark:text-emerald-300' : ''}
                      >
                        {reg.attended ? 'Attended (Cert Issued ✓)' : 'Mark Attended & Issue Cert'}
                      </Button>
                    )}

                    {reg.status === 'rejected' && (
                      <span className="text-xs text-rose-500 font-semibold px-2 py-1 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
                        Application Rejected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};
