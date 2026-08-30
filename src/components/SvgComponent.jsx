import React from 'react';
import { ReactSVG } from 'react-svg';

const SVGComponent = ({
  src,
  className = '',
  color = 'currentColor',
  fillColor,
  strokeColor,
  size = '24px',
  padding
}) => {

  const finalFill = fillColor ?? color;
  const finalStroke = strokeColor ?? color;

  return (
    <div className='svgComp-div' style={{ padding, color, display: 'inline-flex' }}>
      <ReactSVG
        src={src}
        wrapper="span" // Usa span en lugar de div para evitar bloques indeseados
        beforeInjection={(svg) => {

          // 1. Limpiar estilos internos si existen
          svg.querySelectorAll("style").forEach(s => s.remove());

          // 2. Aplicar dimensiones exactas al tag principal
          svg.setAttribute('width', size);
          svg.setAttribute('height', size);

          // 3. Iterar solo en elementos visuales internos (evitamos el nodo raíz <svg>)
          svg.querySelectorAll("path, circle, rect, polygon, polyline, ellipse").forEach(el => {
            
            // Si el elemento no es explícitamente transparente, aplicamos el relleno
            if (el.getAttribute("fill") !== "none") {
              el.setAttribute("fill", finalFill);
            }

            // SOLO aplicar stroke si el elemento ya tenía un stroke previo 
            // O si no es un rectángulo contenedor con fill transparente (el cuadro horrendo)
            if (strokeColor) {
              const hasFillNone = el.getAttribute("fill") === "none";
              const isRect = el.tagName.toLowerCase() === "rect";

              // Evitamos ponerle borde al contenedor invisible
              if (!(isRect && hasFillNone)) {
                el.setAttribute("stroke", finalStroke);
              }
            }

            el.removeAttribute("class");
          });

        }}
      />
    </div>
  );
};

export default SVGComponent;