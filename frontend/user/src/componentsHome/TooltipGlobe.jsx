import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { Globe, Lock, Award } from "react-bootstrap-icons";
import { icon_size } from "../Const.js";

function TooltipGlobe(props) {
    const visibility = props.visibility;

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {visibility === "private" ? "privato" : visibility === "official" ? "ufficiale" : "pubblico"}
    </Tooltip>
  );


  return (
    <OverlayTrigger
      placement="top"
      delay={{ show: 250, hide: 400 }}
      overlay={renderTooltip}
    >   
        
        {props.visibility === "private" ?
            <Lock
            style={{ cursor: "pointer" }}
            color="white"
            size={icon_size / 3}/>
        : 
        props.visibility === "official" ?
            <Award
                style={{ cursor: "pointer" }}
                color="white"
                size={icon_size / 3}/>
        :
            <Globe style={{ cursor: "pointer" }} color="white" size={icon_size / 3} />
        }
    </OverlayTrigger>
  );
}

export default TooltipGlobe;
