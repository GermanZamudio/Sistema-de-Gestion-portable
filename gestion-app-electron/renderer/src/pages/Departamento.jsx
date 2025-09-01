import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";

// -------------------- ESTILOS -------------------- //
const PageContainer = styled.div`
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  color: #333;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const SubInfo = styled.p`
  font-size: 0.9rem;
  color: #777;
  margin-bottom: 2rem;
`;

const Section = styled.section`
  margin-bottom: 2.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
`;

const DataRow = styled.tr`
  border-top: 1px solid #eee;

  &:first-child {
    border-top: none;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 0;
  color: #666;
  font-weight: 500;
  width: 180px;
`;

const Td = styled.td`
  padding: 0.75rem 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 4px rgba(0,0,0,0.06);
`;

const THead = styled.thead`
  background-color: #fafafa;
  font-weight: 600;
`;

const TBody = styled.tbody``;

const TableRow = styled.tr`
  border-top: 1px solid #eee;
`;

const TableCell = styled.td`
  padding: 1rem;
  vertical-align: top;
  font-size: 0.95rem;
`;

const Tag = styled.span`
  background-color: ${({ status }) =>
    status === "Completado" ? "#d1fae5" :
    status === "En Proceso" ? "#fef3c7" : "#e5e7eb"};
  color: ${({ status }) =>
    status === "Completado" ? "#065f46" :
    status === "En Proceso" ? "#92400e" : "#374151"};
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
`;

const ButtonLink = styled(Link)`
  color: #007bff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const BackLink = styled(Link)`
  display: block;
  margin-top: 30px;
  color: #1a936f;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

// -------------------- COMPONENTE -------------------- //
export default function Departamento() {
  const [error, setError] = useState("");
  const [departamento, setDepartamento] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [bienes, setBienes] = useState([]);
  const { id } = useParams();

  useEffect(() => {
    async function fetchData() {
      const response = await window.api.get(`/api/edificios/departamento/${id}`);
      if (response.error) {
        setError(response.error);
      } else {
        setDepartamento(response.departamento);
        setOrdenes(response.ordenes);
        setBienes(response.bienesAsignados);
      }
    }
    fetchData();
  }, [id]);

  if (!departamento) return null;

  const esVehiculo = departamento?.edificio_nombre?.toUpperCase() === "VEHICULO";

  return (
    <PageContainer>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <Title>
        {esVehiculo ? "Vehículo" : "Departamento"} {departamento.piso} – ‘{departamento.numero}’
      </Title>

      <SubInfo>
        Estado: {departamento.estado} |
        {!esVehiculo && <>Superficie: {departamento.superficie} m² |</>}
        Ubicación: {departamento.ubicacion} |
        Responsable: {departamento.responsable}
      </SubInfo>

      <Section>
        <SectionTitle>Datos Centrales</SectionTitle>
        <DataTable>
          <tbody>
            <DataRow>
              <Th>Estado</Th>
              <Td>{departamento.estado}</Td>
            </DataRow>
            {!esVehiculo && (
              <DataRow>
                <Th>Superficie</Th>
                <Td>{departamento.superficie} m²</Td>
              </DataRow>
            )}
            <DataRow>
              <Th>Ubicación</Th>
              <Td>{departamento.ubicacion}</Td>
            </DataRow>
            <DataRow>
              <Th>Responsable</Th>
              <Td>{departamento.responsable}</Td>
            </DataRow>
          </tbody>
        </DataTable>
      </Section>

      <Section>
        <SectionTitle>Historial de Trabajos</SectionTitle>
        {ordenes.length > 0 ? (
          <Table>
            <THead>
              <tr>
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Materiales/Consumibles</TableCell>
                <TableCell>Acciones</TableCell>
              </tr>
            </THead>
            <TBody>
              {ordenes.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.fecha}</TableCell>
                  <TableCell>{o.nombre}</TableCell>
                  <TableCell><Tag status={o.estado}>{o.estado}</Tag></TableCell>
                  <TableCell>{o.materiales || "-"}</TableCell>
                  <TableCell><ButtonLink to={`/orden-servicio/${o.id}`}>Ver/Editar</ButtonLink></TableCell>
                </TableRow>
              ))}
            </TBody>
          </Table>
        ) : (
          <p>No hay órdenes de servicio.</p>
        )}
      </Section>

      <Section>
        <SectionTitle>Bienes de Uso</SectionTitle>
        {bienes.length > 0 ? (
          <Table>
            <THead>
              <tr>
                <TableCell>Nombre</TableCell>
                <TableCell>Marca</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </tr>
            </THead>
            <TBody>
              {bienes.map((b) => (
                <TableRow key={b.id_identificado}>
                  <TableCell>{b.nombre_articulo}</TableCell>
                  <TableCell>{b.marca || "-"}</TableCell>
                  <TableCell>{b.codigo}</TableCell>
                  <TableCell>{b.estado || "-"}</TableCell>
                  <TableCell><ButtonLink to={`/bien/${b.id_identificado}`}>Ver Detalles/Reasignar</ButtonLink></TableCell>
                </TableRow>
              ))}
            </TBody>
          </Table>
        ) : (
          <p>No hay bienes asignados.</p>
        )}
      </Section>

        {esVehiculo ? <BackLink to="/vehiculos">← Volver a Vehiculos</BackLink> : <BackLink to="/edificios">← Volver a Edificios</BackLink>} 
    </PageContainer>
  );
}
