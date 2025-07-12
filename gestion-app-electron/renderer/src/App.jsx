import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Stock from './pages/Stock';
import BienesUso from './pages/BienesUso';
import BienesConsumo from './pages/BienesConsumo';

import ListaOrdenCompra from './pages/ListaOrdenCompra';
import OrdenCompra from './pages/OrdenCompra';
import IngresarCompra from './pages/IngresarOrdenCompra';
import CrearCompra from './pages/CrearOrdenCompra';


import CrearCategoria from './pages/CrearCategoria';
import Articulos from './pages/Articulos';


import ListaOrdenesServicio from './pages/ListaOrdenesServicio';
import OrdenServicio from './pages/OrdenServicio';
import CrearOrdenServicio from './pages/CrearOrdenServicio';

import Edificios from './pages/Edificios';
import Departamento from './pages/Departamento';

import TablasAuxiliares from './pages/TablasAuxiliares';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />

        <Route path="/stock" element={<Stock />} />
        <Route path="/bienes-uso" element={<BienesUso />} />
        <Route path="/bienes-consumo" element={<BienesConsumo />} />

        <Route path="/orden-compra/:id" element={<OrdenCompra />} />
        <Route path="/lista-orden-compra" element={<ListaOrdenCompra />} />
        <Route path="/ingresar-compra" element={<IngresarCompra />} />
        <Route path="/crear-compra" element={<CrearCompra />} />

        
        <Route path="/crear-categoria" element={<CrearCategoria />} />
        <Route path="/articulos" element={<Articulos />} />

        <Route path="/lista-ordenes-servicio" element={<ListaOrdenesServicio />} />
        <Route path="/orden-servicio/:id" element={<OrdenServicio />} />
        <Route path="/crear-orden-servicio" element={<CrearOrdenServicio />} />

        <Route path="/edificios" element={<Edificios />} />
        <Route path="/departamento/:id" element={<Departamento />} />

        
        <Route path="/tablas-auxiliares" element={<TablasAuxiliares />} />
      </Routes>
    </Router>
  );
}

export default App;
