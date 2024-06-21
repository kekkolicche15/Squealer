import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { DiamondFill } from "react-bootstrap-icons";
import { icon_size } from "./Const";

function TooltipVip(props) {
  var role = props.role;

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {`account ${role}`}
    </Tooltip>
  );

  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={renderTooltip}
    >
      <DiamondFill
        style={{ cursor: "pointer", marginTop: "-5px" }}
        color={
          role === "user"
            ? "gray"
            : role === "vip"
              ? "gold"
              : role === "smm"
                ? "blue"
                : "green"
        }
        size={icon_size / 3}
      />
    </OverlayTrigger>
  );
}
export default TooltipVip;
