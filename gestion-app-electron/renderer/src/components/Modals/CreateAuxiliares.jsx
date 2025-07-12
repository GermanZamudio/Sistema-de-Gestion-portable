import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export default function Modal({ isOpen, title, onClose, setState, url, campos_auto = {}, campo_ignorado = [] }) {
  const [data, setData] = useState({});
  const [formValues, setFormValues] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const camposIgnorados = Array.isArray(campo_ignorado) ? campo_ignorado : [campo_ignorado];

  useEffect(() => {
    async function fetchform() {
      const response = await window.api.get(`/api/generico/form/${url}`);
      if (response.error) {
        setError(response.error);
      } else {
        setData(response);
      }
    }
    fetchform();
  }, [url]);

  useEffect(() => {
    if (data.campos) {
      const ResetValor = {};
      data.campos.forEach((campo) => {
        ResetValor[campo] = '';
      });
      setFormValues(ResetValor);
    }
  }, [data]);

  useEffect(() => {
    if (!isOpen && data.campos) {
      const valoresVacios = {};
      data.campos.forEach((campo) => {
        valoresVacios[campo] = '';
      });
      setFormValues(valoresVacios);
      setMensaje('');
      setError('');
    }
  }, [isOpen, data]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      // Guardamos el archivo (solo el primero)
      setFormValues((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setMensaje('');
  setError('');

  const formData = new FormData();

  for (const key in formValues) {
    formData.append(key, formValues[key]);
  }

  for (const key in campos_auto) {
    formData.append(key, campos_auto[key]);
  }

  // ✅ Si la tabla es 'proveedor', modificar el valor de 'estado' a 1
  if (url === 'proveedor') {
    formData.set('estado', '1'); // Reemplaza si ya existe, o lo agrega si no estaba
  }

  try {
    console.log(url);
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    const res = await fetch(`http://localhost:3001/api/generico/${url}`, {
      method: 'POST',
      body: formData,
    });

    const text = await res.text();

    let respuesta = {};
    if (text) {
      try {
        respuesta = JSON.parse(text);
      } catch {
        setError('Respuesta del servidor no es JSON válido');
        return;
      }
    }

    if (!res.ok) {
      setError(`Error al guardar: ${respuesta.error || text || res.statusText}`);
      return;
    }

    setMensaje(`${url} creado correctamente`);

    const limpio = {};
    data.campos.forEach((campo) => (limpio[campo] = ''));
    setFormValues(limpio);

    const nuevaLista = await window.api.get(`/api/generico/${url}`);
    if (!nuevaLista.error) setState(nuevaLista.data);

    onClose();
  } catch (err) {
    setError('Error: ' + err.message);
  }
};


  const relacionesMap = {};
  data.relaciones?.forEach((rel) => {
    relacionesMap[`${rel.nombre}_id`] = rel;
  });

  return (
    <Overlay isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <Title>{title}</Title>
        <form onSubmit={handleSubmit}>
          {data.campos &&
            data.campos.map((campo) => {
              if (camposIgnorados.includes(campo)) return null;

              const relacion = relacionesMap[campo];

              return (
                <FormField key={campo}>
                  {relacion ? (
                    <select
                      name={campo}
                      value={formValues[campo] || ''}
                      onChange={handleChange}
                    >
                      <option value="">
                        Seleccione una {relacion.nombre.replace('_', ' ')}
                      </option>
                      {relacion.datos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item[relacion.labelField]}
                        </option>
                      ))}
                    </select>
                  ) : campo.toLowerCase().includes('imagen') || campo.toLowerCase().includes('foto') ? (
                    // Detectamos campos que probablemente sean imagen y renderizamos input file
                    <input
                      type="file"
                      accept="image/*"
                      name={campo}
                      onChange={handleChange}
                    />
                  ) : (
                    <input
                      name={campo}
                      placeholder={campo}
                      value={formValues[campo] || ''}
                      onChange={handleChange}
                    />
                  )}
                </FormField>
              );
            })}
          <SubmitButton type="submit">Guardar</SubmitButton>
        </form>

        {mensaje && <MessageSuccess>{mensaje}</MessageSuccess>}
        {error && <MessageError>{error}</MessageError>}
      </ModalContainer>
    </Overlay>
  );
}

// Styled Components (agregué FormField y SubmitButton para mejor orden)

const Overlay = styled.div`
  position: fixed;
  inset: 0; /* top, right, bottom, left = 0 */
  background: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;
`;

const ModalContainer = styled.div`
  background: #fff;
  padding: 32px 28px;
  border-radius: 16px;
  max-width: 600px;
  width: 95%;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;

  form > div {
    margin-bottom: 16px;
  }

  select,
  input {
    width: 100%;
    padding: 10px 14px;
    font-size: 16px;
    border: 1.8px solid #ccc;
    border-radius: 8px;
    transition: border-color 0.25s ease;
    outline-offset: 2px;

    &:focus {
      border-color: #357edd;
      outline: none;
      box-shadow: 0 0 6px #357edd99;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 16px;
  top: 12px;
  background: none;
  border: none;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;

  &:hover {
    color: #e74c3c;
  }
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 24px;
  font-weight: 700;
  font-size: 26px;
  color: #222;
`;

const FormField = styled.div`
  margin-bottom: 16px;
`;

const SubmitButton = styled.button`
  background-color: #357edd;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px 22px;
  font-weight: 600;
  font-size: 17px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #285bb5;
  }
`;

const MessageSuccess = styled.p`
  color: #2ecc71;
  font-weight: 600;
  margin-top: 12px;
`;

const MessageError = styled.p`
  color: #e74c3c;
  font-weight: 600;
  margin-top: 12px;
`;
