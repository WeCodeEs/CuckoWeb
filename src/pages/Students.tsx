import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Megaphone, AlertCircle, Search, Bell } from 'lucide-react';
import { useStudentStore, Student } from '../stores/studentsStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import SkeletonTable from '../components/skeletons/SkeletonTable';
import StudentNotificationModal from '../components/StudentNotificationModal';

type SortOrder = 'recent' | 'oldest' | 'az' | 'za';

const getFacultyColors = (faculty: string | null) => {
  switch (faculty) {
    case 'Ingeniería':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'Negocios':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'Comunicación':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    case 'Medicina':
      return 'bg-blue-50 text-blue-900 dark:bg-gray-700 dark:text-gray-100';
    case 'Derecho':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300';
    case 'Psicología':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300';
    case 'Turismo':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    case 'Diseño':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'Sin escuela':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export default function Students() {
  const { 
    alumnos,
    faculties,
    loading,
    error,
    searchTerm,
    facultyFilter,
    fetchAlumnos,
    setSearchTerm,
    setFacultyFilter,
  } = useStudentStore();

  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [preselected, setPreselected] = useState<Student[]>([]);

  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

  const sortedAndFilteredStudents = useMemo(() => {
    const filtered = alumnos.filter(user => {
      if (user.email?.includes('@deleted.')) return false;

      const fullName = `${user.first_name} ${user.last_name}`;
      const matchesSearch = 
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFaculty = facultyFilter === 'Todos' || user.faculty === facultyFilter;
      
      return matchesSearch && matchesFaculty;
    });

    return filtered.sort((a: Student, b: Student) => {
      switch (sortOrder) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'az': {
          const nameA = `${a.first_name} ${a.last_name}`.toLocaleLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLocaleLowerCase();
          return nameA.localeCompare(nameB);
        }
        case 'za': {
          const nameA_za = `${a.first_name} ${a.last_name}`.toLocaleLowerCase();
          const nameB_za = `${b.first_name} ${b.last_name}`.toLocaleLowerCase();
          return nameB_za.localeCompare(nameA_za);
        }
        default:
          return 0;
      }
    });
  }, [alumnos, searchTerm, facultyFilter, sortOrder]);

  const visibleIds = useMemo(
    () => new Set(sortedAndFilteredStudents.map((s) => s.id)),
    [sortedAndFilteredStudents]
  );

  const allVisibleSelected = useMemo(
    () => sortedAndFilteredStudents.length > 0 && sortedAndFilteredStudents.every((s) => selectedIds.has(s.id)),
    [sortedAndFilteredStudents, selectedIds]
  );

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const id of visibleIds) next.delete(id);
        return next;
      } else {
        const next = new Set(prev);
        for (const id of visibleIds) next.add(id);
        return next;
      }
    });
  }, [allVisibleSelected, visibleIds]);

  const handleAnuncioClick = useCallback(() => {
    setPreselected([]);
    setIsModalOpen(true);
  }, []);

  const handleNotifySelected = useCallback(() => {
    const students = alumnos.filter((s) => selectedIds.has(s.id));
    setPreselected(students);
    setIsModalOpen(true);
  }, [alumnos, selectedIds]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setPreselected([]);
    setSelectedIds(new Set());
  }, []);

  const selectedCount = selectedIds.size;

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="bg-red-50 dark:bg-darkbg-lighter border border-red-100 dark:border-red-900 rounded-xl p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={() => fetchAlumnos()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark dark:text-white">Alumnos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Consulta la información de los alumnos registrados</p>
        </div>
        <button
          onClick={handleAnuncioClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-xl hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-secondary/20"
        >
          <Megaphone className="w-4 h-4" />
          Nuevo Anuncio
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white"
          />
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-2.5" />
        </div>
        
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white"
        >
          <option value="recent">Más recientes</option>
          <option value="oldest">Más antiguos</option>
          <option value="az">Ordenar A-Z</option>
          <option value="za">Ordenar Z-A</option>
        </select>
        
        <select
          value={facultyFilter}
          onChange={(e) => setFacultyFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkbg focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 focus:border-primary dark:focus:border-secondary bg-white dark:bg-darkbg-lighter text-gray-900 dark:text-white"
        >
          <option value="Todos">Todas las escuelas</option>
          {faculties.filter(f => f !== 'Default').map(faculty => (
            <option key={faculty} value={faculty}>{faculty || 'Sin escuela'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={6} hasActions={false} />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-darkbg/50">
                  <th className="px-4 py-4 text-center w-12">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Escuela
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg">
                {sortedAndFilteredStudents.map((user) => {
                  const isSelected = selectedIds.has(user.id);
                  return (
                    <tr 
                      key={user.id}
                      onClick={() => toggleOne(user.id)}
                      className={clsx(
                        'transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-primary/5 dark:bg-secondary/5'
                          : 'hover:bg-gray-50/50 dark:hover:bg-darkbg/50'
                      )}
                    >
                      <td className="px-4 py-4 text-center w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(user.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 dark:border-darkbg text-primary dark:text-secondary focus:ring-primary/20 dark:focus:ring-secondary/20 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {`${user.first_name} ${user.last_name}`.trim() || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {user.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getFacultyColors(user.faculty || 'Sin escuela')
                        )}>
                          {user.faculty || 'Sin escuela'} 
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                        {format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedAndFilteredStudents.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No hay alumnos que coincidan con los filtros</p>
            </div>
          )}
        </div>
      )}

      {/* Floating selection bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-darkbg-lighter rounded-xl shadow-xl dark:shadow-dark border border-gray-200 dark:border-darkbg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {selectedCount} alumno{selectedCount === 1 ? '' : 's'} seleccionado{selectedCount === 1 ? '' : 's'}
            </span>
            <button
              onClick={handleNotifySelected}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary dark:bg-secondary rounded-lg hover:bg-primary-dark dark:hover:bg-secondary/90 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Notificar Seleccionados
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <StudentNotificationModal
          onClose={handleModalClose}
          allStudents={alumnos}
          faculties={faculties}
          preselectedStudents={preselected.length > 0 ? preselected : undefined}
        />
      )}
    </div>
  );
}
