import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export default function ModalArticle({ isOpen, title, onClose, setArticulos }) {
  const [data, setData] = useState({});
  const [formValues, setFormValues] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [tipoArticulo, setTipoArticulo] = useState('STOCK');

  const camposIgnorados = ['tipo_bien','identificable', 'licitacion_id'];

  useEffect(() => {
    async function fetchformArticulos() {
      const response = await window.api.get('/api/generico/form/articulo');
      if (response.error) setError(response.error);
      else setData(response);
    }
    fetchformArticulos();
  }, []);

  useEffect(() => {
    if (data.campos) {
      const resetVals = {};
      data.campos.forEach((campo) => {
        resetVals[campo] = '';
      });
      setFormValues(resetVals);
      setImageFile(null);
    }
  }, [data]);

  useEffect(() => {
    if (!isOpen && data.campos) {
      const valoresVacios = {};
      data.campos.forEach((campo) => {
        valoresVacios[campo] = '';
      });
      setFormValues(valoresVacios);
      setImageFile(null);
      setMensaje('');
      setError('');
    }
  }, [isOpen, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const datosAEnviar = {
      ...formValues,
      identificable: 0,
      tipo_bien: tipoArticulo,
      licitacion: null,
    };

    if (imageFile) {
      try {
        const base64 = await toBase64(imageFile);
        datosAEnviar.imagen = base64.split(',')[1];
      } catch {
        setError('Error al procesar la imagen');
        return;
      }
    }

    const respuesta = await window.api.post('/api/generico/articulo', datosAEnviar);

    if (respuesta.error) {
      setError('Error: ' + respuesta.error);
    } else {
      setMensaje('Artículo creado correctamente');
      const limpio = {};
      data.campos.forEach((campo) => (limpio[campo] = ''));
      setFormValues(limpio);
      setImageFile(null);

      const nuevaLista = await window.api.get('/api/generico/articulo');
      if (!nuevaLista.error) setArticulos(nuevaLista.data);

      onClose();
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const relacionesMap = {};
  data.relaciones?.forEach((rel) => {
    relacionesMap[`${rel.nombre}_id`] = rel;
  });

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>{title}</Title>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label htmlFor="tipoArticulo">Seleccionar tipo de artículo</label>
            <select
              id="tipoArticulo"
              value={tipoArticulo}
              onChange={(e) => setTipoArticulo(e.target.value)}
            >
              <option value="STOCK">STOCK</option>
              <option value="HERRAMIENTA">HERRAMIENTA</option>
            </select>
          </FormGroup>

          {data.campos &&
            data.campos.map((campo) => {
              if (camposIgnorados.includes(campo)) return null;

              if (campo === 'imagen') {
                return (
                  <FormGroup key={campo}>
                    <label htmlFor="imagen">Imagen</label>
                    <input
                      type="file"
                      name="imagen"
                      id="imagen"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    {imageFile && <small>Archivo: {imageFile.name}</small>}
                  </FormGroup>
                );
              }

              const relacion = relacionesMap[campo];

              return (
                <FormGroup key={campo}>
                  <label htmlFor={campo}>{campo.replace(/_/g, ' ')}</label>
                  {relacion ? (
                    <select name={campo} id={campo} value={formValues[campo] || ''} onChange={handleChange}>
                      <option value="">Seleccione una {relacion.nombre.replace('_', ' ')}</option>
                      {relacion.datos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item[relacion.labelField]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={campo}
                      name={campo}
                      placeholder={campo}
                      value={formValues[campo] || ''}
                      onChange={handleChange}
                      type={campo === 'precio' ? 'number' : 'text'}
                      step={campo === 'precio' ? '0.01' : undefined}
                      min={campo === 'precio' ? '0' : undefined}
                    />
                  )}
                </FormGroup>
              );
            })}

          <SubmitButton type="submit">Guardar</SubmitButton>
        </Form>

        {mensaje && <MensajeSuccess>{mensaje}</MensajeSuccess>}
        {error && <MensajeError>{error}</MensajeError>}
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
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.25);
`;

const CloseButton = styled.button`
  position: absolute;
  right: 16px;
  top: 14px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s ease;

  &:hover {
    color: #e74c3c;
  }
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 24px;
  font-weight: 700;
  font-size: 1.8rem;
  text-align: center;
  color: #2c3e50;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-weight: 600;
    color: #34495e;
    text-transform: capitalize;
  }

  input,
  select {
    padding: 10px 12px;
    border: 1.5px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease;

    &:focus {
      border-color: #2980b9;
      outline: none;
      box-shadow: 0 0 5px #2980b9aa;
    }
  }
`;

const SubmitButton = styled.button`
  background-color: #2980b9;
  border: none;
  color: white;
  padding: 14px 0;
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.25s ease;

  &:hover {
    background-color: #1f6391;
  }
`;

const MensajeSuccess = styled.p`
  margin-top: 20px;
  color: #27ae60;
  font-weight: 600;
  text-align: center;
`;

const MensajeError = styled.p`
  margin-top: 20px;
  color: #c0392b;
  font-weight: 600;
  text-align: center;
`;
