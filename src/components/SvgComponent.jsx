
import { ReactSVG } from 'react-svg';

const SVGComponent = ({
  src,
  className,
  color = 'currentColor',
  fillColor,
  strokeColor,
  size = '24px',
  padding
}) => {

  const finalFill = fillColor ?? color;
  const finalStroke = strokeColor ?? color;

  return (
    <div className='svgComp-div' style={{ padding, color }}>
      <ReactSVG
        src={src}

        beforeInjection={(svg) => {

          svg.querySelectorAll("style").forEach(s => s.remove());

          svg.querySelectorAll("*").forEach(el => {

            if (el.getAttribute("fill") !== "none") {
              el.setAttribute("fill", finalFill);
            }

            // if (el.getAttribute("stroke")) {
            //   el.setAttribute("stroke", finalStroke);
            // }
            // aplicar stroke siempre si se especifica
            if (strokeColor) {
              el.setAttribute("stroke", finalStroke);
            }

            el.removeAttribute("class");
          });

          svg.setAttribute('width', size);
          svg.setAttribute('height', size);

        }}
      />
    </div>
  );
};

export default SVGComponent;