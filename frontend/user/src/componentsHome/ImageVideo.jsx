import { useRef } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

function ImageVideo(props) {
  const renderTooltip = (props) => (
    <Tooltip {...props}>accetta come formato video solo .mp4</Tooltip>
  );

  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const [file] = event.target.files;
    if (props.setIsGeo) props.setIsGeo(false);
    event.preventDefault();
    if (file) {
      props.setImageServer(file);
      props.setSelectedResource(URL.createObjectURL(file));

      if (props.type_msg === "video/mp4") {
        if (props.setIsVideo !== undefined) {
          if (props.setPlaceholderNewMessage)
            props.setPlaceholderNewMessage("aggiungi una descrizione al video");
          props.setIsVideo(true);
        }
      } else {
        if (props.setIsVideo !== undefined) {
          if (props.setPlaceholderNewMessage)
            props.setPlaceholderNewMessage(
              "aggiungi una descrizione all'immagine",
            );
          props.setIsVideo(false);
        }
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      {props.type_msg === "video/mp4" ? (
        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={renderTooltip}
        >
          <span onClick={handleButtonClick}> {props.name_type_msg}</span>
        </OverlayTrigger>
      ) : (
        <span onClick={handleButtonClick}> {props.name_type_msg}</span>
      )}
      <input
        type="file"
        accept={props.type_msg}
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
export default ImageVideo;
