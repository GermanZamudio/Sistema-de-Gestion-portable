import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export default function ModalArtAsignado({ isOpen, title, onClose, setState, id, tipo }) {
  const [articulosDisponibles, setArticulosDisponibles] = useState([]);
  const [formValues, setFormValues] = useState({
    articulo_id: '',
    cantidad_asignada: '',    
    cantidad_entregada: ''    
  });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDatos() {
      const response = await window.api.get(`/api/form/agregar_items/`);
      if (response.error) {
        setError(response.error);
      } else {
        if (tipo === "articulo") setArticulosDisponibles(response.articulos || []);
        else if (tipo === "asignar_sobrante") setArticulosDisponibles(response.sobrantes || []);
        else if (tipo === "identificado") setArticulosDisponibles(response.identificados || []);
        else setArticulosDisponibles([]);
      }
    }
    if (isOpen) fetchDatos();
  }, [isOpen, tipo]);

  useEffect(() => {
    if (!isOpen) {
      setFormValues({
        articulo_id: '',
        cantidad_asignada: '',
        cantidad_entregada: ''
      });
      setMensaje('');
      setError('');
      setArticulosDisponibles([]);
    }
  }, [isOpen, tipo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const { articulo_id } = formValues;
    if (!articulo_id) {
      setError('Debe seleccionar un artículo válido.');
      return;
    }

    const art = articulosDisponibles.find(a => a.id === parseInt(articulo_id));
    if (!art) {
      setError('Artículo no encontrado.');
      return;
    }

    if (tipo === "articulo") {
      const disponible = parseInt(art.cantidad || 0);
      const asignada = parseInt(formValues.cantidad_asignada);
      const entregada = parseInt(formValues.cantidad_entregada);

      if (isNaN(asignada) || isNaN(entregada)) {
        setError("Las cantidades asignada y entregada deben ser números.");
        return;
      }
      if (asignada > disponible) {
        setError('No puede asignar más de lo disponible.');
        return;
      }
      if (entregada > asignada) {
        setError('La cantidad entregada no puede superar la asignada.');
        return;
      }

      const response = await window.api.post(`/api/form/agregar_items/articulo/${id}`, {
        articulo_id: parseInt(articulo_id),
        cantidad_asignada: asignada,
        cantidad_entregada: entregada,
      });

      if (response.error) {
        setError('Error: ' + response.error);
      } else {
        setMensaje('Artículo asignado correctamente');
        actualizarLista();
      }

    } else if (tipo === "asignar_sobrante") {
      const cantidad = parseInt(formValues.cantidad_asignada);

      if (isNaN(cantidad) || cantidad <= 0) {
        setError('La cantidad debe ser un número positivo.');
        return;
      }

      const disponible = parseInt(art.cantidad || 0);
      if (cantidad > disponible) {
        setError('No puede asignar más de lo disponible.');
        return;
      }

      const payload = { articulo_id: parseInt(articulo_id), cantidad };

      const response = await window.api.post(`/api/form/agregar_items/asignar_sobrante/${id}`, payload);

      if (response.error) {
        setError('Error: ' + response.error);
      } else {
        setMensaje('Sobrante asignado correctamente');
        actualizarLista();
      }

    } else if (tipo === "identificado") {
      const payload = { articulo_identificado_id: parseInt(articulo_id) };

      const response = await window.api.post(`/api/form/agregar_items/identificado/${id}`, payload);

      if (response.error) {
        setError('Error: ' + response.error);
      } else {
        setMensaje('Artículo identificado asignado correctamente');
        actualizarLista();
      }
    }
  };

  async function actualizarLista() {
    const nuevaLista = await window.api.get(`/api/orden_servicio/${id}`);
    if (nuevaLista) {
      
      if (tipo === "articulo" && Array.isArray(nuevaLista.articulos_asignados)) {
        setState(nuevaLista.articulos_asignados);
      } else if (tipo === "asignar_sobrante" && Array.isArray(nuevaLista.sobrantes_de_obra)) {
      } else if (tipo === "identificado" && Array.isArray(nuevaLista.articulos_asignados_identificados)) {
        console.log("ingrese a identificado")
        setState(nuevaLista);
        setState(nuevaLista.articulos_asignados_identificados);
      }
    }
    setFormValues({
      articulo_id: '',
      cantidad_asignada: '',
      cantidad_entregada: ''
    });
    setTimeout(() => onClose(), 600);
  }

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>{title}</Title>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Artículo</label>
            <select
              name="articulo_id"
              value={formValues.articulo_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un artículo</option>
              {articulosDisponibles.map((art, idx) => (
                <option key={idx} value={art.id}>
                  {tipo === "articulo" && `${art.nombre} - Cantidad disponible: ${art.cantidad}`}
                  {tipo === "asignar_sobrante" && `${art.nombre_articulo} - Cantidad sobrante: ${art.cantidad}`}
                  {tipo === "identificado" && `${art.nombre_articulo} - Código: ${art.codigo}`}
                </option>
              ))}
            </select>
          </FormGroup>

          {tipo === "articulo" && (
            <>
              <FormGroup>
                <label>Cantidad Asignada</label>
                <input
                  type="number"
                  name="cantidad_asignada"
                  value={formValues.cantidad_asignada}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </FormGroup>
              <FormGroup>
                <label>Cantidad Entregada</label>
                <input
                  type="number"
                  name="cantidad_entregada"
                  value={formValues.cantidad_entregada}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </FormGroup>
            </>
          )}

          {tipo === "asignar_sobrante" && (
            <FormGroup>
              <label>Cantidad</label>
              <input
                type="number"
                name="cantidad_asignada"
                value={formValues.cantidad_asignada}
                onChange={handleChange}
                required
                min="1"
              />
            </FormGroup>
          )}

          <SubmitButton type="submit">Guardar</SubmitButton>

          {mensaje && <MensajeSuccess>{mensaje}</MensajeSuccess>}
          {error && <MensajeError>{error}</MensajeError>}
        </Form>
      </ModalContainer>
    </Overlay>
  );
}

// Styled Components
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: #fff;
  padding: 30px 40px;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  right: 16px;
  top: 14px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
`;

const Title = styled.h2`
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;

  label {
    font-weight: bold;
  }

  select,
  input {
    padding: 10px;
    border-radius: 6px;
    border: 1.5px solid #ccc;
  }
`;

const SubmitButton = styled.button`
  background-color: #2980b9;
  border: none;
  color: white;
  padding: 14px 0;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: #1f6391;
  }
`;

const MensajeSuccess = styled.p`
  margin-top: 15px;
  color: green;
  text-align: center;
`;

const MensajeError = styled.p`
  margin-top: 15px;
  color: red;
  text-align: center;
`;
