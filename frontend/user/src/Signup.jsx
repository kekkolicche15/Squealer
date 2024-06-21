import { useState } from "react";
import { Row, Form, Button, Col } from "react-bootstrap";
import InputWithIcon from "./InputWithIcon.jsx";
import { toast } from "react-toastify";
import { uri } from "./Const.js";
import { useNavigate } from "react-router-dom";

const Signup = (props) => {
  const navigator = useNavigate();
  const regex = props.regex;

  const [errorUsername, setErrorUsername] = useState();
  const [errorPassword, setErrorPassword] = useState();
  const [errorEmail, setErrorEmail] = useState();

  const [data, setData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  const validateFields = async () => {
    if (data.username.length === 0 || !regex.username.test(data.username))
      setErrorUsername(
        "Username non valido, deve contenere solo lettere, numeri e _ e deve essere compreso fra 2 e 20 caratteri",
      );

    if (data.password.length === 0 || !regex.password.test(data.password))
      setErrorPassword(
        "Password non valida, deve contenere almeno un numero e deve essere almeno 8 caratteri",
      );

    if (data.email.length === 0 || !regex.email.test(data.email))
      setErrorEmail("Email non valida");
  };

  const signup = async (e) => {
    e.preventDefault();
    setErrorUsername();
    setErrorPassword();
    setErrorEmail();
    await validateFields();

    if (errorUsername || errorPassword || errorEmail) {
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error("le due password sono diverse", {
        className: "toast-message",
      });
      return;
    }

    const req = new Request(`${uri}user/`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const res = await fetch(req);
    if (res.ok) {
      toast.info("inviata email di verifica", { className: "toast-message" });
      navigator("../login", { relative: "path" });
    } else {
      const json = await res.json();
      if (json.error === "Username e/o Email non disponibili")
        toast.error(json.error, { className: "toast-message" });
    }
  };

  const handleChange = (e, field) => {
    if (field === "confermaPassword")
      setData({ ...data, ["confirmPassword"]: e.target.value });
    else setData({ ...data, [field]: e.target.value });
  };
  return (
    <>
      <Row>
        <Col style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outline-primary"
            onClick={() => {
              navigator("../login", { relative: "path" });
            }}
          >
            torna al login
          </Button>
        </Col>
      </Row>
      <hr></hr>
      <Form onSubmit={async (e) => await signup(e)}>
        <Row>
          <InputWithIcon
            value={data.username}
            handleChange={handleChange}
            icon="username"
          />
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <p style={{ color: "red" }}>{errorUsername}</p>
        </Row>
        <Row>
          <InputWithIcon
            value={data.email}
            handleChange={handleChange}
            icon="email"
          />
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <p style={{ color: "red" }}>{errorEmail}</p>
        </Row>
        <Row>
          <InputWithIcon
            value={data.password}
            handleChange={handleChange}
            icon="password"
          />
        </Row>
        <Row style={{ marginTop: "30px" }}>
          <InputWithIcon
            value={data.confirmPassword}
            handleChange={handleChange}
            icon="confirmPassword"
          />
        </Row>
        <Row style={{ marginTop: "10px" }}>
          <p style={{ color: "red" }}>{errorPassword}</p>
        </Row>
        <Row style={{ marginTop: "20px" }}>
          <Button type="submit" variant="success">
            Crea nuovo account
          </Button>
        </Row>
      </Form>
    </>
  );
};

export default Signup;
