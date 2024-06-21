import { useState } from "react";
import { Image } from "react-bootstrap";
import ReactPlayer from "react-player";
import { truncate, reverse_truncate, maxLengthtextPost, parseContent } from "../Const.js";
import TooltipPopularity from "./TooltipPopularity";
import { Link } from "react-router-dom";

function ContenutoPost(props) {
  const [showText, setShowText] = useState(false);

  return (
    <div>
      {!props.is_profile && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {props.is_comment && (
              <TooltipPopularity popularity={props.popularity} />
            )}
          </div>
        </div>
      )}
     
        {props.type_msg === "text" ? (
            props.references ? 
                <div dangerouslySetInnerHTML={{ __html: parseContent(truncate(false, props.msg), props.references) }} />
            :
            <span> {truncate(true, props.msg)}  </span>
            
        )
          :  <span> {truncate(true, props.msg)}  </span>}
     

      {showText ? (
        props.type_msg === "text" ? (
            props.references ? 
                <div dangerouslySetInnerHTML={{ __html: parseContent(reverse_truncate(false, props.msg), props.references) }} />
            :
            <span>{reverse_truncate(false, props.msg)}</span>
            
        ) : (
          <span>{reverse_truncate(true, props.msg)}</span>
        )
      ) : props.msg.length >= maxLengthtextPost ? (
        <a
          href=""
          onClick={(event) => {
            event.preventDefault();
            setShowText(true);
          }}
        >
          ....
        </a>
      ) : (
        <></>
      )}

      <div
        style={
          props.type_msg === "text"
            ? {}
            : { display: "flex", justifyContent: "center", marginTop: "3%" }
        }
      >
        {props.type_msg === "video" ? (
          <ReactPlayer
            url={props.attachment}
            alt={truncate(true, props.msg)}
            controls={true}
            style={{maxHeight: "60vh"}}
          />
        ) : props.type_msg === "image" ? (
          <Image
            src={props.attachment}
            alt={truncate(true, props.msg) + "..."}
            fluid
            style={{maxHeight: "60vh"}}
          />
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default ContenutoPost;
