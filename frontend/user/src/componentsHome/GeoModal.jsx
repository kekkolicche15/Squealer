import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Card,
  Col,
  Row,
  Form,
  FormLabel,
  Accordion,
  ListGroup,
  CloseButton,
  Tooltip,
  OverlayTrigger,
  Image,
} from "react-bootstrap/";
import { Trash, PlusCircleFill } from "react-bootstrap-icons";
import {
  icon_size,
  getCurrentPositionIcon,
  getCurrentPositionFillIcon,
  createFileFromBlob,
  getStringMarkers,
} from "../Const.js";
import { toast } from "react-toastify";
import { Slider } from "@mui/material";

function GeoModal(props) {
  //roba per la geolocalizzazione
  const [lat, setLat] = useState(undefined);
  const [lon, setLon] = useState(undefined);
  const [widthImage, setWidthImage] = useState(500);
  const [heightImage, setHeightImage] = useState(500);
  const [zoom, setZoom] = useState(0);
  const [pitch, setPitch] = useState(0); //movimento orizzontale
  const [bearing, setBearing] = useState(0); //movimento verticale
  const [mapStyle, setMapStyle] = useState("osm-carto");
  const [markers, setMarkers] = useState([]);
  const [url_img, setUrl_img] = useState("");

  useEffect(() => {
    if (lon !== undefined && lat !== undefined) {
      setMarkers([
        {
          lat: `${lat}`,
          lon: `${lon}`,
          color: "#ff3421",
          size: "medium",
        },
      ]);
    }
  }, [lon, lat]);

  async function handleClose() {
    if (props.showModal) {
      if (salva) {
        const res = await fetch(url_img);
        const blob = await res.blob();
        const file = createFileFromBlob(blob);
        props.setImageServer(file);
        props.setSelectedResource(url_img);
        if (props.setIsGeo) {
          props.setIsGeo(true);
          props.setGeoParams({
            widthImage: widthImage,
            heightImage: heightImage,
            zoom: zoom,
            pitch: pitch,
            bearing: bearing,
            mapStyle: mapStyle,
            markers: markers,
          });
        }

        setSalva(false);
      }

      props.setShowModal(false);
      setLat(undefined);
      setLon(undefined);
      setWidthImage(0);
      setHeightImage(0);
      setZoom(0);
      setPitch(0);
      setBearing(0);
      setMapStyle("osm-carto");
      setMarkers([]);
    }
  }

  function handleFormMarker(event) {
    event.preventDefault();
    setMarkers((markers) => [
      ...markers,
      {
        lat: `${event.target[0].value}`,
        lon: `${event.target[1].value}`,
        color: `${event.target[2].value}`,
        size: `${event.target[3].value}`,
      },
    ]);
  }

  const [first, setFirst] = useState(true);

  useEffect(() => {
    if (first) setFirst(false);
    else {
      if (widthImage > 100 && heightImage > 100) {
        setUrl_img(
          `https://maps.geoapify.com/v1/staticmap?style=${mapStyle}&width=${widthImage}&height=${heightImage}&center=lonlat:${lon},${lat}&zoom=${zoom}&pitch=${pitch}&bearing=${bearing}${getStringMarkers(
            markers,
          )}&apiKey=REDACTED`,
        );
      }
    }
  }, [
    mapStyle,
    widthImage,
    heightImage,
    lon,
    lat,
    zoom,
    pitch,
    bearing,
    markers,
  ]);

  const removeMarkerByIndex = (index) => {
    setMarkers((markers) => markers.filter((marker, i) => i !== index));
  };

  const [tmp, setTmp] = useState(false);
  const [tmp1, setTmp1] = useState(false);
  const [index, setIndex] = useState(-1);
  const [salva, setSalva] = useState(false);

  useEffect(() => {
    if (tmp) {
      handleClose();
      setTmp(false);
    }
  }, [tmp]);

  useEffect(() => {
    if (tmp1) {
      removeMarkerByIndex(index);
      setTmp1(false);
    }
  }, [tmp1]);

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    setLat(latitude);
    setLon(longitude);
    toast.success("accesso alla geolocalizazione avvenuto con successo", {
      className: "toast-message",
    });
  }

  function error() {
    toast.error("abilita la geolocalizzazione", { className: "toast-message" });
  }

  function getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      toast.error("Geolocalizzazione non supportata", {
        className: "toast-message",
      });
    }
  }

  const [showCPIcon, setShowCPIcon] = useState(false);

  return (
    <>
      <Modal
        show={props.showModal}
        fullscreen={true}
        aria-labelledby="example-custom-modal-styling-title"
        centered
      >
        <Modal.Header>
          <Modal.Title id="example-custom-modal-styling-title">
            Modal heading
          </Modal.Title>
          <CloseButton onClick={() => setTmp(true)} />
        </Modal.Header>

        <Modal.Body>
          <Card>
            <Card.Body>
              {window.width < 500 && <p>ciao</p>}
              <Row style={{ marginTop: "2vh" }}>
                <Col xs={4}>
                  <p style={{ marginLeft: "2%" }}>coordinate:</p>
                </Col>
                <Col xs={3}>
                  <p>latitudine {lat}</p>
                </Col>
                <Col xs={3}>
                  <p>longitudine {lon}</p>
                </Col>
                <Col xs={2}>
                  <OverlayTrigger
                    onEnter={() => setShowCPIcon(true)}
                    onExit={() => setShowCPIcon(false)}
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={
                      <Tooltip id="button-tooltip">
                        accedi alla tua posizione
                      </Tooltip>
                    }
                  >
                    <Image
                      style={{
                        cursor: "pointer",
                        width: `calc(${icon_size}px - 25px)`,
                      }}
                      onClick={() => getPosition()}
                      src={
                        showCPIcon
                          ? getCurrentPositionIcon
                          : getCurrentPositionFillIcon
                      }
                      alt="accedi alla tua posizione"
                      fluid
                    />
                  </OverlayTrigger>
                </Col>
              </Row>
              <Row style={{ marginTop: "2vh" }}>
                <Col>
                  <FormLabel htmlFor="larghezza" style={{ marginLeft: "2%" }}>
                    risoluzione immagine, minimo 100x100px
                  </FormLabel>
                </Col>
                <Col>
                  <Form.Control
                    value={widthImage}
                    id="larghezza"
                    type="number"
                    min="50"
                    placeholder="larghezza in px"
                    onChange={(event) => {
                      setWidthImage(event.target.value);
                    }}
                  />
                </Col>
                <Col>
                  <Form.Control
                    value={heightImage}
                    id="altezza"
                    type="number"
                    min="50"
                    placeholder="altezza in px"
                    onChange={(event) => {
                      setHeightImage(event.target.value);
                    }}
                  />
                </Col>
                <Col></Col>
              </Row>
              <Row style={{ marginTop: "2vh" }}>
                <p>Zoom</p>
                <Slider
                  step={0.1}
                  id="zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  value={zoom}
                  size="medium"
                  defaultValue={0}
                  aria-label="Medium"
                  valueLabelDisplay="auto"
                  min={0}
                  max={20}
                  style={{ marginLeft: "2%", width: "97%" }}
                />
              </Row>
              <Row style={{ marginTop: "2vh" }}>
                <p>Pitch (movimento orizzontale)</p>
                <Slider
                  id="pitch"
                  onChange={(e) => setPitch(e.target.value)}
                  size="medium"
                  value={pitch}
                  defaultValue={0}
                  aria-label="Medium"
                  valueLabelDisplay="auto"
                  min={0}
                  max={60}
                  style={{ marginLeft: "2%", width: "97%" }}
                />
              </Row>
              <Row style={{ marginTop: "2vh" }}>
                <p>Bearing (movimento verticale)</p>
                <Slider
                  id="bearing"
                  onChange={(e) => setBearing(e.target.value)}
                  size="medium"
                  value={bearing}
                  defaultValue={0}
                  aria-label="Medium"
                  valueLabelDisplay="auto"
                  min={0}
                  max={360}
                  style={{ marginLeft: "2%", width: "97%" }}
                />
              </Row>
              <Row style={{ marginTop: "2vh" }}>
                <Form.Select
                  id="style"
                  onChange={(event) => setMapStyle(event.target.value)}
                  style={{ marginLeft: "2%", marginRight: "2%", width: "96%" }}
                  aria-label="Default select"
                >
                  <option value="osm-carto">stile della mappa</option>
                  <option value="osm-carto">osm carto</option>
                  <option value="osm-bright">osm bright</option>
                  <option value="osm-bright-grey">osm bright grey</option>
                  <option value="osm-bright-smooth">osm bright smooth</option>
                  <option value="klokantech-basic">klokantech basic</option>
                  <option value="osm-liberty">osm liberty</option>
                  <option value="maptiler-3d">maptiler 3d</option>
                  <option value="toner">toner</option>
                  <option value="positron">positron</option>
                  <option value="dark-matter">dark matter</option>
                  <option value="dark-matter-brown">dark matter brown</option>
                </Form.Select>
              </Row>
              <Row style={{ marginTop: "2vh" }}>
                <Accordion>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Markers</Accordion.Header>
                    <Accordion.Body>
                      <ListGroup as="ol">
                        {markers.map((element, index) => (
                          <ListGroup.Item
                            key={index}
                            as="li"
                            className="d-flex justify-content-between align-items-start"
                          >
                            <div className="ms-2">
                              <Row>
                                <Col>
                                  <p style={{ width: "20vw" }}>
                                    latitudine {element.lat}
                                  </p>
                                </Col>
                                <Col>
                                  <p style={{ width: "40vw" }}>
                                    longitudine {element.lon}
                                  </p>
                                </Col>
                              </Row>
                              <Row>
                                <Col>
                                  <p style={{ width: "20vw" }}>colore </p>
                                </Col>
                                <Col style={{ marginTop: "1%" }}>
                                  <div
                                    style={{
                                      width: "15px",
                                      height: "15px",
                                      borderRadius: "50%",
                                      backgroundColor: element.color,
                                    }}
                                  ></div>
                                </Col>
                                <Col>
                                  <p style={{ width: "40vw" }}>
                                    dimensione{" "}
                                    {element.size === "small"
                                      ? "piccola"
                                      : element.size === "medium"
                                        ? "media"
                                        : element.size === "large"
                                          ? "grande"
                                          : element.size === "x-large"
                                            ? "x-grande"
                                            : "xx-grande"}
                                  </p>
                                </Col>
                              </Row>
                            </div>
                            <Button
                              onClick={() => {
                                setTmp1(true);
                                setIndex(index);
                              }}
                              variant="secondary"
                              style={{ marginTop: "2%" }}
                            >
                              <Trash size={icon_size / 3} />
                            </Button>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>

                      <Accordion style={{ marginTop: "2%" }}>
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>
                            <PlusCircleFill size={icon_size / 3} />
                            <span
                              role="button"
                              style={{ marginLeft: "1%", marginBottom: "4px" }}
                            >
                              aggiungi un nuovo marker
                            </span>
                          </Accordion.Header>
                          <Accordion.Body>
                            <Form id="formMarker" onSubmit={handleFormMarker}>
                              <Row style={{ marginTop: "2vh" }}>
                                <Col>
                                  <Form.Label htmlFor="lat">
                                    latitudine{" "}
                                  </Form.Label>
                                  <Form.Control
                                    step="0.0000001"
                                    required
                                    id="lat"
                                    type="number"
                                  />
                                </Col>
                                <Col>
                                  <Form.Label htmlFor="lon">
                                    longitudine{" "}
                                  </Form.Label>
                                  <Form.Control
                                    step="0.0000001"
                                    required
                                    id="lon"
                                    type="number"
                                  />
                                </Col>
                              </Row>
                              <Row style={{ marginTop: "2vh" }}>
                                <Col>
                                  <Form.Label htmlFor="color">
                                    colore{" "}
                                  </Form.Label>
                                  <Form.Control
                                    required
                                    id="color"
                                    type="color"
                                  />
                                </Col>
                                <Col>
                                  <Form.Label htmlFor="size">
                                    dimensione{" "}
                                  </Form.Label>
                                  <Form.Select required id="size">
                                    <option value="medium">
                                      scegli la dimensione del marker
                                    </option>
                                    <option value="small">piccola</option>
                                    <option value="medium">media</option>
                                    <option value="large">grande</option>
                                    <option value="x-large">x-grande</option>
                                    <option value="xx-large">xx-grande</option>
                                  </Form.Select>
                                </Col>
                              </Row>
                              <Row style={{ marginTop: "2vh", width: "20%" }}>
                                <Button variant="primary" type="submit">
                                  Aggiungi
                                </Button>
                              </Row>
                            </Form>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </Row>

              <Card.Text></Card.Text>
            </Card.Body>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "3%",
                marginRight: "5%",
                marginLeft: "5%",
                marginBottom: "3%",
              }}
            >
              {widthImage > 0 && heightImage > 0 && lat !== undefined && (
                <Card.Img height={700} src={url_img} alt="" />
              )}
            </div>
          </Card>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setSalva(true);
              setTmp(true);
            }}
          >
            Salva
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default GeoModal;
