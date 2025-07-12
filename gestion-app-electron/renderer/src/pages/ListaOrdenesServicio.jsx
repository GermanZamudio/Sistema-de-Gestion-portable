import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export default function ListaOrdenesServicio() {
  const [error, setError] = useState("");
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await window.api.get("/api/generico/orden_servicio");
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

  const ordenesActivas = data.filter((orden) => orden.estado === "ACTIVO");
  const ordenesCulminadas = data.filter((orden) => orden.estado === "CULMINADO");

  return (
    <Container>
      <Title>Listado de Órdenes de Servicio</Title>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!error && data.length === 0 && (
        <LoadingMessage>Cargando órdenes o no hay registros.</LoadingMessage>
      )}

      {!error && data.length > 0 && (
        <>
          <SubTitle>Órdenes Activas</SubTitle>
          {ordenesActivas.length > 0 ? (
            <Grid>
              {ordenesActivas.map((orden) => (
                <Card key={orden.id ?? orden.nombre}>
                  <LinkStyled to={`/orden-servicio/${orden.id}`}>
                    <OrdenNombre>{orden.nombre}</OrdenNombre>
                    <Estado>Estado: {orden.estado}</Estado>
                    <Fecha>Fecha: {orden.fecha}</Fecha>
                  </LinkStyled>
                  {orden.departamento_id ? (
                    <Departamento>
                      Departamento: {orden.departamento_numero} - Piso: {orden.departamento_piso}
                    </Departamento>
                  ) : (
                    <Departamento>Sin departamento asignado</Departamento>
                  )}
                  <Descripcion>{orden.descripcion}</Descripcion>
                </Card>
              ))}
            </Grid>
          ) : (
            <LoadingMessage>No hay órdenes activas.</LoadingMessage>
          )}

          <SubTitle>Órdenes Culminadas</SubTitle>
          {ordenesCulminadas.length > 0 ? (
            <Grid>
              {ordenesCulminadas.map((orden) => (
                <Card key={orden.id ?? orden.nombre}>
                  <LinkStyled to={`/orden-servicio/${orden.id}`}>
                    <OrdenNombre>{orden.nombre}</OrdenNombre>
                    <Estado>Estado: {orden.estado}</Estado>
                    <Fecha>Fecha: {orden.fecha}</Fecha>
                  </LinkStyled>
                  {orden.departamento_id ? (
                    <Departamento>
                      Departamento: {orden.departamento_numero} - Piso: {orden.departamento_piso}
                    </Departamento>
                  ) : (
                    <Departamento>Sin departamento asignado</Departamento>
                  )}
                  <Descripcion>{orden.descripcion}</Descripcion>
                </Card>
              ))}
            </Grid>
          ) : (
            <LoadingMessage>No hay órdenes culminadas.</LoadingMessage>
          )}
        </>
      )}

      <BackLink to="/home">Volver atrás</BackLink>
    </Container>
  );
}


// Styled components
const SubTitle = styled.h2`
  margin-top: 40px;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #2980b9;
  padding-bottom: 5px;
`;



const Container = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
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

const Descripcion = styled.p`
  font-size: 0.9rem;
  color: #2c3e50;
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
