import React, { createContext, useState } from 'react';

// Creamos el contexto
export const NavbarContext = createContext();

// Provider que envolverá tu app para compartir estado del navbar
export function NavbarProvider({ children }) {
  // Aquí podés definir estados que quieras compartir,
  // por ejemplo si el menú está abierto o cerrado (para mobile)
  const [menuOpen, setMenuOpen] = useState(false);

  // Función para toggle del menú
  const toggleMenu = () => setMenuOpen(prev => !prev);

  return (
    <NavbarContext.Provider value={{ menuOpen, toggleMenu }}>
      {children}
    </NavbarContext.Provider>
  );
}
