// AjustarCantidad.js
import React, { useState } from "react";
import styled from "styled-components";

export default function AjustarCantidadModal({ isOpen, onClose, onConfirm, articulo }) {
  const [cantidad, setCantidad] = useState("");
  const [causa, setCausa] = useState("");

  const handleConfirm = () => {
    const valor = parseInt(cantidad, 10);
    if (!isNaN(valor) && causa.trim() !== "") {
    onConfirm(valor, causa.trim());
    setCantidad("");
    setCausa("");
    }
  };

  if (!isOpen || !articulo) return null;

  return (
    <Overlay>
      <Modal>
        <ContainerTitle>
          <Title>Ajustar cantidad</Title>
        </ContainerTitle>
        
        <Subtitle>Artículo: <strong>{articulo.nombre}</strong></Subtitle>
        
        <Input
          type="text"
          placeholder="Causa"
          value={causa}
          onChange={(e) => setCausa(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Cantidad existente"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
        <Actions>
            <button onClick={onClose}>Cancelar</button>
            <button onClick={handleConfirm} disabled={!cantidad || !causa.trim()}>
            Confirmar
            </button>        
        </Actions>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 999;
`;
const ContainerTitle=styled.div`
display: flex;
align-items: center;
justify-content: center;
margin-bottom:20px;
`
const Title = styled.p`
font-size:1.5rem`
const Subtitle = styled.p`
font-size:1rem;
color: #868686;
`

const Modal = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
`;

const Input = styled.input`
  width: 100%;
  margin-top: 10px;
  margin-bottom: 20px;
  padding: 10px;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;

  & button {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  & button:first-child {
    background: #ccc;
  }

  & button:last-child {
    background: #1a936f;
    color: white;
  }
`;
