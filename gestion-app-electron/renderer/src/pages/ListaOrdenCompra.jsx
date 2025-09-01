import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

export default function ListaOrdenesCompra() {
  const [error, setError] = useState("");
  const [ordenes, setOrdenes] = useState([]);
  const [filtro, setFiltro] = useState("");

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

  // Filtrado por referencia, proveedor o fecha
  const filtrarOrdenes = (ordenes) => {
    const filtroLower = filtro.toLowerCase();
    return ordenes.filter((orden) => {
      const referencia = (orden.codigo_ref || "").toLowerCase();
      const proveedor = (orden.proveedor?.razon_social || "").toLowerCase();
      const fecha = (orden.fecha || "").toLowerCase();
      return (
        referencia.includes(filtroLower) ||
        proveedor.includes(filtroLower) ||
        fecha.includes(filtroLower)
      );
    });
  };

  const tienePendientes = (orden) =>
    orden.articulos.some((a) => a.cantidad_recibida < a.cantidad_pedida);

  const pendientes = filtrarOrdenes(ordenes.filter(tienePendientes));
  const completas = filtrarOrdenes(ordenes.filter((orden) => !tienePendientes(orden)));

  const EstadoTag = ({ estado }) => {
    let colorBg = "#bbb";
    if (estado?.toLowerCase() === "terminado") colorBg = "#27ae60"; // verde
    else if (estado?.toLowerCase() === "pendiente") colorBg = "#7f8c8d"; // gris
    else if (estado?.toLowerCase() === "colocado") colorBg = "#2980b9"; // azul
    return <EstadoLabel style={{ backgroundColor: colorBg }}>{estado?.toUpperCase()}</EstadoLabel>;
  };

  const LogoProveedor = ({ proveedor }) => {
    if (proveedor?.logo_url) {
      return <LogoImg src={proveedor.logo_url} alt={proveedor.razon_social} />;
    }
    return <LogoPlaceholder>{proveedor?.razon_social?.charAt(0)}</LogoPlaceholder>;
  };

  const calcularPorcentaje = (orden) => {
    const totalPedidas = orden.articulos.reduce((acc, a) => acc + a.cantidad_pedida, 0);
    const totalRecibidas = orden.articulos.reduce((acc, a) => acc + a.cantidad_recibida, 0);
    return totalPedidas ? (totalRecibidas / totalPedidas) * 100 : 0;
  };

  const TablaOrdenes = ({ ordenes }) => (
    <Table>
      <thead>
        <tr>
          <Th>Referencia</Th>
          <Th>Descripción</Th>
          <Th>Proveedor</Th>
          <Th>Ref. Proveedor</Th>
          <Th>Pendientes</Th>
          <Th>Fecha</Th>
        </tr>
      </thead>
      <tbody>
        {ordenes.map((orden) => {
          const porcentaje = calcularPorcentaje(orden);
          const totalPedidas = orden.articulos.reduce((acc, a) => acc + a.cantidad_pedida, 0);
          const totalRecibidas = orden.articulos.reduce((acc, a) => acc + a.cantidad_recibida, 0);
          return (
            <tr key={orden.id}>
              <Td>
                <LinkTo to={`/orden-compra/${orden.id}`}>{orden.codigo_ref || orden.id}</LinkTo>
              </Td>
              <Td>{orden.descripcion || "-"}</Td>
              <Td>
                <ProveedorContainer>
                  <LogoProveedor proveedor={orden.proveedor} />
                  <ProveedorNombre>{orden.proveedor.razon_social}</ProveedorNombre>
                </ProveedorContainer>
              </Td>
              <Td>{orden.referencia_proveedor || "-"}</Td>
              <Td>
                <BarContainer>
                  <BarProgress style={{ width: `${porcentaje}%` }} />
                  <BarText>
                    {totalRecibidas} / {totalPedidas}
                  </BarText>
                </BarContainer>
              </Td>
              <Td>{orden.fecha || "-"}</Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );

  return (
    <Container>
      <Title>Listado de Órdenes de Compra</Title>

      <SearchInput
        type="text"
        placeholder="Buscar por referencia, proveedor o fecha..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {!error && ordenes.length === 0 && (
        <LoadingMessage>Cargando órdenes o no hay registros.</LoadingMessage>
      )}

      {!error && ordenes.length > 0 && (
        <>
          <SubTitle>Órdenes Pendientes</SubTitle>
          {pendientes.length > 0 ? (
            <TablaOrdenes ordenes={pendientes} />
          ) : (
            <LoadingMessage>No hay órdenes pendientes.</LoadingMessage>
          )}

          <SubTitle>Órdenes Culminadas</SubTitle>
          {completas.length > 0 ? (
            <TablaOrdenes ordenes={completas} />
          ) : (
            <LoadingMessage>No hay órdenes completadas.</LoadingMessage>
          )}
        </>
      )}
    </Container>
  );
}

// Styled Components
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
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #2980b9;
  padding-bottom: 5px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
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

const ProveedorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoImg = styled.img`
  width: 25px;
  height: 25px;
  object-fit: contain;
  border-radius: 3px;
`;

const LogoPlaceholder = styled.div`
  width: 25px;
  height: 25px;
  background-color: #bbb;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
`;

const ProveedorNombre = styled.span`
  font-weight: 600;
  color: #34495e;
`;

const BarContainer = styled.div`
  position: relative;
  background-color: #eee;
  border-radius: 10px;
  height: 14px;
  width: 100px;
  overflow: hidden;
`;

const BarProgress = styled.div`
  height: 100%;
  background-color: #27ae60;
  transition: width 0.3s ease;
`;

const BarText = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  line-height: 14px;
`;

const EstadoLabel = styled.span`
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
`;
