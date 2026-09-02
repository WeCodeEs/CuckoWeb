import React, { useCallback, useMemo, useRef, useState } from 'react';
import { X, Search, Users, Building2, UserCheck, UserX, ChevronDown, Sparkles } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { supabase } from '../lib/supabase';
import { parseEdgeError } from '../stores/usuariosStore';
import type { Student } from '../stores/studentsStore';
import clsx from 'clsx';

type AudienceMode = 'all' | 'faculty' | 'manual' | 'incomplete';

const INCOMPLETE_FACULTIES = new Set(['Default', 'Sin escuela', '']);

function isDeletedAccount(s: Student): boolean {
  return s.email.includes('@deleted.') || s.first_name === 'User Deleted';
}

function isIncomplete(s: Student): boolean {
  if (isDeletedAccount(s)) return false;
  return !s.first_name.trim() || !s.last_name.trim() || !s.email.trim() || INCOMPLETE_FACULTIES.has(s.faculty);
}

const VARIABLE_TOKEN = '{{nombre}}';

function personalize(template: string, student: Student): string {
  return template.replaceAll(VARIABLE_TOKEN, student.first_name.trim() || student.last_name.trim() || 'Alumno');
}

function hasVariables(text: string): boolean {
  return text.includes(VARIABLE_TOKEN);
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

async function sendGeneralNotification(
  token: string,
  title: string,
  body: string,
  userUuids?: string[],
): Promise<{ sentTo: number; failed: number }> {
  const payload: Record<string, unknown> = {
    type: 'NotificacionGeneral',
    title,
    body,
  };
  if (userUuids && userUuids.length > 0) {
    payload.user_uuids = userUuids;
  }
  const { data: response, error: invokeError } = await supabase.functions.invoke('send-notification', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
  if (invokeError) {
    const msg = await parseEdgeError(invokeError);
    throw new Error(msg || 'Error al invocar la función');
  }
  if (!response?.success) {
    throw new Error(response?.error?.message || 'No fue posible enviar el anuncio');
  }
  return {
    sentTo: response.data?.sentTo ?? 0,
    failed: response.data?.failed ?? 0,
  };
}

async function sendBulkPersonalized(
  token: string,
  messages: { user_uuid: string; title: string; body: string }[],
): Promise<{ sentTo: number; failed: number }> {
  const { data: response, error: invokeError } = await supabase.functions.invoke('send-notification', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { type: 'NotificacionMasiva', messages },
  });
  if (invokeError) {
    const msg = await parseEdgeError(invokeError);
    throw new Error(msg || 'Error al invocar la función');
  }
  if (!response?.success) {
    throw new Error(response?.error?.message || 'No fue posible enviar las notificaciones');
  }
  return {
    sentTo: response.data?.sentTo ?? 0,
    failed: response.data?.failed ?? 0,
  };
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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastFocusedField, setLastFocusedField] = useState<'title' | 'body'>('body');

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

      try {
        const token = await getAccessToken();
        const trimmedTitle = title.trim();
        const trimmedBody = body.trim();
        const usesPersonalization = hasVariables(trimmedTitle) || hasVariables(trimmedBody);

        const targets = audienceMode === 'all'
          ? allStudents
          : audienceMode === 'faculty'
            ? studentsForFaculty
            : audienceMode === 'incomplete'
              ? incompleteStudents
              : selectedStudents;

        let sentTo = 0;
        let failed = 0;

        if (usesPersonalization) {
          const messages = targets.map((student) => ({
            user_uuid: student.id,
            title: personalize(trimmedTitle, student),
            body: personalize(trimmedBody, student),
          }));
          ({ sentTo, failed } = await sendBulkPersonalized(token, messages));
        } else if (audienceMode === 'all') {
          ({ sentTo, failed } = await sendGeneralNotification(token, trimmedTitle, trimmedBody));
        } else {
          const userUuids = targets.map((s) => s.id);
          ({ sentTo, failed } = await sendGeneralNotification(token, trimmedTitle, trimmedBody, userUuids));
        }

        if (sentTo === 0 && failed === 0) {
          toast({
            title: 'Anuncio procesado',
            description: 'El anuncio se procesó, pero no había dispositivos registrados para recibirlo.',
            className: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
          });
        } else if (failed === 0) {
          toast({
            title: 'Anuncio enviado',
            description: `Enviado exitosamente a ${sentTo} dispositivo${sentTo === 1 ? '' : 's'}.`,
            className: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Envío parcial',
            description: `Se enviaron ${sentTo} de ${sentTo + failed} notificaciones. ${failed} no pudieron ser entregadas.`,
          });
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
      }
    },
    [canSubmit, audienceMode, title, body, allStudents, studentsForFaculty, selectedStudents, incompleteStudents, toast, onClose]
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
              <div className="grid grid-cols-2 gap-2">
                <AudienceButton
                  active={audienceMode === 'all'}
                  onClick={() => setAudienceMode('all')}
                  icon={<Users className="w-4 h-4" />}
                  label="Todos"
                  description={`${allStudents.length} alumnos`}
                />
                <AudienceButton
                  active={audienceMode === 'faculty'}
                  onClick={() => setAudienceMode('faculty')}
                  icon={<Building2 className="w-4 h-4" />}
                  label="Por Escuela"
                  description="Filtrar por escuela"
                />
                <AudienceButton
                  active={audienceMode === 'manual'}
                  onClick={() => setAudienceMode('manual')}
                  icon={<UserCheck className="w-4 h-4" />}
                  label="Seleccionar"
                  description="Elegir manualmente"
                />
                <AudienceButton
                  active={audienceMode === 'incomplete'}
                  onClick={() => setAudienceMode('incomplete')}
                  icon={<UserX className="w-4 h-4" />}
                  label="Pendientes"
                  description="Registro incompleto"
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
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setLastFocusedField('title')}
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
                ref={bodyTextareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onFocus={() => setLastFocusedField('body')}
                placeholder="Escribe el cuerpo del anuncio"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg text-gray-900 dark:text-white resize-y"
                required
              />
            </div>

            {/* Personalization chip */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Personalización:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (lastFocusedField === 'title') {
                      const el = titleInputRef.current;
                      if (el) {
                        const start = el.selectionStart ?? title.length;
                        const end = el.selectionEnd ?? title.length;
                        setTitle(title.slice(0, start) + VARIABLE_TOKEN + title.slice(end));
                        requestAnimationFrame(() => {
                          const pos = start + VARIABLE_TOKEN.length;
                          el.setSelectionRange(pos, pos);
                          el.focus();
                        });
                      }
                    } else {
                      const el = bodyTextareaRef.current;
                      if (el) {
                        const start = el.selectionStart ?? body.length;
                        const end = el.selectionEnd ?? body.length;
                        setBody(body.slice(0, start) + VARIABLE_TOKEN + body.slice(end));
                        requestAnimationFrame(() => {
                          const pos = start + VARIABLE_TOKEN.length;
                          el.setSelectionRange(pos, pos);
                          el.focus();
                        });
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  {'{'}{'{'} nombre {'}'}{'}'}
                </button>
              </div>
              {(hasVariables(title) || hasVariables(body)) && allStudents.length > 0 && (
                <div className="bg-gray-50 dark:bg-darkbg rounded-lg px-3 py-2 border border-dashed border-gray-200 dark:border-gray-700">
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-0.5">Vista previa:</p>
                  {hasVariables(title) && (
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {personalize(title, allStudents[0])}
                    </p>
                  )}
                  {hasVariables(body) && (
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {personalize(body, allStudents[0])}
                    </p>
                  )}
                </div>
              )}
            </div>

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
              {submitting ? 'Enviando...' : 'Enviar Anuncio'}
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
  description,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all border',
        active
          ? 'bg-primary/5 dark:bg-secondary/10 border-primary dark:border-secondary ring-1 ring-primary/20 dark:ring-secondary/20'
          : 'bg-white dark:bg-darkbg border-gray-200 dark:border-darkbg hover:border-gray-300 dark:hover:border-gray-600'
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
          active
            ? 'bg-primary dark:bg-secondary text-white'
            : 'bg-gray-100 dark:bg-darkbg-lighter text-gray-500 dark:text-gray-400'
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={clsx(
            'text-sm font-semibold leading-tight',
            active
              ? 'text-primary-dark dark:text-white'
              : 'text-gray-700 dark:text-gray-200'
          )}
        >
          {label}
        </p>
        {description && (
          <p
            className={clsx(
              'text-[11px] leading-tight mt-0.5',
              active
                ? 'text-primary/70 dark:text-secondary/70'
                : 'text-gray-400 dark:text-gray-500'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {badge !== undefined && (
        <span
          className={clsx(
            'absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-bold leading-none px-1 shadow-sm',
            active
              ? 'bg-primary dark:bg-secondary text-white'
              : 'bg-amber-500 text-white'
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
