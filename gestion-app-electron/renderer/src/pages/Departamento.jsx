import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Departamento() {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
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

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {departamento && (
        <>
          <h1>
            Departamento {departamento.numero} - Piso {departamento.piso}
          </h1>

          <h2>Órdenes de Servicio</h2>
          {ordenes.length > 0 ? (
            <ul>
              {ordenes.map((o) => (
                <li key={o.id}>
                  <Link to={`/orden-servicio/${o.id}`}>{o.nombre} ({o.fecha})</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay órdenes de servicio.</p>
          )}

          <h2>Bienes Asignados</h2>
          {bienes.length > 0 ? (
            <ul>
              {bienes.map((b) => (
                <li key={b.id_identificado}>
                  {b.nombre_articulo} ({b.codigo}) - {b.nombre_orden}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay bienes asignados.</p>
          )}

          <Link to="/edificios">Volver atrás</Link>
        </>
      )}
    </div>
  );
}
