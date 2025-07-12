import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";

export default function OrdenCompraDetalle() {
  const { id } = useParams();
  const [orden, setOrden] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cantidadParcial, setCantidadParcial] = useState({});
  const [erroresPorArticulo, setErroresPorArticulo] = useState({});

  useEffect(() => {
    async function fetchOrden() {
      try {
        const response = await window.api.get(`/api/orden_compra/${id}`);
        if (response.error) {
          setError(response.error);
        } else {
          setOrden(response.data);
        }
      } catch {
        setError("Error al conectar con el backend.");
      }
    }
    fetchOrden();
  }, [id]);

  const modificarEntrega = async (item, tipo) => {
    setError("");
    setMensaje("");
    setErroresPorArticulo({});

    try {
      let response;
      if (tipo === "parcial") {
        const cantidad = parseInt(cantidadParcial[item.id_articulo] || 0);
        if (!cantidad || cantidad <= 0) {
          setErroresPorArticulo((prev) => ({
            ...prev,
            [item.id_articulo]: "Cantidad parcial inválida",
          }));
          return;
        }

        response = await window.api.post("/api/parcial_pendiente_compra", {
          entrega_parcial: {
            id_articulo_en_orden: item.id,
            id_articulo: item.id_articulo,
            entregado: cantidad,
          },
        });
      } else if (tipo === "total") {
        response = await window.api.post("/api/boton_pendiente_compra", {
          entrega: {
            id_articulo_orden: item.id,
          },
        });
      }

      if (response.error) {
        setErroresPorArticulo((prev) => ({
          ...prev,
          [item.id_articulo]: response.error,
        }));
      } else {
        setMensaje(response.message);
        const updated = await window.api.get(`/api/orden_compra/${id}`);
        setOrden(updated.data);
        setCantidadParcial({});
      }
    } catch {
      setErroresPorArticulo((prev) => ({
        ...prev,
        [item.id_articulo]: "Error inesperado al modificar entrega",
      }));
    }
  };

  const handleCantidadChange = (idArticulo, value) => {
    setCantidadParcial({ ...cantidadParcial, [idArticulo]: value });
  };

  if (error) return <MensajeError>{error}</MensajeError>;
  if (!orden)
    return (
      <Parrafo>
        Cargando orden de compra...
        <LinksWrapper>
          <StyledLink to="/lista-ordenes-compra">Volver a órdenes de compra</StyledLink>
        </LinksWrapper>
      </Parrafo>
    );

  return (
    <Container>
      {mensaje && <MensajeExito>{mensaje}</MensajeExito>}

      <Titulo>Orden de Compra #{orden.id}</Titulo>
      <Parrafo><strong>Codigo de referencia:</strong> {orden.codigo_ref || "-"}</Parrafo>
      <Parrafo><strong>Fecha:</strong> {orden.fecha || "-"}</Parrafo>
      <Parrafo><strong>Proveedor:</strong> {orden.proveedor?.razon_social || "-"}</Parrafo>

      <Subtitulo>Artículos de la orden</Subtitulo>
      {orden.articulos.length > 0 ? (
        <Tabla>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cant. Pedida</th>
              <th>Cant. Recibida</th>
              <th>Cant. a entregar</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orden.articulos.map((item) => {
              const completado = item.cantidad_pedida === item.cantidad_recibida;
              return (
                <tr key={item.id}>
                  <td>{item.nombre}</td>
                  <td>{item.cantidad_pedida}</td>
                  <td>{item.cantidad_recibida}</td>
                  {completado ? (
                    <>
                      <td>-</td>
                      <td><Completado>Completado</Completado></td>
                    </>
                  ) : (
                    <>
                      <td>
                        <div>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={cantidadParcial[item.id_articulo] || ""}
                            onChange={(e) => handleCantidadChange(item.id_articulo, e.target.value)}
                          />
                          {erroresPorArticulo[item.id_articulo] && (
                            <ErrorTexto>{erroresPorArticulo[item.id_articulo]}</ErrorTexto>
                          )}
                        </div>
                      </td>
                      <td>
                        <ButtonAzul onClick={() => modificarEntrega(item, "parcial")}>
                          Entrega Parcial
                        </ButtonAzul>
                        <ButtonVerde onClick={() => modificarEntrega(item, "total")}>
                          Entrega Total
                        </ButtonVerde>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Tabla>
      ) : (
        <Parrafo>No hay artículos en esta orden.</Parrafo>
      )}

      <LinksWrapper>
        <StyledLink to="/lista-ordenes-compra">Volver a órdenes de compra</StyledLink>
      </LinksWrapper>
    </Container>
  );
}

// ==== ESTILOS ====

const Container = styled.div`
  max-width: 850px;
  margin: 20px auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0,0,0,0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Titulo = styled.h1`
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
`;

const Subtitulo = styled.h2`
  font-size: 18px;
  margin-top: 30px;
  margin-bottom: 10px;
  border-bottom: 2px solid #357edd;
  padding-bottom: 5px;
  color: #34495e;
`;

const Parrafo = styled.p`
  font-size: 15px;
  margin: 6px 0;
  color: #333;
`;

const MensajeExito = styled.p`
  color: #2e7d32;
  font-weight: 600;
  text-align: center;
  margin-bottom: 15px;
  font-size: 15px;
  background-color: #e8f5e9;
  padding: 10px;
  border-radius: 6px;
  animation: fadeIn 0.4s ease-in-out;
`;

const MensajeError = styled(MensajeExito)`
  color: #c62828;
  background-color: #ffebee;
`;

const ErrorTexto = styled.div`
  color: #d32f2f;
  font-size: 13px;
  margin-top: 4px;
`;

const Completado = styled.span`
  color: #2e7d32;
  background-color: #e8f5e9;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 13px;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin-bottom: 25px;

  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #eef4ff;
    transition: background-color 0.2s ease;
  }

  th {
    background-color: #f0f4fa;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 2px solid #bbb;
  }
`;

const ButtonAzul = styled.button`
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 5px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0d47a1;
  }
`;

const ButtonVerde = styled.button`
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #1b5e20;
  }
`;

const LinksWrapper = styled.div`
  margin-top: 30px;
  text-align: center;
`;

const StyledLink = styled(Link)`
  color: #1976d2;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;

  &:hover {
    text-decoration: underline;
  }
`;

const Input = styled.input`
  width: 60px;
  padding: 4px 6px;
  font-size: 13px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border 0.2s ease;

  &:focus {
    border-color: #1976d2;
  }
`;
