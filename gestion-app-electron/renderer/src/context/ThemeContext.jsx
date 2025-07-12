import React, {createContext,useState,useContext} from 'react';

//Creamos Contexto
export const ThemeContext=createContext();

//Creamos el provedor del contexto
export const ThemeProvider=({children})=>{
    const [modoOscuro, setModoOscuro]=useState(false);
    const alternarModo=()=>{
        setModoOscuro(prev=>!prev);
    };

//Devolvemos el provedor con los valores que queremos compartir
    return(
    <ThemeContext.Provider value={{modoOscuro,alternarModo}}>
    {children}
    </ThemeContext.Provider>
    );
};

//Creamos un hook para usarlo mas facil

export const useTheme=()=>useContext(ThemeContext);