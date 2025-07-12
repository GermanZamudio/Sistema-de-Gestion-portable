import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { FaBoxOpen, FaClipboardList, FaFileAlt, FaPlusCircle, FaWarehouse, FaBuilding, FaTable } from "react-icons/fa";

const Home = () => {
  console.log("Home rendered");
  return (
    <Container>
      <Title>Panel de Gestión</Title>
      <Subtitle>Secciones del Sistema</Subtitle>
      <Grid>
        <GridItem to="/stock">
          <FaBoxOpen size={40} />
          <Label>Stock</Label>
        </GridItem>

        <GridItem to="/crear-compra">
          <FaPlusCircle size={40} />
          <Label>Crear Orden de Compra</Label>
        </GridItem>

        <GridItem to="/lista-orden-compra">
          <FaPlusCircle size={40} />
          <Label>Ordenes de Compra</Label>
        </GridItem>

        <GridItem to="/lista-ordenes-servicio">
          <FaClipboardList size={40} />
          <Label>Órdenes de Servicio</Label>
        </GridItem>

        <GridItem to="/crear-orden-servicio">
          <FaFileAlt size={40} />
          <Label>Crear Orden de Servicio</Label>
        </GridItem>

        <GridItem to="/articulos">
          <FaBoxOpen size={40} />
          <Label>Artículos</Label>
        </GridItem>

        <GridItem to="/edificios">
          <FaBuilding size={40} />
          <Label>Edificios</Label>
        </GridItem>

        <GridItem to="/tablas-auxiliares">
          <FaTable size={40} />
          <Label>Tablas auxiliares</Label>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default Home;

// Styled Components

const Container = styled.div`
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 10px;
  color: #2c3e50;
`;

const Subtitle = styled.h2`
  text-align: center;
  margin-bottom: 30px;
  font-weight: 400;
  color: #34495e;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
  gap: 20px;
`;

const GridItem = styled(Link)`
  background: #3498db;
  color: white;
  border-radius: 12px;
  padding: 25px 15px;
  text-align: center;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 10px rgba(52, 152, 219, 0.4);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background: #2980b9;
    box-shadow: 0 10px 15px rgba(41, 128, 185, 0.6);
  }

  svg {
    margin-bottom: 10px;
  }
`;

const Label = styled.span`
  font-weight: 600;
  font-size: 1rem;
`;
