import React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import {
  FaBoxOpen
} from "react-icons/fa";

const Home = () => {
  const [error, setError] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await window.api.get("/api/generico/prestamo");
        if (response.error) {
          setError(response.error);
        } else {
          setData(response.data);
        }
      } catch (err) {
        setError("Error al cargar las órdenes de servicio");
      }
    }
    fetchData();
  }, []);

  const PrestamosActivas = data.filter((orden) => orden.estado === "ACTIVO");
 const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    async function fetchOrdenesCompra() {
      try {
        const response = await window.api.get("/api/listar_orden_compra");
        if (response.error) {
          setError(response.error);
        } else {
          setOrdenes(response.data);
        }
      } catch (err) {
        setError("Error al cargar las órdenes de compra");
      }
    }
    fetchOrdenesCompra();
  }, []);

  const tienePendientes = (orden) => {
    return orden.articulos.some(
      (a) => a.cantidad_recibida < a.cantidad_pedida
    );
  };

  const pendientes = ordenes.filter(tienePendientes);

  return (
    <Container>
      <Title>Panel de Gestión</Title>
      <Subtitle>Secciones del Sistema</Subtitle>

      <TileGrid>
        <Tile to="/herramientas"><FaBoxOpen /><Label>Herramientas</Label></Tile>
        <Tile to="/bienes-uso"><FaBoxOpen /><Label>Bienes de Uso</Label></Tile>
        <Tile to="/bienes-consumo"><FaBoxOpen /><Label>Bienes de Consumo</Label></Tile>
        <Tile to="/stock"><FaBoxOpen /><Label>Stock</Label></Tile>
      </TileGrid>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && data.length === 0 && (
        <LoadingMessage>Cargando préstamos o no hay registros.</LoadingMessage>
      )}

      {!error && data.length > 0 && (
        <>
          <SubTitle>Préstamos Activos</SubTitle>
          {PrestamosActivas.length > 0 ? (
            <Table>
              <TableHeader>
                <Cell>Nombre</Cell>
                <Cell>Estado</Cell>
                <Cell>Fecha</Cell>
                <Cell>Locación</Cell>
              </TableHeader>
              <ScrollableTableBody>
                {PrestamosActivas.map((orden) => (
                  <LinkStyled to={`/detalle-prestamo/${orden.id}`}>
                  <TableRow key={orden.id ?? orden.nombre}>
                    <Cell>
                        {orden.nombre}
                    </Cell>
                    <Cell>{orden.estado}</Cell>
                    <Cell>{orden.fecha}</Cell>
                    <Cell>{orden.locacion}</Cell>
                  </TableRow>
                  </LinkStyled>
                ))}
              </ScrollableTableBody>
            </Table>
          ) : (
            <LoadingMessage>No hay préstamos activos.</LoadingMessage>
          )}
        </>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && data.length === 0 && (
        <LoadingMessage>Cargando órdenes o no hay registros.</LoadingMessage>
      )}

      {!error && data.length > 0 && (
        <>
          <SubTitle>Órdenes de Compra con Artículos Pendientes</SubTitle>
          {pendientes.length > 0 ? (
            <Table>
              <TableHeader>
                <Cell>Orden</Cell>
                <Cell>Fecha</Cell>
                <Cell>Codigo de referencia:</Cell>
                <Cell>Provedor</Cell>
              </TableHeader>
              <ScrollableTableBody>
                {pendientes.map((orden) => (
                  
                      <LinkStyled to={`/orden-compra/${orden.id}`}>
                  <TableRow key={orden.id ?? orden.nombre}>
                    <Cell>
                        {orden.id}
                    </Cell>
                    <Cell>{orden.fecha}</Cell>
                    <Cell>{orden.codigo_ref}</Cell>
                    <Cell>{orden.proveedor.razon_social}</Cell>
                  </TableRow>
                      </LinkStyled>
                ))}
              </ScrollableTableBody>
            </Table>
          ) : (
            <LoadingMessage>No hay órdenes activas.</LoadingMessage>
          )}
        </>
      )}
    </Container>
  );
};

export default Home;

// --- Estilos ---

const Container = styled.div`
  max-width: 900px;
  margin: 30px auto;
  padding: 0 24px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;


  /* Imagen de fondo */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("/fondo.jpg");
    background-size: cover;
    background-position: center;
    opacity: 0.2; /* Ajusta la opacidad */
    z-index: 0;
  }

  /* Contenido encima de la imagen */
  > * {
    position: relative;
    z-index: 1;
  }
`;

const Title = styled.p`
  text-align: center;
  font-size: 2rem;
  margin-bottom: 8px;
  color: #222;
`;

const Subtitle = styled.h2`
  text-align: center;
  font-size: 1.1rem;
  color: #666;
  font-weight: 400;
  margin-bottom: 24px;
`;

const SubTitle = styled.p`
  margin-top: 32px;
  margin-bottom: 16px;
  color: #2c3e50;
  border-bottom: 2px solid #2980b9;
  padding-bottom: 4px;
  font-weight: 500;
  font-size: 1rem;
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
`;

const Tile = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 20px 16px;
  text-decoration: none;
  color: #444;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  transition: all 0.2s ease;

  svg {
    font-size: 30px;
    margin-bottom: 8px;
    color: #4a90e2;
  }

  &:hover {
    transform: translateY(-3px);
    background: #f0f8ff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }
`;

const Label = styled.div`
  font-size: 1rem;
  text-align: center;
  color: #333;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  text-align: center;
  margin-bottom: 16px;
  font-size: 0.9rem;
`;

const LoadingMessage = styled.h1`
  text-align: center;
  color: #34495e;
  margin-bottom: 16px;
  font-size: 0.9rem;
`;

const LinkStyled = styled(Link)`
  text-decoration: none;
  color: #2980b9;
  font-weight: 600;
  font-size: 0.7rem;

  &:hover {
    text-decoration: underline;
  }
`;

// --- Tabla ---

const Table = styled.div`
  margin-top: 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.7rem;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #2980b9;
  color: white;
  font-weight: 600;
  padding: 8px 12px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: #fff;
  padding: 8px 12px;
  border-top: 1px solid #ddd;

  &:nth-child(even) {
    background: #f9f9f9;
  }
`;

const Cell = styled.div`
  padding: 2px 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const ScrollableTableBody = styled.div`
  max-height: 100px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #2980b9 #eee;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #eee;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #2980b9;
    border-radius: 3px;
  }
`;