import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export default function ListaPrestamo() {
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

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
        setError("Error al cargar los préstamos");
      }
    }
    fetchData();
  }, []);

  const searchFilter = (prestamo) => {
    const q = search.toLowerCase();
    return (
      prestamo.nombre?.toLowerCase().includes(q) ||
      prestamo.estado?.toLowerCase().includes(q) ||
      prestamo.locacion?.toLowerCase().includes(q)
    );
  };

  const PrestamosActivos = data.filter(
    (p) => p.estado === "ACTIVO" && searchFilter(p)
  );

  const PrestamosCulminados = data.filter(
    (p) => p.estado === "CULMINADO" && searchFilter(p)
  );

  return (
    <Container>
      <Title>Listado de Préstamos</Title>

      <SearchInput
        type="text"
        placeholder="Buscar por nombre, estado o locación..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!error && data.length === 0 && (
        <LoadingMessage>No hay préstamos para mostrar.</LoadingMessage>
      )}

      {/* === Préstamos Activos === */}
      <SubTitle>Préstamos Activos</SubTitle>
      {PrestamosActivos.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <Th>Razón</Th>
              <Th>Locación</Th>
              <Th>Fecha</Th>
              <Th>Detalle</Th>
            </tr>
          </thead>
          <tbody>
            {PrestamosActivos.map((p) => (
              <tr key={p.id}>
                <Td>{p.nombre}</Td>
                <Td>{p.locacion}</Td>
                <Td>{p.fecha}</Td>
                <Td>
                  <LinkStyled to={`/detalle-prestamo/${p.id}`}>Ver</LinkStyled>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <LoadingMessage>No hay préstamos activos.</LoadingMessage>
      )}

      {/* === Préstamos Culminados === */}
      <SubTitle>Préstamos Culminados</SubTitle>
      {PrestamosCulminados.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <Th>Razón</Th>
              <Th>Locación</Th>
              <Th>Fecha</Th>
              <Th>Detalle</Th>
            </tr>
          </thead>
          <tbody>
            {PrestamosCulminados.map((p) => (
              <tr key={p.id}>
                <Td>{p.nombre}</Td>
                <Td>{p.locacion}</Td>
                <Td>{p.fecha}</Td>
                <Td>
                  <LinkStyled to={`/detalle-prestamo/${p.id}`}>Ver</LinkStyled>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <LoadingMessage>No hay préstamos culminados.</LoadingMessage>
      )}

      <BackLink to="/home">Volver atrás</BackLink>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.p`
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  margin-bottom: 30px;
  border: 1px solid #ccc;
  border-radius: 8px;
  outline: none;

  &:focus {
    border-color: #2980b9;
    box-shadow: 0 0 0 2px rgba(41, 128, 185, 0.2);
  }
`;

const SubTitle = styled.p`
  font-size: 1.2rem;
  margin-top: 40px;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #2980b9;
  padding-bottom: 5px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  background-color: #2980b9;
  color: white;
  font-weight: 600;
  border-bottom: 2px solid #1c5980;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  color: #34495e;
`;

const LinkStyled = styled(Link)`
  color: #2980b9;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
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
