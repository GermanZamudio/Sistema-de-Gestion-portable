import React, { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
`;

const Title = styled.h1`
  margin-bottom: 20px;
  text-align: center;
`;

const ButtonNew = styled.button`
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: #2980b9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #1f6391;
  }
`;

const ErrorText = styled.p`
  color: red;
  text-align: center;
`;

const BackLink = styled.a`
  display: block;
  margin-top: 30px;
  color: #2980b9;
  text-decoration: none;
  font-weight: 600;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

const Imagen = styled.img`
  width: 100px;
  height: auto;
  border-radius: 6px;
  object-fit: contain;
  border: 1px solid #ccc;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;

  th, td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
  }

  th {
    background-color: #2980b9;
    color: white;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
  }
`;

export default function StockInventario() {
  const [articulos, setArticulos] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchArticulos() {
      try {
        const response = await window.api.get("/api/inventario/existencias");
        if (response.error) {
          setError(response.error);
          setArticulos({});
        } else {
          setArticulos(response);
          setError("");
        }
      } catch (err) {
        setError("Error al cargar artículos");
        setArticulos({});
      }
    }
    fetchArticulos();
  }, []);

  return (
    <Container>
      <Title>Inventario de Stock</Title>

      {error && <ErrorText>{error}</ErrorText>}

      {Object.keys(articulos).length === 0 && !error && (
        <p>No hay artículos para mostrar.</p>
      )}

      {Object.keys(articulos).length > 0 && (
        <Tabla>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Ubicación</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(articulos).map(([nombre, info]) =>
              info.existencias.map((item, i) => (
                <tr key={`${nombre}-${item.existencia_id || i}`}>
                  <td>
                    <Imagen
                      src={
                        info.imagen ||
                        "https://via.placeholder.com/100?text=Sin+imagen"
                      }
                      alt={`Imagen de ${nombre}`}
                    />
                  </td>
                  <td>{nombre}</td>
                  <td>{info.descripcion || "Sin descripción"}</td>
                  <td>{item.ubicacion}</td>
                  <td>{item.cantidad}</td>
                </tr>
              ))
            )}
          </tbody>
        </Tabla>
      )}

      <BackLink href="/home">Volver atrás</BackLink>
    </Container>
  );
}
