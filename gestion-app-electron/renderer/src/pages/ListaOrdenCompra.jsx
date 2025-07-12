import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export default function ListaOrdenesCompra() {
  const [error, setError] = useState("");
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
  const completas = ordenes.filter((orden) => !tienePendientes(orden));

  return (
    <Container>
      <Title>Listado de Órdenes de Compra</Title>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!error && ordenes.length === 0 && (
        <LoadingMessage>Cargando órdenes o no hay registros.</LoadingMessage>
      )}

      {!error && ordenes.length > 0 && (
        <>
          <SubTitle>Órdenes con Artículos Pendientes</SubTitle>
          {pendientes.length > 0 ? (
            <Grid>
              {pendientes.map((orden) => (
                <Card key={orden.id}>
                  <LinkStyled to={`/orden-compra/${orden.id}`}>
                    <OrdenNombre>Orden #{orden.id}</OrdenNombre>
                    <Referencia>Codigo de referencia: {orden.codigo_ref}</Referencia>
                    <Fecha>Fecha: {orden.fecha}</Fecha>
                    <Proveedor>Proveedor: {orden.proveedor.razon_social}</Proveedor>
                  </LinkStyled>
                  <Descripcion>
                    {orden.articulos.map((a, index) => (
                      <div key={index}>
                        • Artículo #{a.articulo_id} — {a.cantidad_recibida} / {a.cantidad_pedida} recibidos
                      </div>
                    ))}
                  </Descripcion>
                </Card>
              ))}
            </Grid>
          ) : (
            <LoadingMessage>No hay órdenes pendientes.</LoadingMessage>
          )}

          <SubTitle>Órdenes Completamente Entregadas</SubTitle>
          {completas.length > 0 ? (
            <Grid>
              {completas.map((orden) => (
                <Card key={orden.id}>
                  <LinkStyled to={`/orden-compra/${orden.id}`}>
                    <OrdenNombre>Orden #{orden.id}</OrdenNombre>
                    <Referencia>Codigo de referencia: {orden.codigo_ref}</Referencia>
                    <Fecha>Fecha: {orden.fecha}</Fecha>
                    <Proveedor>Proveedor: {orden.proveedor.razon_social}</Proveedor>
                  </LinkStyled>
                  <Descripcion>
                    {orden.articulos.map((a, index) => (
                      <div key={index}>
                        • Artículo #{a.articulo_id} — {a.cantidad_recibida} / {a.cantidad_pedida} recibidos
                      </div>
                    ))}
                  </Descripcion>
                </Card>
              ))}
            </Grid>
          ) : (
            <LoadingMessage>No hay órdenes completadas.</LoadingMessage>
          )}
        </>
      )}

      <BackLink to="/home">← Volver atrás</BackLink>
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

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
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

const Referencia = styled.div`
  font-size: 0.95rem;
  color: #8e44ad;
  margin-bottom: 5px;
`;

const Fecha = styled.div`
  font-size: 0.95rem;
  color: #7f8c8d;
`;

const Proveedor = styled.div`
  font-size: 0.95rem;
  color: #34495e;
  margin-bottom: 10px;
`;

const Descripcion = styled.div`
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
