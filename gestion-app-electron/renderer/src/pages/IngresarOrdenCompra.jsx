// IngresarOrdenCompra.jsx
import React, {useState,useEffect} from "react";
export default function IngresarOrdenCompra() {
  const [contador,setContador]=useState(0);

  const incrementar=()=>{setContador(contador+1)}

  return( 
  <div>
    <h1>Ingresar Orden de Compra</h1>
    <button onClick={incrementar}>Click Aqui</button>
    <p>{contador}</p>
  </div>
  );
}