import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Overlay = styled.div.attrs(() => ({}))`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

export default function ModalDeleteOrden({ isOpen, title, onClose, id }) {
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [articulos, setArticulos] = useState([]);
  const [ubicacion, setUbicacion] = useState([]);
  const [seleccionUbicaciones, setSeleccionUbicaciones] = useState({});

  const handleUbicacionChange = (articuloId, ubicacionId) => {
    setSeleccionUbicaciones(prev => ({
      ...prev,
      [articuloId]: ubicacionId
    }));
  };

  const handleConfirm = async () => {
    try {
      const articulos_sobrantes = articulos.map(item => {
        const sobrante = item.cantidad_asignada - item.cantidad_entregada;
        return {
          articulo_id: item.articulo_id,
          cantidad: sobrante,
          ubicacion_id: seleccionUbicaciones[item.articulo_id] || null
        };
      });

      const response = await window.api.post(`/api/cerrar_orden_servicio/${id}`, {
        articulos_sobrantes
      });

      if (response?.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert("Orden cerrada exitosamente.");
        onClose();
        window.location.reload();
      }
    } catch (error) {
      alert("Error al cerrar la orden.");
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchForm = async () => {
      try {
        const response = await window.api.get(`/api/modal_cerrar_orden_servicio/${id}`);
        if (response.error) {
          setError(response.error);
        } else {
          setArticulos(response.articulos || []);
          setUbicacion(response.ubicaciones || []);
        }
      } catch {
        setError("Error al intentar traer el form");
      }
    };
    fetchForm();
  }, [id]);

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {mensaje && <p style={{ color: "green" }}>{mensaje}</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <h2>{title}</h2>
        <p>¿Estás seguro que querés cerrar la orden?</p>

        {articulos.length > 0 ? (
          articulos.map((item) => {
            const sobrante = item.cantidad_asignada - item.cantidad_entregada;
            return (
              <div key={item.articulo_id}>
                <p><strong>{item.nombre}</strong></p>
                <p>Asignado: {item.cantidad_asignada}</p>
                <p>Entregado: {item.cantidad_entregada}</p>
                <p>Sobrarán: {sobrante}</p>
                <label>Selecciona la ubicación a guardar:</label>
                <select
                  value={seleccionUbicaciones[item.articulo_id] || ""}
                  onChange={(e) =>
                    handleUbicacionChange(item.articulo_id, parseInt(e.target.value))
                  }
                >
                  <option value="">Seleccione una ubicación</option>
                  {ubicacion.map((ubi) => (
                    <option key={ubi.id} value={ubi.id}>{ubi.nombre}</option>
                  ))}
                </select>
              </div>
            );
          })
        ) : (
          <p>No se generarán artículos sobrantes.</p>
        )}

        <button onClick={onClose}>Cancelar</button>
        <button onClick={handleConfirm}>Confirmar</button>
      </ModalContent>
    </Overlay>
  );
}
