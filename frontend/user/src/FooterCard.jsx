import { Trash } from "react-bootstrap-icons";
import { Card } from "react-bootstrap";
import { icon_size } from "./Const.js";

function FooterCard(props) {
  return (
    <Card.Footer>
      {props.index !== undefined ? (
        <div
          style={
            props.messageDeleted
              ? {
                  display: "flex",
                  justifyContent: "flex-end",
                  opacity: "0.5",
                  position: "relative",
                }
              : {
                  display: "flex",
                  justifyContent: "space-between",
                  position: "relative",
                }
          }
        >
          {!props.messageDeleted && (
            <div
              style={{ cursor: "pointer" }}
              role="button"
              onClick={() => {
                if (props.setCurrentIndex) props.setCurrentIndex(props.index);
                if (props.setShowModalD) props.setShowModalD(true);
              }}
            >
              <Trash size={icon_size / 3.4} />
            </div>
          )}

          <span>{`${props.data} ${props.orario}`}</span>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <span>{`${props.data} ${props.orario}`}</span>
        </div>
      )}
    </Card.Footer>
  );
}
export default FooterCard;
