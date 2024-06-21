import { Form, Row, Col, Button } from "react-bootstrap";
import InputWithIcon from "./InputWithIcon.jsx";
import { useState } from "react";
import { uri } from "./Const.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Recover(props) {
  const regex = props.regex;

  const navigator = useNavigate();

  const [errorPassword, setErrorPassword] = useState();

  const getCode = () => {
    var pathname = window.location.pathname;
    const pathSegments = pathname.split("/");
    const codeIndex = pathSegments.indexOf("code");
    if (codeIndex !== -1 && codeIndex < pathSegments.length - 1) {
      return pathSegments[codeIndex + 1];
    } else {
      return null;
    }
  };

  const [data, setData] = useState({
    code: getCode(),
    password: "",
    confirmPassword: "",
  });

  const validateFields = async () => {
    if (data.password.length === 0 || !regex.password.test(data.password))
      setErrorPassword(
        "Password non valida, deve contenere almeno una lettera maiuscola, un numero e deve essere almeno 8 caratteri",
      );
  };

  const handleChange = (e, field) => {
    setData({ ...data, [field]: e.target.value });
  };

  const recover = async (e) => {
    e.preventDefault();
    setErrorPassword();
    await validateFields();

    if (errorPassword) {
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error("le due password sono diverse", {
        className: "toast-message",
      });
      return;
    }
    const req = new Request(`${uri}user/reset/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const res = await fetch(req);
    if (res.ok) {
      toast.success("Password cambiata con successo", {
        className: "toast-message",
      });
      navigator("../login", { relative: "path" });
    } else {
      const json = await res.json();
      toast.error(json.error, { className: "toast-message" });
    }
  };

  return (
    <Form onSubmit={async (e) => await recover(e)}>
      <Row>
        <Col></Col>
      </Row>
      <Row>
        <Col style={{ display: "flex", justifyContent: "flex-start" }}>
          <p style={{ fontWeight: "bold" }}>Nuova password</p>
        </Col>
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
          Conferma
        </Button>
      </Row>
    </Form>
  );
}
export default Recover;
