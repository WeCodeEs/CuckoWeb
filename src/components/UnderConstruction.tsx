import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
  pageName: string;
}

export default function UnderConstruction({ pageName }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
      <Construction className="w-16 h-16 text-accent mb-4" />
      <h2 className="text-2xl font-semibold text-primary-dark mb-2">
        {pageName} en Construcción
      </h2>
      <p className="text-gray-600">
        Estamos trabajando para traerte la mejor experiencia de gestión de cafetería.
      </p>
    </div>
  );
}