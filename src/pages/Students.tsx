import React, { useEffect, useState, useMemo } from 'react';
import { Megaphone, AlertCircle, Search } from 'lucide-react';
import { useStudentStore, Student } from '../stores/studentsStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import SkeletonTable from '../components/skeletons/SkeletonTable';
import GeneralNotificationModal from '../components/GeneralNotificationModal';
type SortOrder = 'recent' | 'oldest' | 'az' | 'za';

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
  const [isModalOpen, setIsModalOpen] = useState(false); // MODIFICADO: Estado para el modal

  useEffect(() => {
    fetchAlumnos();
  }, [fetchAlumnos]);

  // MODIFICADO: El handler ahora abre el modal
  const handleAnuncioClick = () => {
    setIsModalOpen(true);
  };

  const sortedAndFilteredStudents = useMemo(() => {
    const filtered = alumnos.filter(user => {
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
        case 'az':
          const nameA = `${a.first_name} ${a.last_name}`.toLocaleLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLocaleLowerCase();
          return nameA.localeCompare(nameB);
        case 'za':
          const nameA_za = `${a.first_name} ${a.last_name}`.toLocaleLowerCase();
          const nameB_za = `${b.first_name} ${b.last_name}`.toLocaleLowerCase();
          return nameB_za.localeCompare(nameA_za);
        default:
          return 0;
      }
    });

  }, [alumnos, searchTerm, facultyFilter, sortOrder]);

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
          {faculties.map(faculty => (
            <option key={faculty} value={faculty}>{faculty || 'Sin escuela'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={5} hasActions={false} />
      ) : (
        <div className="bg-white dark:bg-darkbg-lighter rounded-xl shadow-soft dark:shadow-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-darkbg">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-darkbg/50">
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
                {sortedAndFilteredStudents.map((user) => (
                  <tr 
                    key={user.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-darkbg/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {`${user.first_name} ${user.last_name}`.trim() || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        user.faculty
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                      )}>
                        {user.faculty || 'Sin escuela'} 
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-center">
                      {format(new Date(user.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </td>
                  </tr>
                ))}
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

      {isModalOpen && <GeneralNotificationModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}