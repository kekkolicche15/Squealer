import { useState, useRef } from "react";
import { Dropdown, Form, Card } from "react-bootstrap";
import { Globe, Lock } from "react-bootstrap-icons";
import { icon_size } from "./Const.js";

function CustomInput(props) {
  const [showNewUsername, setShowNewUsername] = useState(false);
  const refInput = useRef(null);
  const refLabel = useRef(null);
  const refCard = useRef(null);
  const refDropdownButton = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [itemSelected, setItemSelected] = useState(false);
  const [itemValue, setItemValue] = useState("");

  //serve in dropdrown per essere required
  const refInputR = useRef(null);

  //roba di layout
  const [marginMenu, setMarginMenu] = useState("23px");

  function handleClick() {
    setShowNewUsername(true);
    if (props.isDropdown) {
      refDropdownButton.current.click();
    } else {
      refInput.current.focus();
    }
  }

  function HandleDToggle() {
    refDropdownButton.current.style.boxShadow = "none";
    refDropdownButton.current.style.borderColor = "rgba(255, 255, 255, 0.15)";
    setMarginMenu("-18px");
    if (!itemSelected) setShowNewUsername(false);
  }

  function SelectDropdown() {
    if (marginMenu !== "-18px") setMarginMenu("-55px");
    setItemSelected(true);
  }

  return (
    <Card
      ref={refCard}
      style={
        showNewUsername
          ? {
              border: "1px solid rgb(110,168,254)",
              boxShadow: "1px 1px 5px 2px rgb(110,168,254)",
              height: "75px",
            }
          : {
              height: "75px",
              boxShadow: "none",
              borderColor: "rgba(255, 255, 255, 0.15)",
            }
      }
      onBlur={() => {
        if (!props.isDropdown) {
          refCard.current.style.boxShadow = "none";
          refCard.current.style.borderColor = "rgba(255, 255, 255, 0.15)";
          if (inputValue == "") setShowNewUsername(false);
          if (refLabel.current) refLabel.current.style.color = "#adb5bd";
        }
      }}
    >
      {showNewUsername ? (
        <div>
          {(!props.isDropdown || itemSelected) && (
            <Form.Label
              ref={refLabel}
              htmlFor={props.label}
              style={{
                fontSize: "14px",
                color: "rgb(110,168,254)",
                marginTop: "5px",
                marginLeft: "5px",
              }}
            >
              {props.label}
            </Form.Label>
          )}
          {itemSelected && (
            <div>
              {itemValue === "Pubblico" ? (
                <Globe
                  style={{ marginBottom: "7px", marginLeft: "5px" }}
                  size={icon_size / 3}
                />
              ) : (
                <Lock
                  style={{ marginBottom: "7px", marginLeft: "5px" }}
                  size={icon_size / 3}
                />
              )}
              <span
                role="button"
                style={{ fontSize: "25px", cursor: "pointer" }}
                onClick={() => handleClick()}
              >{` ${itemValue}`}</span>
            </div>
          )}
        </div>
      ) : (
        <p
          role={props.isDropdown ? "button" : "textbox"}
          onClick={() => {
            handleClick();
          }}
          style={
            props.isDropdown
              ? {
                  fontSize: "25px",
                  opacity: "0.5",
                  marginLeft: "5px",
                  marginTop: "15px",
                  cursor: "pointer",
                }
              : {
                  fontSize: "25px",
                  opacity: "0.5",
                  marginLeft: "5px",
                  marginTop: "15px",
                }
          }
        >
          {props.label}
        </p>
      )}
      {props.isDropdown ? (
        <div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Form.Control
              name={props.label}
              id={props.label}
              ref={refInputR}
              type="txt"
              style={{ opacity: "0", width: "0.1px", height: "0.1px" }}
              required={true}
            />
          </div>
          <Dropdown
            autoClose="outside"
            onToggle={(show) => {
              if (!show) HandleDToggle();
            }}
            onSelect={() => SelectDropdown()}
            style={
              showNewUsername ? {} : { position: "absolute", top: "-150vh" }
            }
          >
            <Dropdown.Toggle
              ref={refDropdownButton}
              as="div"
              style={{
                fontSize: "25px",
                color: "rgb(110,168,254)",
                marginLeft: "5px",
                marginTop: "15px",
                opacity: "1",
              }}
            >
              <p style={{ marginTop: "-15px" }}>
                {!itemSelected ? props.label : ""}
              </p>
            </Dropdown.Toggle>
            <Dropdown.Menu
              style={
                itemSelected
                  ? { marginTop: `${marginMenu}`, marginLeft: "-7px" }
                  : {
                      marginTop: "23px",
                      marginLeft: "-7px",
                    }
              }
            >
              <Dropdown.Item
                as="button"
                onClick={(event) => {
                  event.preventDefault();
                  setItemValue("Pubblico");
                  refInputR.current.value = "Pubblico";
                }}
              >
                <Globe style={{ marginBottom: "7px" }} size={icon_size / 3} />
                <span style={{ fontSize: "22px" }}> Pubblico</span>
                <p
                  style={{
                    marginLeft: `calc(${icon_size / 3}px + 6px)`,
                    marginTop: "-5px",
                    opacity: "0.5",
                    whiteSpace: "pre-line",
                  }}
                >
                  chiunque puó entrare liberamente nel canale o vedere i post
                  pubblicati
                </p>
              </Dropdown.Item>
              <Dropdown.Item
                as="button"
                onClick={(event) => {
                  event.preventDefault();
                  setItemValue("Privato");
                  refInputR.current.value = "Privato";
                }}
              >
                <Lock style={{ marginBottom: "7px" }} size={icon_size / 3} />
                <span style={{ fontSize: "22px" }}> Privato</span>
                <p
                  style={{
                    marginLeft: `calc(${icon_size / 3}px + 6px)`,
                    marginTop: "-5px",
                    opacity: "0.5",
                    whiteSpace: "pre-line",
                  }}
                >
                  per poter entrare nel canale bisogna inviare una richiesta e i
                  post e membri sono nascosti ai non membri
                </p>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      ) : (
        <Form.Control
          name={props.label}
          id={props.label}
          onClick={() => {
            refCard.current.style.boxShadow =
              "1px 1px 5px 2px rgb(110,168,254)";
            refCard.current.style.border = "1px solid rgb(110,168,254)";
            if (refLabel.current)
              refLabel.current.style.color = "rgb(110,168,254)";
          }}
          value={inputValue}
          onInput={(event) => {
            setInputValue(event.target.value);
          }}
          ref={refInput}
          type="text"
          required={!props.isDropdown}
          style={
            showNewUsername
              ? {
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  fontSize: "20px",
                  marginTop: "-10px",
                }
              : {
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  height: "85px",
                  fontSize: "20px",
                  opacity: "0",
                }
          }
        ></Form.Control>
      )}
    </Card>
  );
}
export default CustomInput;
