import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { NavbarContext } from '../context/NavbarContext';
import { 
  FaBoxOpen,
  FaWarehouse,
  FaTools,
  FaHandHolding,
  FaListAlt,
  FaCouch,
  FaBoxes,
  FaPlusCircle,
  FaClipboardList,
  FaFileAlt,
  FaFileMedical,
  FaTags,
  FaBuilding,
  FaTable,
  FaChevronLeft,
  FaChevronRight,
  FaCar,
  FaFileContract,
  FaArchive             // 👈 NUEVO: ícono para Sobrantes
} from "react-icons/fa";

// Ícono de marca
const NotebookIcon = () => (
  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
    <path d="M19 2H9a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 18H9V4h10v16zM7 6H5v12h2V6z" />
  </svg>
);

export default function NavBar() {
  const { isOpen, toggleNavbar } = useContext(NavbarContext);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <Sidebar collapsed={collapsed}>
      <Brand collapsed={collapsed}>
        {!collapsed && <NotebookIcon />}
        {!collapsed && <span>Dep-Arq</span>}
      </Brand>
      <CollapseBtn onClick={toggleCollapse}>
        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </CollapseBtn>
      <Menu>
        <StyledLink to="/" collapsed={collapsed}><FaWarehouse/> {!collapsed && 'Home'}</StyledLink>
        <StyledLink to="/stock" collapsed={collapsed}><FaBoxOpen /> {!collapsed && 'Stock'}</StyledLink>
        <StyledLink to="/herramientas" collapsed={collapsed}><FaTools /> {!collapsed && 'Herramientas'}</StyledLink>
        <StyledLink to="/prestamo" collapsed={collapsed}><FaHandHolding /> {!collapsed && 'Prestar'}</StyledLink>
        <StyledLink to="/lista-prestamo" collapsed={collapsed}><FaListAlt /> {!collapsed && 'Préstamos'}</StyledLink>
        <StyledLink to="/bienes-uso" collapsed={collapsed}><FaCouch /> {!collapsed && 'Bienes de Uso'}</StyledLink>
        <StyledLink to="/bienes-consumo" collapsed={collapsed}><FaBoxes /> {!collapsed && 'Bienes de Consumo'}</StyledLink>
        <StyledLink to="/crear-compra" collapsed={collapsed}><FaPlusCircle /> {!collapsed && 'Crear Compra'}</StyledLink>
        <StyledLink to="/lista-orden-compra" collapsed={collapsed}><FaClipboardList /> {!collapsed && 'Órdenes Compra'}</StyledLink>
        <StyledLink to="/crear-orden-servicio" collapsed={collapsed}><FaFileMedical /> {!collapsed && 'Nueva Orden Servicio'}</StyledLink>
        <StyledLink to="/lista-ordenes-servicio" collapsed={collapsed}><FaFileAlt /> {!collapsed && 'Órdenes Servicio'}</StyledLink>
        <StyledLink to="/articulos" collapsed={collapsed}><FaTags /> {!collapsed && 'Artículos'}</StyledLink>
        <StyledLink to="/edificios" collapsed={collapsed}><FaBuilding /> {!collapsed && 'Edificios'}</StyledLink>
        <StyledLink to="/vehiculos" collapsed={collapsed}><FaCar /> {!collapsed && 'Vehículos'}</StyledLink>
        <StyledLink to="/sobrantes" collapsed={collapsed}><FaArchive /> {!collapsed && 'Sobrantes'}</StyledLink>
        <StyledLink to="/movimientos" collapsed={collapsed}><FaFileContract /> {!collapsed && 'Movimientos'}</StyledLink>
        <StyledLink to="/tablas-auxiliares" collapsed={collapsed}><FaTable /> {!collapsed && 'Tablas Auxiliares'}</StyledLink>
      </Menu>
    </Sidebar>
  );
}

// --- Estilos ---

const Sidebar = styled.nav`
  position: fixed;
  left: 0;
  top: 0;
  width: ${({ collapsed }) => (collapsed ? '60px' : '220px')};
  height: 100vh;
  background-color: #0d1117;
  border-right: 1px solid #30363d;
  color: #c9d1d9;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  z-index: 1000;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  font-family: 'SF Mono', Consolas, monospace;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 30px;
  color: #58a6ff;
  user-select: none;
  justify-content: ${({ collapsed }) => (collapsed ? 'center' : 'flex-start')};

  span {
    margin-left: 8px;
  }
`;

const Menu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
`;

const StyledLink = styled(NavLink)`
  color: #c9d1d9;
  text-decoration: none;
  font-size: 0.8rem;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: ${({ collapsed }) => (collapsed ? '0' : '12px')};
  justify-content: ${({ collapsed }) => (collapsed ? 'center' : 'flex-start')};
  transition: background 0.2s ease;

  svg {
    font-size: 1.1rem;
  }

  &:hover {
    background-color: #21262d;
  }

  &.active {
    background-color: #30363d;
    color: #58a6ff;
  }
`;

const CollapseBtn = styled.button`
  background: none;
  border: none;
  color: #c9d1d9;
  font-size: 1rem;
  cursor: pointer;
  margin-top: auto;
  align-self: center;
  transition: transform 0.3s ease;

  &:hover {
    color: #58a6ff;
  }
`;

