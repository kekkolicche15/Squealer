import {
  Card,
  Button,
  Form,
  ButtonToolbar,
  Image,
  Dropdown,
  CloseButton,
  Alert,
  ListGroup,
  Row,
  Col,
  Container,
  InputGroup,
  FormLabel,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperclip,
  faImages,
  faVideo,
  faUserPlus,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./NuovoMessaggio.css";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  icon_size,
  dataURLtoBlob,
  createFileFromBlob,
  getStringMarkers,
  checkSpecialChars,
} from "../Const.js";
import ImageVideo from "./ImageVideo.jsx";
import { truncate, sendRequest } from "../Const.js";
import GeoModal from "./GeoModal.jsx";
import { Camera2, PersonCircle, Trash, Telegram } from "react-bootstrap-icons";
import Camera from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import { uri, getDate, geo_api_key } from "../Const.js";
import axios from "axios";
import ReactPlayer from "react-player";
import { toast } from "react-toastify";
import RandomImage from "./RandomImage.jsx";
import Wikipedia from "./Wikipedia.jsx";
import useWindowDimensions from "../useWindowDimensions.jsx";

function NuovoMessaggio(props) {
  const { width } = useWindowDimensions();
  const [url_profile_img, setUrl_profile_img] = useState();

  useEffect(() => {
    const fetchImg = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${props.username}/picture`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      setUrl_profile_img(res.url);
    };

    fetchImg();
  }, []);

  const [menuSize, setMenuSize] = useState(0);
  const [quotaImg, setQuotaImg] = useState(1);
  const [quotaVideo, setQuotaVideo] = useState(1);

  const [quotaExtra, setQuotaExtra] = useState(null);

  useLayoutEffect(() => {
    setMenuSize(Math.max(230, width / 2.5));
  }, [width]);

  //queste variabili sulla quota saranno da modificare, e' una cosa temporanea
  const [quota, setQuota] = useState([0, 0, 0]);
  const giornaliera = 0;
  const settimanale = 1;
  const mensile = 2;

  const fetchYouAreMember = async (channel) => {
    const res = await sendRequest(
      new Request(`${uri}channel/${channel}/members/${props.username}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    const json = await res.json();
    return json.response;
  };


  useEffect(() => {
    const fetchQuota = async () => {
      const res = await sendRequest(
        new Request(
          `${uri}user/${props.username}/info/?view=self&fields=score`,
          {
            method: "GET",
            headers: new Headers({
              "Content-Type": "application/json",
            }),
          },
        ),
      );

      const json = await res.json();
      json.quotas.values;
      var quota = [];
      for (var i = 0; i < json.quotas.values.length; i++) {
        quota[i] = json.quotas.values[i];
      }
      setQuota(quota);
      setQuotaResidua(quota);
    };
    const fetchCosts = async () => {
      const res = await sendRequest(
        new Request(`${uri}general/const`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );

      const json = await res.json();
      setQuotaImg(json.imageQuota);
      setQuotaVideo(json.videoQuota);
      setQuotaExtra(json.QuotaExtra);
    };
    fetchQuota();
    fetchCosts();
    handleDebt("GET", "");
  }, []);

  //serve a gestire la quota
  const [showWarning, setShowWarning] = useState(false);
  const [inputText, setInputText] = useState("");
  const [quotaResidua, setQuotaResidua] = useState(quota);
  const [showQuotaResidua, setShowQuotaResidua] = useState(false);
  const [tmpQuota, setTmpQuota] = useState(false);

  //serve a gestire i parametri per la geolocalizzazione per i messaggi temporizzati
  const [geoParams, setGeoParams] = useState({});
  const [isGeo, setIsGeo] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [youInDebt, setYouInDebt] = useState(false);

  const refCheck = useRef(null);

  useEffect(() => {
    if (!isGeo) {
      setGeoParams({});
      setIsChecked(false);
      if (refCheck.current) refCheck.current.click();
    }
  }, [isGeo]);

  //links
  const [Links, setLinks] = useState([]);
  const [tmp, setTmp] = useState(false);

  useEffect(() => {
    if (Links.length === 0) return;

    const fetchData = async () => {
      const urls = [];

      Object.values(Links).forEach((link) => {
        urls.push(
          `https://is.gd/create.php?format=json&url=${encodeURIComponent(
            link.link,
          )}`,
        );
      });

      const promises = [];

      urls.forEach((url) => {
        promises.push(
          axios.get(url).then((response) => response.data.shorturl),
        );
      });

      const datas = await Promise.all(promises);

      datas.forEach((shortLink, index) => {
        setLinks(
          Links.map((el, i) => {
            if (i === index) {
              if (shortLink === undefined) {
                if (Links[i].link.length > 0) {
                  return { link: Links[i].link, shortLink: Links[i].link };
                } else {
                  return { link: Links[i].link, shortLink: "" };
                }
              }
              return { link: Links[i].link, shortLink: shortLink };
            } else {
              return Links[i];
            }
          }),
        );
      });
    };

    fetchData();
  }, [tmp]);

  useEffect(() => {
    var found = false;

    Object.values(Links).forEach((link) => {
      if (link.shortLink === "" || link.shortLink === undefined) found = true;
    });
    if (!found) {
      var words = inputText.split(" ");
      Object.values(Links).forEach((link) => {
        words.forEach((word, index) => {
          if (word === link.link) words[index] = link.shortLink;
        });
      });
      setInputText(words.join(" "));
    }
  }, [Links]);

  useEffect(() => {
    if (inputText.length === 0) return;
    const findLinks = inputText.match(
      /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
    );

    if (findLinks === null) return;

    var words = inputText.split(" ");
    var last_word = words.pop();
    if (findLinks.includes(last_word)) {
      return;
    }

    const validLinks = findLinks.map((link, index) => {
      if (link.includes("https://is.gd/"))
        return { link: link, shortLink: `${link}` };

      var newShortLink;
      if (Links.length > index) {
        newShortLink = Links[index].shortLink;
      } else newShortLink = "";

      return { link: link, shortLink: `${newShortLink}` };
    });

    setLinks(validLinks);
    setTmp(!tmp);
  }, [inputText]);

  //serve per gestire il caricamento di foto o video o geolocalizzazione in nuovi post
  const [selectedResource, setSelectedResource] = useState("");
  const [imageServer, setImageServer] = useState("");
  const [placeholderNewMessage, setPlaceholderNewMessage] = useState(
    props.is_comment ? "scrivi un commento" : "hai in mente un nuovo squeal?",
  );
  const [altImage, setAltImage] = useState("");
  const [isVideo, setIsVideo] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [destinatari, setDestinatari] = useState([]);
  const [showAddDest, setShowAddDest] = useState(true);

  //messaggi temporizzati
  const [counter, setCounter] = useState(1);
  const [period, setPeriod] = useState(1);

  useEffect(() => {
    var Input = 0;

    if (inputText.length !== "undefined") {
      Input += inputText.length * (destinatari.length || 1);
    }

    if (selectedResource.length > 0) {
      if (isVideo) {
        Input += quotaVideo;
      } else {
        Input += quotaImg;
      }
    }
    Input *= counter || 1;
    setShowWarning(
      Input > quota[giornaliera] ||
        Input > quota[settimanale] ||
        Input > quota[mensile],
    );
    setQuotaResidua([
      quota[giornaliera] - Input,
      quota[settimanale] - Input,
      quota[mensile] - Input,
    ]);
  }, [
    selectedResource.length > 0,
    inputText.length,
    tmpQuota,
    destinatari.length,
    counter,
  ]);

  //gestione della camera
  const [showCamera, setShowCamera] = useState(false);

  function handleTakePhoto(dataUri) {
    var myblob = dataURLtoBlob(dataUri);
    var myfile = createFileFromBlob(myblob);
    setIsGeo(false);
    setImageServer(myfile);
    setSelectedResource(dataUri);
    setShowCamera(false);
  }

  function HandleAddDest(event) {
    event.preventDefault();
    setShowAddDest(false);
  }

  async function HandleForm(event) {
    //serve a fare in modo che quando clicco sul bottone submit del form dei marker della geolocation non venga avviato pure questo form
    if (event.target.id === "formMarker") return;
    event.preventDefault();
    var typeMsg = "text";
    if (selectedResource.length > 0) {
      if (isVideo) typeMsg = "video";
      else typeMsg = "image";
    }
    var msg = event.target[0].value;
    const formData = new FormData();
    if (imageServer) formData.append("attachment", imageServer);
    if (msg) formData.append("content", msg);
    formData.append("contentType", typeMsg);
    if (!props.is_comment) formData.append("channels", destinatari);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&apiKey=${geo_api_key}`,
          )
            .then((response) => response.json())
            .then(async (data) => {
              if(data.results[0].county)
                formData.append("location", encodeURIComponent(data.results[0].county));
              await SendPost(formData);
              props.setRefreshPage((prevValue) => {
                return !prevValue;
              });
            }
            );
        },
        async () => {
          //non e' stata abilitata la geolocazione
          await SendPost(formData);
          props.setRefreshPage((prevValue) => {
            return !prevValue;
          });
        },
      );
    } else {
      //geolocation non e' supportata
      await SendPost(formData);
      props.setRefreshPage((prevValue) => {
        return !prevValue;
      });
    }
    setImageServer("");
    setSelectedResource("");
    setInputText("");
    setDestinatari([]);
  }

  const SendPost = async (formData) => {
    var res;
    if (props.is_comment) {
      res = await sendRequest(
        new Request(`${uri}post/${props._id}/replies`, {
          method: "POST",
          body: formData,
        }),
      );
      
    } else {
        res = await sendRequest(
        new Request(`${uri}post/`, {
          method: "POST",
          body: formData,
        }),
      );
    }
    if(res.ok){
        if (props.is_comment) {
            toast.success("aggiunto nuovo commento", { className: "toast-message" });
            props.setShowNewComment(false);
          }
        else {
            toast.success("aggiunto nuovo post", { className: "toast-message" });
        }
    }
    else {
        const json = await res.json();
        toast.error(json.error, { className: "toast-message" });
    }

  };

  //messaggi temporizzati

  const [timerEnabled, setTimerEnabled] = useState(false);

  async function HandleFormTemporized(
    nMess,
    defaultMsg,
    defaultSR,
    typeMsg,
    defaultImageServer,
    defaultDest,
  ) {
    defaultMsg = defaultMsg.replace(/{NUM}/g, `${nMess}`);
    defaultMsg = defaultMsg.replace(/{TIME}/g, `${getDate(true)}`);
    defaultMsg = defaultMsg.replace(/{DATE}/g, `${getDate(false)}`);

    const formData = new FormData();
    if (defaultImageServer) formData.append("attachment", defaultImageServer);
    if (defaultMsg) formData.append("content", defaultMsg);
    formData.append("contentType", typeMsg);

    if (!props.is_comment) formData.append("channels", defaultDest);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&apiKey=${geo_api_key}`,
          )
            .then((response) => response.json())
            .then(async (data) => {
              formData.append("location", encodeURIComponent(data.results[0].county));
              await SendPost(formData);
            });
        },
        async () => {
          //non e' stata abilitata la geolocazione
          formData.append("location", "");
          await SendPost(formData);
        },
      );
    } else {
      //geolocation non e' supportata
      formData.append("location", "");
      await SendPost(formData);
    }
   
    props.setRefreshPage((prevValue) => {
      return !prevValue;
    });
  }

  function error() {
    toast.error("abilita la geolocalizzazione, messaggio da post ricorrente", {
      className: "toast-message",
    });
  }

  function getPosition(nMess, msg, SR, typeMsg, dest, params) {
    async function success(position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const res = await fetch(
        `https://maps.geoapify.com/v1/staticmap?style=${
          params.mapStyle
        }&width=${params.widthImage}&height=${
          params.heightImage
        }&center=lonlat:${longitude},${latitude}&zoom=${params.zoom}&pitch=${
          params.pitch
        }&bearing=${params.bearing}${getStringMarkers(
          params.markers,
        )}&apiKey=REDACTED`,
      );
      const blob = await res.blob();
      const file = createFileFromBlob(blob);
      HandleFormTemporized(nMess, msg, SR, typeMsg, file, dest);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      toast.error(
        "Geolocalizzazione non supportata, messaggio da post ricorrente",
        { className: "toast-message" },
      );
    }
  }

  function avviaTimer(event) {
    event.preventDefault();

    var msg = event.target[0].value;
    var count = counter;
    var defaultPeriod = period;
    var SR = selectedResource;
    var IS;
    //roba per la geolocation
    const isGeoDefault = isChecked;
    var params = {};
    if (isGeoDefault) {
      params.widthImage = geoParams.widthImage;
      params.heightImage = geoParams.heightImage;
      params.zoom = geoParams.zoom;
      params.pitch = geoParams.pitch;
      params.bearing = geoParams.bearing;
      params.mapStyle = geoParams.mapStyle;
      params.markers = geoParams.markers;
    } else {
      IS = imageServer;
    }
    var nMess = 1;
    var typeMsg = "testo";
    var dest = destinatari;
    if (SR.length > 0) {
      if (isVideo) typeMsg = "video";
      else typeMsg = "immagine";
    }

    setImageServer("");
    setSelectedResource("");
    setInputText("");
    setDestinatari([]);
    setPeriod(1);
    setCounter(1);
    refSwitch.current.click();

    toast.info("appena scattato il timer", { className: "toast-message" });

    if (props.is_comment) {
      props.setShowNewComment(false);
    }

    setTimerEnabled(true);
    const timer = setInterval(async () => {
      count--;
      if (isGeoDefault) {
        getPosition(nMess, msg, SR, typeMsg, dest, params);
      } else {
        await HandleFormTemporized(nMess, msg, SR, typeMsg, IS, dest);
      }
      nMess++;
      if (count <= 0) {
        clearInterval(timer);
        setTimerEnabled(false); // Disabilita il timer
        setCounter(1);
        setPeriod(1);
      }
    }, defaultPeriod * 1000);
  }

  const fetchChannelExist = async (name) => {
    if (name[0] === "#") return true;
    const res = await sendRequest(
      new Request(`${uri}channel/${name}/?view=full`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (
      json.error === "Canale non trovato" ||
      json.error === "Route non trovata"
    ) {
      toast.error(json.error, { className: "toast-message" });
      return false;
    } else {
      if (json.privacy === "private") {
        const res1 = await sendRequest(
          new Request(`${uri}channel/${name}/members/${props.username}`, {
            method: "GET",
            headers: new Headers({
              "Content-Type": "application/json",
            }),
          }),
        );
        const json = await res1.json();
        if (json.response) return true;
        else {
          toast.error("non sei membro del canale", {
            className: "toast-message",
          });
          return false;
        }
      } else return true;
    }
  };

  const handleDebt = async (mode, query) => {
    const res = await sendRequest(
      new Request(`${uri}user/quotaExtra/${query}`, {
        method: `${mode}`,
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (res.ok) {
      if (mode === "GET") setYouInDebt(json.response);
      else if (mode === "POST" && query === "?debt=true") {
        setYouInDebt(true);
        toast.success(
          `ti sono stati accreditati ${quotaExtra} punti di quota extra`,
          { className: "toast-message" },
        );
      }
    } else {
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const [currDest, setCurrDest] = useState("");

  async function handleDest(currDest1) {
    
    currDest1 = currDest1 || currDest;
    if (!currDest1) return;

    //controllo se il destinatario e' gia' stato aggiunto
    if (destinatari.length > 0) {
      if (destinatari.includes(currDest1)) {
        toast.error("destinatario giá aggiunto", {
          className: "toast-message",
        });
        setCurrDest("");
        return;
      }
    }
    if (currDest1[0] !== "#") {
      //constrollo se il canale esiste
      const exist = await fetchChannelExist(currDest1);
      if (!exist) {
        setCurrDest("");
        return;
      }
      //constrollo se sei iscritto al canale e se quindi puoi inviare post
      const youCanPost = await fetchYouAreMember(currDest1);
      if (!youCanPost) {
        toast.error("non sei iscritto al canale", {
          className: "toast-message",
        });
        return;
      }
    }

    setDestinatari((prevArray) => {
      return [...prevArray, currDest1];
    });
    setShowAddDest(true);
    setCurrDest("");
  }

  const [showSwitch, setShowSwitch] = useState(false);
  const refSwitch = useRef(null);
  const [showAlert, setShowAlert] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  

  useEffect(() => {
    const fetchSuggestions = async () => {
      const res = await sendRequest(
        new Request(
          `${uri}channel/?name=${encodeURIComponent(currDest)}&user=${
            props.username
          }`,
          {
            method: "GET",
            headers: new Headers({
              "Content-Type": "application/json",
            }),
          },
        ),
      );
      const json = await res.json();
      setSuggestions(
        json.page.map((el) => {
          return el.name;
        }),
      );
    };

    if (!currDest) return;

    if (!hideSuggestions) fetchSuggestions();
    else {
      setSuggestions([]);
      setHideSuggestions(false);
    }
  }, [currDest]);

  return (
    <Card
      style={{
        marginLeft: `${width > 900 ? "250px" : "20px"}`,
        marginRight: `${width > 900 ? "250px" : "20px"}`,
      }}
    >
      <Card.Body>
        <Card.Title className="d-flex justify-content-between">
          <Image
            src={url_profile_img}
            alt={props.username}
            roundedCircle
            width={icon_size}
          />{" "}
          <span style={{ marginTop: "1%" }}>{props.username}</span>
          {!props.is_comment && (
            <Dropdown autoClose="outside" drop="up">
              <Dropdown.Toggle
                style={{ marginTop: "2%", fontSize: `${props.fontSize}` }}
                variant="secondary"
              >
                Canali
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ width: `${menuSize}px` }}>
                {showAddDest ? (
                  <>
                    <Dropdown.Item
                      style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                      as="button"
                      variant="secundary"
                      onClick={HandleAddDest}
                    >
                      <FontAwesomeIcon
                        icon={faUserPlus}
                        style={{ color: "white" }}
                      />{" "}
                      Aggiungi canale di destinazione
                    </Dropdown.Item>
                  </>
                ) : (
                  <>
                    {currDest && (
                      <>
                        {suggestions.map((el, index) => (
                          <Dropdown.Item
                            key={index}
                            style={{
                              marginTop: "10px",
                              marginLeft: "10px",
                              width: "98%",
                              opacity: "0.8",
                            }}
                            onClick={async () => {
                              setHideSuggestions(true);
                              setCurrDest(el);
                              await handleDest(el)
                            }}
                          >
                            <span style={{ paddingTop: "10px" }}>{el}</span>
                          </Dropdown.Item>
                        ))}
                        {suggestions.length > 0 && (
                          <Dropdown.Divider style={{ marginBottom: "15px" }} />
                        )}
                      </>
                    )}
                    <Dropdown.Item as="div" bsPrefix="my-dropdown-item">
                      <Container fluid>
                        <Row className="align-items-center">
                          <Col sm={9} xs={9}>
                            <Form.Control
                              value={currDest}
                              onChange={(event) => {
                                if(checkSpecialChars(event.target.value)){
                                    toast.error("non puoi inserire caratteri speciali", { className: "toast-message" });
                                }
                                else{
                                    setCurrDest(event.target.value)
                                }
                                }
                              }
                              type="text"
                              id="my-input"
                            />
                          </Col>
                          <Col
                            sm={3}
                            xs={3}
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <Telegram   
                              onClick={async ()=> await handleDest()}         
                              role="button"
                              size={"35px"}
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
                  </>
                )}
                {destinatari.length > 0 && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.ItemText>
                      <span style={{ fontWeight: "bold" }}>Canali</span>
                    </Dropdown.ItemText>
                  </>
                )}
                {destinatari.map((element, index) => (
                  <Row style={{ marginTop: "10px" }} key={index}>
                    <Col xs={10}>
                      <Dropdown.Item
                        as="div"
                        style={{
                          wordWrap: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <PersonCircle size={icon_size / 3} /> {element}
                      </Dropdown.Item>
                    </Col>
                    <Col
                      xs={2}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "-1vh",
                      }}
                    >
                      <Button
                        variant="secundary"
                        onClick={() =>
                          setDestinatari(
                            destinatari.filter((el, i) => i !== index),
                          )
                        }
                      >
                        <Trash size={icon_size / 3.5} />{" "}
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Card.Title>
        <div>
          <Form
            id="form"
            onSubmit={async (event) => {
              if (event.target.id === "formMarker") return;
              if (showSwitch) {
                if (timerEnabled) {
                  event.preventDefault();
                  toast.error("hai giá inviato un messaggio temporizzato", {
                    className: "toast-message",
                  });
                } else {
                  avviaTimer(event);
                }
              } else {
                await HandleForm(event);

              }
            }}
          >
            <Form.Group className="mb-3">
              <Form.Control
                id="inputText"
                value={inputText}
                style={selectedResource ? { border: "none", outline: "0" } : {}}
                as="textarea"
                rows={4}
                placeholder={placeholderNewMessage}
                onChange={(event) => {
                  setAltImage(event.target.value);
                  setInputText(event.target.value);
                }}
              />
              
              {showWarning && (
                <Alert
                  style={{
                    marginTop: "2vh",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  variant="danger"
                >
                  {" "}
                  <span>hai superato il numero massimo di quota</span>
                  {!youInDebt && inputText.length > 0 && (
                    <Button
                      variant="outline-danger"
                      style={{ fontSize: `${props.fontSize}` }}
                      onClick={async () => {
                        await handleDebt("POST", "?debt=true");
                      }}
                    >
                      vuoi ottenere quota extra che dovrai pagare in seguito?
                    </Button>
                  )}
                </Alert>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "3%",
                  marginBottom: "10px",
                }}
              >
                {!isVideo && selectedResource.length > 0 && (
                  <Image
                    style={
                      showWarning
                        ? {
                            border: "4px solid red",
                            borderRadius: "20px",
                          }
                        : { borderRadius: "20px" }
                    }
                    src={selectedResource}
                    alt={
                      selectedResource.length > 0
                        ? truncate(true, altImage)
                        : ""
                    }
                    fluid
                  />
                )}
                {isVideo && selectedResource.length > 0 && (
                  <ReactPlayer
                    url={selectedResource}
                    alt={truncate(true, altImage)}
                    controls={true}
                    style={
                      showWarning
                        ? {
                            border: "5px solid red",
                            borderRadius: "20px",
                          }
                        : { borderRadius: "20px" }
                    }
                  ></ReactPlayer>
                )}
                {selectedResource.length > 0 && (
                  <CloseButton
                    onClick={() => {
                      setSelectedResource("");
                      setImageServer("");
                      setPlaceholderNewMessage(
                        props.is_comment
                          ? "scrivi un commento"
                          : "hai in mente un nuovo squeal?",
                      );
                      setAltImage("");
                      setIsVideo(false);
                      setIsGeo(false);
                    }}
                    style={{ marginLeft: "2%" }}
                  />
                )}
                {showCamera && (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Camera
                      onTakePhoto={(dataUri) => {
                        handleTakePhoto(dataUri);
                        setPlaceholderNewMessage(
                          "aggiungi una descrizione all'immagine",
                        );
                      }}
                    />{" "}
                    <CloseButton
                      style={{ marginLeft: "2%" }}
                      onClick={() => {
                        setShowCamera(false);
                        setPlaceholderNewMessage(
                          props.is_comment
                            ? "scrivi un commento"
                            : "hai in mente un nuovo squeal?",
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              <div
                style={
                  showSwitch
                    ? {
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "10px",
                      }
                    : {
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "30px",
                      }
                }
              >
                <Form.Check
                  ref={refSwitch}
                  type="switch"
                  id="pippo"
                  label="Messaggi temporizzati"
                  onClick={() => {
                    if (showSwitch) {
                      setCounter(1);
                      setPeriod(1);
                    }
                    setShowSwitch(!showSwitch);
                  }}
                />
              </div>
              {showSwitch && (
                <div
                  style={{ marginTop: "10px", fontSize: `${props.fontSize}` }}
                >
                  <Alert show={showAlert} variant="primary">
                    <Alert.Heading>
                      Messaggi temporizzati che si ripetono ogni TOT secondi
                    </Alert.Heading>
                    <p>{`Nota: nel testo del tuo squeal puoi aggiungere il numero del messaggio, la data e l'orario come nell'esempio:`}</p>
                    <p>{`Ciao a tutti, questo è il mio messaggio n. {NUM} delle ore {TIME} del giorno {DATE}`}</p>
                    <p
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        color: "red",
                      }}
                    >
                      puoi inviare un solo messaggio temporizzato per volta
                    </p>
                    <hr />
                    <div className="d-flex justify-content-end">
                      <Button
                        onClick={() => setShowAlert(false)}
                        variant="outline-secondary"
                      >
                        Chiudi
                      </Button>
                    </div>
                  </Alert>
                  {!showAlert && (
                    <Button
                      variant="secondary"
                      onClick={() => setShowAlert(true)}
                    >
                      Show Alert
                    </Button>
                  )}
                  <Row style={{ marginTop: "10px" }}>
                    <Col>
                      <FormLabel htmlFor="si">
                        abilitá geolocalizzazione ricorrente
                      </FormLabel>
                      <Form.Check // prettier-ignore
                        type="radio"
                        id="si"
                        label="si"
                        name="geolocation"
                        onClick={(e) => {
                          if (isGeo) {
                            setIsChecked(true);
                          } else {
                            e.preventDefault();
                            toast.error("accedi prima alla geolocalizzazione", {
                              className: "toast-message",
                            });
                          }
                        }}
                      />
                      <Form.Check // prettier-ignore
                        ref={refCheck}
                        defaultChecked
                        type="radio"
                        id="no"
                        label="no"
                        name="geolocation"
                        onClick={() => {
                          setIsChecked(false);
                        }}
                      />
                    </Col>
                  </Row>
                  <Row style={{ marginTop: "10px", marginBottom: "30px" }}>
                    <Col>
                      <Form.Label htmlFor="period">
                        intervallo in secondi fra i messaggi
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>Periodo</InputGroup.Text>
                        <Form.Control
                          id="period"
                          type="number"
                          min="1"
                          required
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col>
                      <Form.Label htmlFor="repeat">
                        numero di messaggi da inviare
                      </Form.Label>
                      <InputGroup>
                        <InputGroup.Text>Ripeti</InputGroup.Text>
                        <Form.Control
                          id="repeat"
                          value={counter}
                          onChange={(event) => setCounter(event.target.value)}
                          type="number"
                          min="1"
                          required
                        />
                      </InputGroup>
                    </Col>
                  </Row>
                </div>
              )}
            </Form.Group>

            <ButtonToolbar className="justify-content-between">
              <Dropdown autoClose="outside">
                <Dropdown.Toggle
                  disabled={selectedResource.length > 0}
                  variant="secondary"
                >
                  <FontAwesomeIcon icon={faPaperclip} width={props.fontSize} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    as="div"
                    role="button"
                    onClick={() => setShowCamera(true)}
                  >
                    <Camera2 size={icon_size / 3} style={{ color: "white" }} />
                    <span> scatta una foto</span>
                  </Dropdown.Item>
                  <Dropdown.Item as="div" role="button">
                    <FontAwesomeIcon
                      icon={faImages}
                      style={{ color: "white" }}
                    />
                    <ImageVideo
                      setIsGeo={setIsGeo}
                      setImageServer={setImageServer}
                      selectedResource={selectedResource}
                      setSelectedResource={setSelectedResource}
                      setPlaceholderNewMessage={setPlaceholderNewMessage}
                      type_msg="image/*"
                      name_type_msg=" carica una foto"
                      setIsVideo={setIsVideo}
                    />
                  </Dropdown.Item>
                  <Dropdown.Item as="div" role="button">
                    <FontAwesomeIcon
                      icon={faImages}
                      style={{ color: "white" }}
                    />
                    <RandomImage
                      setIsGeo={setIsGeo}
                      setImageServer={setImageServer}
                      setSelectedResource={setSelectedResource}
                      setPlaceholderNewMessage={setPlaceholderNewMessage}
                    />
                  </Dropdown.Item>
                  <Dropdown.Item as="div" role="button">
                    <FontAwesomeIcon
                      icon={faVideo}
                      style={{ color: "white" }}
                    />
                    <ImageVideo
                      setIsGeo={setIsGeo}
                      setImageServer={setImageServer}
                      selectedResource={selectedResource}
                      setSelectedResource={setSelectedResource}
                      setPlaceholderNewMessage={setPlaceholderNewMessage}
                      type_msg="video/mp4"
                      name_type_msg=" carica un video"
                      setIsVideo={setIsVideo}
                    />
                  </Dropdown.Item>
                  <Dropdown.Item
                    as="div"
                    role="button"
                    onClick={() => {
                      setShowModal(true);
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faMapMarkerAlt}
                      style={{ color: "white" }}
                    />
                    <span> Geolocalizzazione</span>
                    <GeoModal
                      setIsGeo={setIsGeo}
                      setGeoParams={setGeoParams}
                      setImageServer={setImageServer}
                      showModal={showModal}
                      setShowModal={setShowModal}
                      selectedResource={selectedResource}
                      setSelectedResource={setSelectedResource}
                    />
                  </Dropdown.Item>
                  <Wikipedia
                    setInputText={setInputText}
                    inputText={inputText}
                  />
                </Dropdown.Menu>
              </Dropdown>
              <div style={{ marginTop: "-2vh" }}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span
                    style={{ cursor: "pointer" }}
                    role="button"
                    onClick={() => {
                      setShowQuotaResidua(!showQuotaResidua);
                      setTmpQuota(!tmpQuota);
                    }}
                  >
                    <strong>quota residua</strong>
                  </span>
                </div>
                {showQuotaResidua && (
                  <ListGroup
                    style={{
                      maxHeight: "7.5vh",
                      display: "flex",
                      justifyContent: "center",
                      position: "relative",
                    }}
                    horizontal
                  >
                    <ListGroup.Item>
                      <p>
                        <strong>giornaliera</strong>
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "-1.5vh",
                        }}
                      >
                        <p>{quotaResidua[giornaliera]}</p>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>
                        <strong>settimanale</strong>
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "-1.5vh",
                        }}
                      >
                        <p>{quotaResidua[settimanale]}</p>
                      </div>
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <p>
                        <strong>mensile</strong>
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          marginTop: "-1.5vh",
                        }}
                      >
                        <p>{quotaResidua[mensile]}</p>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                )}
              </div>
              <Button
                style={{ fontSize: `${props.fontSize}` }}
                variant="primary"
                type="submit"
                disabled={
                  showWarning || (!destinatari.length && !props.is_comment)
                }
              >
                Pubblica
              </Button>
            </ButtonToolbar>
          </Form>
        </div>
      </Card.Body>
    </Card>
  );
}
export default NuovoMessaggio;
