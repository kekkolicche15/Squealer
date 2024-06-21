import { useState, useEffect, useRef } from "react";
import { Col, Row, Card, Form } from "react-bootstrap";
import {
  Person,
  Envelope,
  Lock,
  ShieldCheck,
  Eye,
  EyeSlash,
} from "react-bootstrap-icons";
import { icon_size } from "./Const.js";

function InputWIthIcon(props) {
  const Ref = useRef(null);
  const LabelRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const handleClickOutside = (event) => {
    if (Ref.current && !Ref.current.contains(event.target)) {
      // Il click è avvenuto all'esterno del componente
      setShowUsernameIcon(false);
      Ref.current.style.borderColor = "rgba(255, 255, 255, 0.15)";
      Ref.current.style.boxShadow = "none";
      if (LabelRef.current)
        LabelRef.current.style.color = "rgba(255, 255, 255, 0.15)";
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Rimuovi l'event listener quando il componente si smonta
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getIcon = () => {
    if (props.icon === "username") return "Nome Utente";
    else if (props.icon === "email") return "Email";
    else if (props.icon === "password") return "Password";
    else if (props.icon === "confirmPassword") return "Conferma Password";
  };

  const [showUsernameIcon, setShowUsernameIcon] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (LabelRef.current) LabelRef.current.style.color = "rgb(110,168,254)";
  }, [LabelRef.current]);

  function handleTypeInput() {
    if (getIcon() === "Conferma Password") {
      return "password";
    } else if (props.icon === "password") {
      if (showPassword) return "text";
      else return "password";
    } else return props.icon;
  }

  return (
    <Card
      ref={Ref}
      style={{
        display: "flex",
        justifyContent: "flex-start",
        marginTop: "15px",
      }}
    >
      <Row>
        <Col>
          {((props.value !== undefined && props.value !== "") ||
            input !== "") && (
            <label
              ref={LabelRef}
              htmlFor={props.icon}
              style={{ fontSize: "12px" }}
            >
              {getIcon()}
            </label>
          )}
        </Col>
      </Row>
      <Row>
        {showUsernameIcon && (
          <Col
            style={{
              maxWidth: icon_size / 3,
              marginLeft: "5px",
              marginTop: "5px",
            }}
          >
            {props.icon === "username" && <Person size={icon_size / 3} />}
            {props.icon === "email" && <Envelope size={icon_size / 3} />}
            {props.icon === "password" && <Lock size={icon_size / 3} />}
            {props.icon === "Conferma Password" && (
              <ShieldCheck size={icon_size / 3} />
            )}
          </Col>
        )}
        <Col>
          {props.handleChange ? (
            <Form.Control
              required
              autoComplete="off"
              id={props.icon}
              value={props.value}
              onChange={(event) => {
                props.handleChange(event, props.icon);
              }}
              onFocus={() => {
                setShowUsernameIcon(true);
                Ref.current.style.border = "1px solid rgb(110,168,254)";
                Ref.current.style.boxShadow =
                  "1px 1px 5px 2px rgb(110,168,254)";
                if (LabelRef.current)
                  LabelRef.current.style.color = "rgb(110,168,254)";
              }}
              style={{ border: "none", outline: "none", boxShadow: "none" }}
              type={handleTypeInput()}
              placeholder={getIcon()}
            />
          ) : (
            <Form.Control
              required
              autoComplete="off"
              id={props.icon}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              onFocus={() => {
                setShowUsernameIcon(true);
                Ref.current.style.border = "1px solid rgb(110,168,254)";
                Ref.current.style.boxShadow =
                  "1px 1px 5px 2px rgb(110,168,254)";
                if (LabelRef.current)
                  LabelRef.current.style.color = "rgb(110,168,254)";
              }}
              style={{ border: "none", outline: "none", boxShadow: "none" }}
              type={handleTypeInput()}
              placeholder={getIcon()}
            />
          )}
        </Col>

        {showUsernameIcon && props.icon === "password" && (
          <Col
            style={{
              maxWidth: icon_size / 3,
              marginRight: "20px",
              marginTop: "2px",
            }}
          >
            {showPassword ? (
              <Eye
                role="button"
                style={{ cursor: "pointer" }}
                onClick={() => setShowPassword(!showPassword)}
                size={icon_size / 2.5}
              />
            ) : (
              <EyeSlash
                role="button"
                style={{ cursor: "pointer" }}
                onClick={() => setShowPassword(!showPassword)}
                size={icon_size / 2.5}
              />
            )}
          </Col>
        )}
      </Row>
    </Card>
  );
}

export default InputWIthIcon;
