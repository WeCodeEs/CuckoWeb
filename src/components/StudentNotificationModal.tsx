import React, { useCallback, useMemo, useRef, useState } from 'react';
import { X, Search, Users, Building2, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { supabase } from '../lib/supabase';
import { parseEdgeError } from '../stores/usuariosStore';
import type { Student } from '../stores/studentsStore';
import clsx from 'clsx';

type AudienceMode = 'all' | 'faculty' | 'manual' | 'incomplete';

const INCOMPLETE_FACULTIES = new Set(['Default', 'Sin escuela', '']);

function isIncomplete(s: Student): boolean {
  return !s.first_name.trim() || !s.last_name.trim() || !s.email.trim() || INCOMPLETE_FACULTIES.has(s.faculty);
}

interface Props {
  onClose: () => void;
  allStudents: Student[];
  faculties: string[];
  preselectedStudents?: Student[];
}

async function getAccessToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('No hay sesión activa');
  return session.access_token;
}

async function sendToAll(token: string, title: string, body: string) {
  const { data: response, error: invokeError } = await supabase.functions.invoke('send-notification', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { type: 'NotificacionGeneral', title, body },
  });
  if (invokeError) {
    const msg = await parseEdgeError(invokeError);
    throw new Error(msg || 'Error al invocar la función');
  }
  if (!response?.success) {
    throw new Error(response?.error?.message || 'No fue posible enviar el anuncio');
  }
  return response.data?.sentTo ?? 0;
}

async function sendToUser(token: string, userUuid: string, title: string, body: string) {
  const { data: response, error: invokeError } = await supabase.functions.invoke('send-notification', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { type: 'NotificacionPersonal', user_uuid: userUuid, title, body },
  });
  if (invokeError) {
    const msg = await parseEdgeError(invokeError);
    throw new Error(msg || 'Error al invocar la función');
  }
  return response?.success === true;
}

export default function StudentNotificationModal({
  onClose,
  allStudents,
  faculties,
  preselectedStudents,
}: Props) {
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(
    preselectedStudents && preselectedStudents.length > 0 ? 'manual' : 'all'
  );
  const [selectedFaculty, setSelectedFaculty] = useState(faculties[0] || '');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>(preselectedStudents || []);
  const [studentSearch, setStudentSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedIds = useMemo(
    () => new Set(selectedStudents.map((s) => s.id)),
    [selectedStudents]
  );

  const studentsForFaculty = useMemo(
    () => allStudents.filter((s) => s.faculty === selectedFaculty),
    [allStudents, selectedFaculty]
  );

  const incompleteStudents = useMemo(
    () => allStudents.filter(isIncomplete),
    [allStudents]
  );

  const searchResults = useMemo(() => {
    if (!studentSearch.trim()) return [];
    const q = studentSearch.toLowerCase();
    return allStudents
      .filter((s) => {
        if (selectedIds.has(s.id)) return false;
        const name = `${s.first_name} ${s.last_name}`.toLowerCase();
        return name.includes(q) || s.email.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [studentSearch, allStudents, selectedIds]);

  const addStudent = useCallback((student: Student) => {
    setSelectedStudents((prev) => {
      if (prev.some((s) => s.id === student.id)) return prev;
      return [...prev, student];
    });
    setStudentSearch('');
    setShowDropdown(false);
    searchInputRef.current?.focus();
  }, []);

  const removeStudent = useCallback((id: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const audienceSummary = useMemo(() => {
    switch (audienceMode) {
      case 'all':
        return `Se enviará a todos los alumnos registrados (${allStudents.length}).`;
      case 'faculty':
        return studentsForFaculty.length > 0
          ? `Se enviará a ${studentsForFaculty.length} alumno${studentsForFaculty.length === 1 ? '' : 's'} de ${selectedFaculty}.`
          : `No hay alumnos registrados en ${selectedFaculty}.`;
      case 'manual':
        return selectedStudents.length > 0
          ? `Se enviará a ${selectedStudents.length} alumno${selectedStudents.length === 1 ? '' : 's'} seleccionado${selectedStudents.length === 1 ? '' : 's'}.`
          : 'Busca y selecciona al menos un alumno.';
      case 'incomplete':
        return incompleteStudents.length > 0
          ? `Se enviará a ${incompleteStudents.length} alumno${incompleteStudents.length === 1 ? '' : 's'} con registro pendiente.`
          : 'No hay alumnos con registro pendiente.';
    }
  }, [audienceMode, allStudents.length, studentsForFaculty.length, selectedFaculty, selectedStudents.length]);

  const canSubmit = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (audienceMode === 'faculty' && studentsForFaculty.length === 0) return false;
    if (audienceMode === 'manual' && selectedStudents.length === 0) return false;
    if (audienceMode === 'incomplete' && incompleteStudents.length === 0) return false;
    return true;
  }, [title, body, audienceMode, studentsForFaculty.length, selectedStudents.length, incompleteStudents.length]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!canSubmit) return;
      setSubmitting(true);
      setProgress(null);

      try {
        const token = await getAccessToken();

        if (audienceMode === 'all') {
          const sentTo = await sendToAll(token, title.trim(), body.trim());
          let description: string;
          if (sentTo === 0) {
            description = 'El anuncio se procesó, pero no había dispositivos registrados para recibirlo.';
          } else {
            description = `El anuncio fue enviado a ${sentTo} dispositivo${sentTo === 1 ? '' : 's'}.`;
          }
          toast({
            title: 'Anuncio enviado',
            description,
            className: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
          });
        } else {
          const targets = audienceMode === 'faculty'
            ? studentsForFaculty
            : audienceMode === 'incomplete'
              ? incompleteStudents
              : selectedStudents;
          let succeeded = 0;
          let failed = 0;
          setProgress({ sent: 0, total: targets.length });

          for (let i = 0; i < targets.length; i++) {
            try {
              const ok = await sendToUser(token, targets[i].id, title.trim(), body.trim());
              if (ok) succeeded++;
              else failed++;
            } catch {
              failed++;
            }
            setProgress({ sent: i + 1, total: targets.length });
          }

          if (failed === 0) {
            toast({
              title: 'Notificación enviada',
              description: `Enviada exitosamente a ${succeeded} alumno${succeeded === 1 ? '' : 's'}.`,
              className: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Envío parcial',
              description: `Enviada a ${succeeded} de ${targets.length} alumnos. ${failed} no pudieron ser notificados.`,
            });
          }
        }

        onClose();
      } catch (err: any) {
        console.error('Error enviando notificación:', err);
        setError(err?.message || 'No se pudo enviar la notificación.');
        toast({
          variant: 'destructive',
          title: 'Error al enviar',
          description: err?.message || 'No se pudo enviar la notificación.',
        });
      } finally {
        setSubmitting(false);
        setProgress(null);
      }
    },
    [canSubmit, audienceMode, title, body, studentsForFaculty, selectedStudents, incompleteStudents, toast, onClose]
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-darkbg shrink-0">
          <h2 className="text-lg font-bold text-primary-dark dark:text-white">
            Nuevo Anuncio
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Audience selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destinatarios
              </label>
              <div className="grid grid-cols-4 gap-2">
                <AudienceButton
                  active={audienceMode === 'all'}
                  onClick={() => setAudienceMode('all')}
                  icon={<Users className="w-4 h-4" />}
                  label="Todos"
                />
                <AudienceButton
                  active={audienceMode === 'faculty'}
                  onClick={() => setAudienceMode('faculty')}
                  icon={<Building2 className="w-4 h-4" />}
                  label="Por Escuela"
                />
                <AudienceButton
                  active={audienceMode === 'manual'}
                  onClick={() => setAudienceMode('manual')}
                  icon={<UserCheck className="w-4 h-4" />}
                  label="Seleccionar"
                />
                <AudienceButton
                  active={audienceMode === 'incomplete'}
                  onClick={() => setAudienceMode('incomplete')}
                  icon={<UserX className="w-4 h-4" />}
                  label="Pendientes"
                  badge={incompleteStudents.length > 0 ? incompleteStudents.length : undefined}
                />
              </div>
            </div>

            {/* Faculty picker */}
            {audienceMode === 'faculty' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Escuela
                </label>
                <div className="relative">
                  <select
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                    className="w-full px-4 py-2 pr-8 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white appearance-none"
                  >
                    {faculties.map((f) => (
                      <option key={f} value={f}>
                        {f || 'Sin escuela'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Manual student picker */}
            {audienceMode === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buscar alumnos
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Escribe un nombre o correo..."
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>

                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-darkbg-lighter border border-gray-200 dark:border-darkbg rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addStudent(s)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-darkbg/50 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {`${s.first_name} ${s.last_name}`.trim()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {s.email}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                            {s.faculty || 'Sin escuela'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && studentSearch.trim() && searchResults.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-darkbg-lighter border border-gray-200 dark:border-darkbg rounded-lg shadow-lg p-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        No se encontraron alumnos
                      </p>
                    </div>
                  )}
                </div>

                {/* Selected chips */}
                {selectedStudents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedStudents.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium bg-primary/10 dark:bg-secondary/10 text-primary-dark dark:text-secondary"
                      >
                        {`${s.first_name} ${s.last_name}`.trim()}
                        <button
                          type="button"
                          onClick={() => removeStudent(s.id)}
                          className="p-0.5 rounded-full hover:bg-primary/20 dark:hover:bg-secondary/20 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-darkbg rounded-lg px-3 py-2">
              {audienceSummary}
            </p>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe el título del anuncio"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cuerpo del mensaje
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe el cuerpo del anuncio"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white resize-y"
                required
              />
            </div>

            {/* Progress bar */}
            {progress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Enviando...</span>
                  <span>{progress.sent} / {progress.total}</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-darkbg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary dark:bg-secondary rounded-full transition-all duration-300"
                    style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-darkbg shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-darkbg rounded-lg hover:bg-gray-200 dark:hover:bg-darkbg/80 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting || !canSubmit}
            >
              {submitting
                ? progress
                  ? `Enviando ${progress.sent}/${progress.total}...`
                  : 'Enviando...'
                : 'Enviar Anuncio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AudienceButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'relative flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-primary dark:bg-secondary text-white shadow-sm'
          : 'bg-gray-100 dark:bg-darkbg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-darkbg/80'
      )}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span
          className={clsx(
            'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold leading-none px-1',
            active
              ? 'bg-white text-primary dark:text-secondary'
              : 'bg-amber-500 text-white'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
