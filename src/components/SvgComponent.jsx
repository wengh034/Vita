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
  // Detectar si el archivo es una imagen rasterizada o GIF (webp, png, jpg, gif, etc.)
  const isRasterImage = typeof src === 'string' && /\.(webp|png|jpe?g|gif)$/i.test(src);

  if (isRasterImage) {
    return (
      <div className={`svgComp-div ${className}`} style={{ padding, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src={src}
          alt="Illustration"
          style={{
            width: size,
            height: size,
            objectFit: 'contain'
          }}
        />
      </div>
    );
  }

  // Lógica original intacta para archivos SVG
  const finalFill = fillColor ?? color;
  const finalStroke = strokeColor ?? color;

  return (
    <div className={`svgComp-div ${className}`} style={{ padding, color, display: 'inline-flex', alignItems: 'center' }}>
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

                // Si no tiene stroke-width explícito, le asignamos uno para que no sea invisible.
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