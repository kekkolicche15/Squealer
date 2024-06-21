import { useState } from "react";
import { Search, Telegram } from "react-bootstrap-icons";
import { Form, Dropdown, Row, Col, Container } from "react-bootstrap";
import "./Wikipedia.css";
import { useClickAway } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { icon_size } from "../Const.js";

function Wikipedia(props) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const ref = useClickAway(() => {
    setShowInput(false);
  });

  async function wiki() {
    const url = `https://it.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrlimit=1&prop=extracts&origin=*&exintro&explaintext&exsentences=1&gsrsearch=${inputValue}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.query)
      toast.error(`la ricerca "${inputValue}" non ha trovato alcun risultato`, {
        className: "toast-message",
      });
    else
      props.setInputText(
        props.inputText +
          data.query.pages[Object.keys(data.query.pages)].extract,
      );
  }

  return (
    <>
      {!showInput ? (
        <Dropdown.Item
          as="button"
          variant="secundary"
          onClick={() => setShowInput(true)}
        >
          <Search style={{ color: "white" }} />
          <span> cerca su Wikipedia</span>
        </Dropdown.Item>
      ) : (
        <Dropdown.Item as="div" bsPrefix="my-dropdown-item" ref={ref}>
          <Container fluid>
            <Row className="align-items-center">
              <Col sm={9} xs={9}>
                <Form.Control
                  id={"wiki"}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  type="text"
                />
              </Col>
              <Col
                sm={3}
                xs={3}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <Telegram
                  role="button"
                  onClick={async () => {
                    if (inputValue !== "") {
                      await wiki();
                      setInputValue("");
                    }
                    setShowInput(false);
                  }}
                  size={icon_size / 2.5}
                  style={{
                    transform: "rotate(45deg)",
                    marginLeft: "5px",
                    cursor: "pointer",
                  }}
                />
              </Col>
            </Row>
          </Container>
        </Dropdown.Item>
      )}
    </>
  );
}
export default Wikipedia;
