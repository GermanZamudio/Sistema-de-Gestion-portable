import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export default function ListaOrdenesServicio() {
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await window.api.get("/api/generico/orden_servicio");
        if (response?.error) {
          setError(response.error);
          setData([]);
        } else {
          setData(Array.isArray(response?.data) ? response.data : []);
          setError("");
        }
      } catch (err) {
        setError("Error al cargar las órdenes de servicio");
        setData([]);
      }
    }
    fetchData();
  }, []);

  // Helper: texto “ubicación” según tipo (edificio vs vehículo)
  const getUbicacionTexto = (orden) => {
    const ed = orden.edificio_nombre?.toUpperCase().trim();
    if (ed === "VEHICULO" || ed === "VEHÍCULO") {
      // edificio = VEHICULO → piso = marca, numero = patente
      const partes = [
        "Vehículo",
        orden.departamento_piso && `Marca: ${orden.departamento_piso}`,
        orden.departamento_numero && `Patente: ${orden.departamento_numero}`,
      ].filter(Boolean);
      return partes.length ? partes.join(" – ") : "Vehículo";
    }

    if (orden.edificio_nombre) {
      const partes = [
        orden.edificio_nombre,
        orden.departamento_piso && `Piso ${orden.departamento_piso}`,
        orden.departamento_numero && `Depto ${orden.departamento_numero}`,
      ].filter(Boolean);
      return partes.length ? partes.join(" – ") : orden.edificio_nombre;
    }

    return "Sin departamento";
  };

  // Filtra por nombre, fecha o el texto de ubicación (incluye marca/patente si es vehículo)
  const filtrarOrdenes = (ordenes) => {
    const filtroLower = filtro.toLowerCase();
    return ordenes.filter((orden) => {
      const nombre = orden.nombre?.toLowerCase() || "";
      const fecha = orden.fecha?.toLowerCase() || "";
      const ubicacionTexto = getUbicacionTexto(orden).toLowerCase();
      return (
        nombre.includes(filtroLower) ||
        fecha.includes(filtroLower) ||
        ubicacionTexto.includes(filtroLower)
      );
    });
  };

  const ordenesActivas = useMemo(
    () => filtrarOrdenes(data.filter((o) => o.estado === "ACTIVO")),
    [data, filtro]
  );
  const ordenesCulminadas = useMemo(
    () => filtrarOrdenes(data.filter((o) => o.estado === "CULMINADO")),
    [data, filtro]
  );

  const TablaOrdenes = ({ ordenes }) => (
    <Table>
      <thead>
        <tr>
          <Th>Nombre</Th>
          <Th>Departamento / Dispositivo</Th>
          <Th>Descripción</Th>
          <Th>Estado</Th>
          <Th>Fecha</Th>
        </tr>
      </thead>
      <tbody>
        {ordenes.map((orden) => (
          <tr key={orden.id ?? `${orden.nombre}-${orden.fecha}`}>
            <Td>
              <LinkTo to={`/orden-servicio/${orden.id}`}>{orden.nombre || "-"}</LinkTo>
            </Td>
            <Td title={getUbicacionTexto(orden)}>{getUbicacionTexto(orden)}</Td>
            <Td>{orden.descripcion || "-"}</Td>
            <Td>{orden.estado || "-"}</Td>
            <Td>{orden.fecha || "-"}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <Container>
      <Title>Listado de Órdenes de Servicio</Title>

      <SearchInput
        type="text"
        placeholder="Buscar por nombre, fecha, departamento, marca o patente..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!error && data.length === 0 && (
        <LoadingMessage>Cargando órdenes o no hay registros.</LoadingMessage>
      )}

      {!error && data.length > 0 && (
        <>
          <SubTitle>Órdenes Activas</SubTitle>
          {ordenesActivas.length > 0 ? (
            <TablaOrdenes ordenes={ordenesActivas} />
          ) : (
            <LoadingMessage>No hay órdenes activas.</LoadingMessage>
          )}

          <SubTitle>Órdenes Culminadas</SubTitle>
          {ordenesCulminadas.length > 0 ? (
            <TablaOrdenes ordenes={ordenesCulminadas} />
          ) : (
            <LoadingMessage>No hay órdenes culminadas.</LoadingMessage>
          )}
        </>
      )}

      <BackLink to="/home">Volver atrás</BackLink>
    </Container>
  );
}

/* ========== Styled Components ========== */
const Container = styled.div`
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.p`
  margin-bottom: 25px;
  color: #2c3e50;
  font-size: 1.5rem;
  text-align: center;
`;

const SubTitle = styled.p`
  margin-top: 40px;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.3rem;
  border-bottom: 2px solid #2980b9;
  padding-bottom: 5px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 480px;
  display: block;
  margin: 0 auto 30px;
  padding: 10px;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  border-radius: 8px;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  text-align: center;
  margin-bottom: 20px;
`;

const LoadingMessage = styled.p`
  text-align: center;
  color: #34495e;
  margin-bottom: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  color: #2c3e50;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px 10px;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
`;

const LinkTo = styled(Link)`
  color: #2980b9;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const BackLink = styled(Link)`
  display: block;
  margin: 30px auto;
  text-align: center;
  color: #2980b9;
  text-decoration: none;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;
