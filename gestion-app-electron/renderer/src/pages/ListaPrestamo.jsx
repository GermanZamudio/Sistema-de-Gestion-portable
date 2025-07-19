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
        setError("Error al cargar las órdenes de servicio");
      }
    }
    fetchData();
  }, []);

  const searchFilter = (orden) => {
    const q = search.toLowerCase();
    return (
      orden.nombre?.toLowerCase().includes(q) ||
      orden.estado?.toLowerCase().includes(q) ||
      orden.locacion?.toLowerCase().includes(q)
    );
  };

  const PrestamosActivas = data.filter(
    (orden) => orden.estado === "ACTIVO" && searchFilter(orden)
  );

  const PrestamosCulminados = data.filter(
    (orden) => orden.estado === "CULMINADO" && searchFilter(orden)
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
        <LoadingMessage>Cargando préstamos o no hay registros.</LoadingMessage>
      )}

      {!error && data.length > 0 && (
        <>
          <SubTitle>Préstamos Activos</SubTitle>
          {PrestamosActivas.length > 0 ? (
            <Grid>
              {PrestamosActivas.map((orden) => (
                <Card key={orden.id ?? orden.nombre}>
                  <LinkStyled to={`/detalle-prestamo/${orden.id}`}>
                    <OrdenNombre>{orden.nombre}</OrdenNombre>
                    <Estado>Estado: {orden.estado}</Estado>
                    <Fecha>Fecha: {orden.fecha}</Fecha>
                  </LinkStyled>
                  <Departamento>Locación: {orden.locacion}</Departamento>
                </Card>
              ))}
            </Grid>
          ) : (
            <LoadingMessage>No hay préstamos activos.</LoadingMessage>
          )}

          <SubTitle>Préstamos Culminados</SubTitle>
          {PrestamosCulminados.length > 0 ? (
            <Grid>
              {PrestamosCulminados.map((orden) => (
                <Card key={orden.id ?? orden.nombre}>
                  <LinkStyled to={`/detalle-prestamo/${orden.id}`}>
                    <OrdenNombre>{orden.nombre}</OrdenNombre>
                    <Estado>Estado: {orden.estado}</Estado>
                    <Fecha>Fecha: {orden.fecha}</Fecha>
                  </LinkStyled>
                  <Departamento>Locación: {orden.locacion}</Departamento>
                </Card>
              ))}
            </Grid>
          ) : (
            <LoadingMessage>No hay préstamos culminados.</LoadingMessage>
          )}
        </>
      )}

      <BackLink to="/home">Volver atrás</BackLink>
    </Container>
  );
}

// Styled components
const Container = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
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

const SubTitle = styled.h2`
  margin-top: 40px;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #2980b9;
  padding-bottom: 5px;
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

const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding-left: 0;
  list-style: none;
`;

const Card = styled.li`
  background: #ecf0f1;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(44, 62, 80, 0.1);
`;

const LinkStyled = styled(Link)`
  text-decoration: none;
  color: #2980b9;
  font-weight: 600;
  display: block;
  margin-bottom: 10px;

  &:hover {
    text-decoration: underline;
  }
`;

const OrdenNombre = styled.div`
  font-size: 1.2rem;
  margin-bottom: 5px;
`;

const Estado = styled.div`
  font-size: 0.95rem;
  color: #7f8c8d;
`;

const Fecha = styled.div`
  font-size: 0.9rem;
  color: #95a5a6;
`;

const Departamento = styled.div`
  font-size: 0.95rem;
  color: #34495e;
  margin-bottom: 10px;
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