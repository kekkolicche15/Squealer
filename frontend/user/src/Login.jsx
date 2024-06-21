import { useState, useEffect } from "react";
import { Row, Form, Button, Col, Modal, CloseButton } from "react-bootstrap";
import InputWithIcon from "./InputWithIcon.jsx";
import { toast } from "react-toastify";
import { uri, sendRequest } from "./Const.js";
import { useNavigate } from "react-router-dom";

const Login = (props) => {
  const regex = props.regex;

  const navigator = useNavigate();

  const [errorUsername, setErrorUsername] = useState();
  const [errorPassword, setErrorPassword] = useState();

  useEffect(() => {
    props.data.username = "";
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setErrorUsername();
    setErrorPassword();
    const username = e.target[0].value;
    const password = e.target[1].value;

    if (!regex.username.test(username)) setErrorUsername("Username non valido");
    if (!regex.password.test(password)) setErrorPassword("Password non valida");

    const res = await sendRequest(
      new Request(`${uri}user/session`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ username: username, password: password }),
      }),
      true,
    );
    const json = await res.json();
    if (res.ok) {
      //login avvenuto con successo
      navigator("../home", { relative: "path" });
      sessionStorage.setItem("accessToken", json.accessToken);
      sessionStorage.setItem("refreshToken", json.refreshToken);
      sessionStorage.setItem("username", username);
      props.setData({ username: username });
    } else  {
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const [showModal, setShowModal] = useState(false);

  const recoverEmail = async (e) => {
    setShowModal(false);
    e.preventDefault();
    var email = e.target[0].value;
    const res = await sendRequest(
      new Request(`${uri}user/reset/${email}/`),
      false,
    );
    const json = await res.json();
    if (res.ok) toast.info(json.message, { className: "toast-message" });
    else toast.error(json.error, { className: "toast-message" });
  };

  return (
    <>
      {/**modal per il recupero della password */}
      <Modal centered show={showModal}>
        <Modal.Title
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "5px",
            marginRight: "10px",
            marginLeft: "10px",
          }}
        >
          <p style={{ fontWeight: "bold" }}>Recupera password</p>
          <CloseButton
            onClick={() => {
              setShowModal(false);
            }}
          ></CloseButton>
        </Modal.Title>
        <Form onSubmit={recoverEmail}>
          <Modal.Body style={{ marginBottom: "10px" }}>
            <InputWithIcon icon="email" />
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit">invia richiesta</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Form onSubmit={async (e) => await login(e)}>
        <Row>
          <InputWithIcon icon="username" />
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <p style={{ color: "red" }}>{errorUsername}</p>
        </Row>
        <Row>
          <InputWithIcon icon="password" />
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <p style={{ color: "red" }}>{errorPassword}</p>
        </Row>
        <Row style={{ marginTop: "20px" }}>
          <Col>
            <Button style={{ width: "100%" }} type="submit">
              Accedi
            </Button>
          </Col>
          <Col>
            <Button
              style={{ width: "100%" }}
              variant="secondary"
              onClick={() => {
                sessionStorage.setItem("refreshToken", "_");
                sessionStorage.setItem("username", "_");
                navigator("../home", { relative: "path" });
              }}
            >
              Accedi senza login
            </Button>
          </Col>
        </Row>
      </Form>
      <Row>
        <Col
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <a
            href=""
            style={{ fontSize: "14px" }}
            onClick={(e) => {
              e.preventDefault();
              setShowModal(true);
            }}
          >
            password dimenticata?
          </a>
        </Col>
      </Row>
      <hr></hr>
      <Row>
        <Button
          variant="success"
          onClick={() => {
            navigator("../signIn", { relative: "path" });
          }}
        >
          Crea nuovo account
        </Button>
      </Row>
    </>
  );
};

export default Login;
