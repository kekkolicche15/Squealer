import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { CircleFill } from "react-bootstrap-icons";
import { useState, useEffect } from "react";
import { icon_size } from "../Const.js";

function TooltipPopularity(props) {
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {popularity}
    </Tooltip>
  );

  const [color, setColor] = useState("");
  var popularity = props.popularity;

  useEffect(() => {
    switch (props.popularity) {
      case "popular":
        setColor("green");
        break;
      case "unpopular":
        setColor("red");
        break;
      case "controversial":
        setColor("yellow");
        break;
    }
  }, []);

  const returnValue = () => {
    if (props.popularity === "normal") return <></>;
    else
      return (
        <OverlayTrigger
          placement="top"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTooltip}
        >
          <CircleFill
            style={{ cursor: "pointer" }}
            color={color}
            size={icon_size / 3}
          />
        </OverlayTrigger>
      );
  };

  return returnValue();
}

export default TooltipPopularity;
