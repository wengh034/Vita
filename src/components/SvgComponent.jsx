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
    <div className='svgComp-div' style={{ padding, color, display: 'inline-flex', alignItems: 'center' }}>
      <ReactSVG
        src={src}
        wrapper="span"
        beforeInjection={(svg) => {

          // 1. Quitar la etiqueta <style> interna
          svg.querySelectorAll("style").forEach(s => s.remove());

          // 2. Establecer el tamaño al <svg> raíz
          svg.setAttribute('width', size);
          svg.setAttribute('height', size);

          // 3. Iterar solo en elementos dibujables
          svg.querySelectorAll("path, circle, rect, polygon, polyline, ellipse").forEach(el => {

            // RELLENO (FILL)
            if (el.getAttribute("fill") !== "none") {
              el.setAttribute("fill", finalFill);
            }

            // TRAZO (STROKE)
            if (strokeColor) {
              const isBackgroundRect = el.tagName.toLowerCase() === "rect" && el.getAttribute("fill") === "none";
              
              if (!isBackgroundRect) {
                el.setAttribute("stroke", finalStroke);

                // 🔴 AQUÍ ESTABA EL TRUCO: Si no tiene stroke-width explícito, le asignamos uno para que no sea 0 invisibles.
                if (!el.getAttribute("stroke-width")) {
                  el.setAttribute("stroke-width", "2.5");
                }
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