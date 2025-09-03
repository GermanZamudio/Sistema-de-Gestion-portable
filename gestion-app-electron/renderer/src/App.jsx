import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Stock from './pages/Stock';
import BienesUso from './pages/BienesUso';
import BienesIdentificados from './pages/BienesIdentificados';
import BienesConsumo from './pages/BienesConsumo';
import CrearLicitacionConsumo from './pages/CrearLicitacionConsumo';
import CrearLicitacionUso from './pages/CrearLicitacionUso';
import Herramientas from './pages/Herramientas';

import PrestamoStock from './pages/Prestamo';
import ListaPrestamo from './pages/ListaPrestamo';
import DetallePrestamo from './pages/DetallePrestamo';


import ListaOrdenCompra from './pages/ListaOrdenCompra';
import OrdenCompra from './pages/OrdenCompra';
import CrearCompra from './pages/CrearOrdenCompra';

import CrearCategoria from './pages/CrearCategoria';
import Articulos from './pages/Articulos';

import ListaOrdenesServicio from './pages/ListaOrdenesServicio';
import OrdenServicio from './pages/OrdenServicio';
import CrearOrdenServicio from './pages/CrearOrdenServicio';

import Edificios from './pages/Edificios';
import Vehiculos from './pages/Vehiculos';
import Departamento from './pages/Departamento';

import TablasAuxiliares from './pages/TablasAuxiliares';
import GlobalStyle from './context/GlobalStyle'; 

import { NavbarProvider } from './context/NavbarContext';
import NavBar from './components/NavBar';

function App() {
  return (
    
    <Router>
      {/* NavbarProvider envuelve para compartir estado */}
      <NavbarProvider>
        {/* Navbar visible en todas las rutas */}
        
      <GlobalStyle />
        <NavBar />

        {/* Rutas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" />} />

          <Route path="/stock" element={<Stock />} />
          <Route path="/bienes-uso" element={<BienesUso />} />
          <Route path="/bienes-identificados/:id" element={<BienesIdentificados />} />

          <Route path="/bienes-consumo" element={<BienesConsumo />} />

          <Route path="/herramientas" element={<Herramientas />} />
          
          <Route path="/prestamo" element={<PrestamoStock />} />
          <Route path="/lista-prestamo" element={<ListaPrestamo />} />
          <Route path="/detalle-prestamo/:id" element={<DetallePrestamo />} />


          <Route path="/crear-licitacion-consumo" element={<CrearLicitacionConsumo/>} />
          <Route path="/crear-licitacion-uso" element={<CrearLicitacionUso/>} />

          <Route path="/orden-compra/:id" element={<OrdenCompra />} />
          <Route path="/lista-orden-compra" element={<ListaOrdenCompra />} />
          <Route path="/crear-compra" element={<CrearCompra />} />

          <Route path="/crear-categoria" element={<CrearCategoria />} />
          <Route path="/articulos" element={<Articulos />} />

          <Route path="/lista-ordenes-servicio" element={<ListaOrdenesServicio />} />
          <Route path="/orden-servicio/:id" element={<OrdenServicio />} />
          <Route path="/crear-orden-servicio" element={<CrearOrdenServicio />} />

          <Route path="/vehiculos" element={<Vehiculos />} />

          <Route path="/edificios" element={<Edificios />} />
          <Route path="/departamento/:id" element={<Departamento />} />

          <Route path="/tablas-auxiliares" element={<TablasAuxiliares />} />
        </Routes>
      </NavbarProvider>
    </Router>
  );
}

export default App;
