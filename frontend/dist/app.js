"use strict";
// Define las funciones
function funcion1() {
    alert("Ejecutaste la función del Botón 1 🚀");
}
function funcion2() {
    console.log("Función del Botón 2 ejecutada ✅");
    const body = document.body;
    body.style.backgroundColor = body.style.backgroundColor === "darkred" ? "rgb(122, 166, 202)" : "darkred";
}
// Obtiene los botones por su ID
const boton1 = document.getElementById("boton1");
const boton2 = document.getElementById("boton2");
// Verifica que los botones existan antes de asignar el evento
if (boton1) {
    boton1.addEventListener('click', funcion1);
}
else {
    console.error("No se encontró el botón con ID 'boton1'.");
}
if (boton2) {
    boton2.addEventListener('click', funcion2);
}
else {
    console.error("No se encontró el botón con ID 'boton2'.");
}
