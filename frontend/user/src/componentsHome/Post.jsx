

import {
  Card,
  Image,
  Dropdown,
  Button,
  Modal,
  CloseButton,
  Col,
  Row,
  Spinner,
  Tooltip,
  OverlayTrigger,
  Nav,
} from "react-bootstrap";

import TooltipPopularity from "./TooltipPopularity";
import {
  PlusCircleFill,
  Trash,
  ChatSquare,
  ArrowUpCircle,
  Eye,
} from "react-bootstrap-icons";
import ContenutoPost from "./ContenutoPost";
import {
  icon_size,
  fetchDeletePost,
  uri,
  sendRequest,
  fetchImgPreview,
  fetchAttachment,
  baseUrl,
  NoLogin,
} from "../Const.js";
import { useState, useEffect } from "react";
import "./Post.css";
import NuovoMessaggio from "./NuovoMessaggio";
import useWindowDimensions from "../useWindowDimensions.jsx";
import { Link } from "react-router-dom";

function Post(props) {
  const { width } = useWindowDimensions();

  const [tmpUserReaction, setTmpUserReaction] = useState(props.userReaction);

  const [positiveReactions, setPositiveReactions] = useState([
    { clicked: false, total: 0 },
    {
      clicked: false,
      total: 0,
    },
    { clicked: false, total: 0 },
    { clicked: false, total: 0 },
  ]);
  const [negativeReactions, setNegativeReactions] = useState([
    { clicked: false, total: 0 },
    {
      clicked: false,
      total: 0,
    },
    { clicked: false, total: 0 },
    { clicked: false, total: 0 },
  ]);

  const [isPositive, setIsPositive] = useState(false);
  const [index, setIndex] = useState(-1);
  const [tmp, setTmp] = useState(false);

  useEffect(() => {
    if(props.is_comment)	return;
    setPositiveReactions([
      {
        clicked: 1 === props.userReaction,
        total: (props.reactions["1"] || 0),
      },
      { clicked: 2 === props.userReaction, total: props.reactions["2"] || 0 },
      {
        clicked: 3 === props.userReaction,
        total: props.reactions["3"] || 0,
      },
      { clicked: 4 === props.userReaction, total: props.reactions["4"] || 0 },
    ]);
    setNegativeReactions([
      {
        clicked: -1 === props.userReaction,
        total: props.reactions["-1"] || 0,
      },
      { clicked: -2 === props.userReaction, total: props.reactions["-2"] || 0 },
      {
        clicked: -3 === props.userReaction,
        total: props.reactions["-3"] || 0,
      },
      { clicked: -4 === props.userReaction, total: props.reactions["-4"] || 0 },
    ]);

  }, []);



  const [showNewComment, setShowNewComment] = useState(false);

  const [comments, setComments] = useState([]);

  const [pageComments, setPageComments] = useState(1);
  const [refreshPage, setRefreshPage] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  //serve a gestire la concorrenza delle reazioni
  const [waitResServer, setWaitResServer] = useState(false);

  const fetchCreateReaction = async (index) => {
    var options;

    if (tmpUserReaction === 0) {
      options = {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ reaction: index }),
      };
      setTmpUserReaction(index);
    } else if (tmpUserReaction === index) {
      options = {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      };
      setTmpUserReaction(0);
    } else {
      options = {
        method: "PATCH",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ reaction: index }),
      };
      setTmpUserReaction(index);
    }

    await sendRequest(
      new Request(`${uri}post/${props._id}/reactions`, options),
    );
  };

  const fetchReplies = async () => {
    const res = await sendRequest(
      new Request(`${uri}post/${props._id}/replies?page=${pageComments}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (json.page){
        const promises = json.page.map(async (el) => {
          const url_img_sender = await fetchImgPreview("user", el.author);
          var attachment = "";
          if (el.contentType !== "text")
            attachment = await fetchAttachment(el._id, "post");
          return {
            url_img_sender: url_img_sender,
            username_sender: el.author,
            username_channel: el.channel,
            type_msg: el.contentType,
            _id: el._id,
            msg: el.content || "",
            attachment: attachment || "",
            popularity: el.popularity,
            location: el.location || "",
            time: el.date + " " + el.time,
            views: el.views,
            userReaction: el.userReaction,
            reactions: el.reactions,
          };
        });
        Promise.all(promises).then((results) => {
          setComments([...results]);
        });
    }
    setIsLoadingPosts(false);
  };

  useEffect(() => {
    if (props.is_comment || !props._id) return;

    fetchReplies();
  }, [pageComments, refreshPage]);

  useEffect(() => {
    //roba per gestire la concorrenza delle reazioni
    if(waitResServer) return;

    setWaitResServer(true);

    if (isPositive) {
      fetchCreateReaction(index + 1);
      setNegativeReactions(
        negativeReactions.map((el) => {
          if (el.clicked) {
            return { clicked: false, total: el.total - 1 };
          } else return { clicked: false, total: el.total };
        }),
      );

      setPositiveReactions(
        positiveReactions.map((value, i) => {
          if (i === index) {
            if (!value.clicked) {
              return { clicked: !value.clicked, total: value.total + 1 };
            }
          }
          if (value.clicked) return { clicked: false, total: value.total - 1 };
          else return { clicked: false, total: value.total };
        }),
      );
    } else if (index !== -1) {
      fetchCreateReaction(-(index + 1));
      setPositiveReactions(
        positiveReactions.map((el) => {
          if (el.clicked) return { clicked: false, total: el.total - 1 };
          else return { clicked: false, total: el.total };
        }),
      );
      setNegativeReactions(
        negativeReactions.map((value, i) => {
          if (i === index) {
            if (!value.clicked) {
              return { clicked: !value.clicked, total: value.total + 1 };
            }
          }
          if (value.clicked) return { clicked: false, total: value.total - 1 };
          else return { clicked: false, total: value.total };
        }),
      );
    }
    setWaitResServer(false);
  }, [tmp]);

  //roba per eliminare il post
  const [showModal, setShowModal] = useState(false);

  //modal per far vedere i commenti al post
  const [modalComments, setModalComments] = useState(false);

  async function deleteComments(index, id) {
    setRefreshPage((prevValue) => {
      return !prevValue;
    });

    await fetchDeletePost(id);
    setComments((prevArray) => {
      return prevArray.filter((el, i) => i !== index);
    });
  }

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      visualizzazioni
    </Tooltip>
  );


  return (
    <div>
      {/*Modal per far vedere i commenti al post */}
      <Modal centered show={modalComments} fullscreen>
        <div style={{ overflowY: "auto" }}>
          <Modal.Title style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1vh",
              }}
            >
              <div
                style={{ cursor: "pointer" }}
                role="button"
                onClick={() => {
                  setModalComments(false);
                }}
              >
                <ArrowUpCircle size={icon_size / 1.5} />
              </div>
            </div>
          </Modal.Title>
          <div style={{ marginTop: "-3vh" }}>
            <Post
              is_comment={true}
              fontSize={props.fontSize}
              is_profile={props.is_profile}
              url_img_channel={props.url_img_channel}
              username_channel={props.username_channel}
              username_sender={props.username_sender}
              url_img_sender={props.url_img_sender}
              time={props.time}
              views={props.views}
              location={props.location}
              type_msg={props.type_msg}
              attachment={props.attachment}
              msg={props.msg}
              popularity={props.popularity}
            />
          </div>
          <hr />
          {sessionStorage.getItem("refreshToken") !== NoLogin && (
            <>
              <a
                style={{ marginLeft: "1vw" }}
                href=""
                onClick={(event) => {
                  event.preventDefault();
                  setShowNewComment(!showNewComment);
                }}
              >
                {showNewComment ? "nascondi" : "aggiungi commento"}
              </a>

              {showNewComment && (
                <div style={{ marginTop: "2vh" }}>
                  <NuovoMessaggio
                    setRefreshPage={setRefreshPage}
                    _id={props._id}
                    setShowNewComment={setShowNewComment}
                    is_comment={true}
                    fontSize={props.fontSize}
                    username={props.ownUsername}
                    url_img_channel={props.url_img_channel}
                    username_channel={props.username_channel}
                  />
                </div>
              )}
            </>
          )}
          <p style={{ marginTop: "2vh", marginLeft: "1vw", fontSize: "30px" }}>
            <strong>Commenti</strong>
          </p>
          <div style={{ overflowY: "auto" }}>
            {comments.map((element, index) => (
              <Post
                _id={element._id}
                deleteComments={deleteComments}
                deletePost={undefined}
                index={index}
                isChannel={props.isChannel}
                fontSize={props.fontSize}
                ownUsername={props.ownUsername}
                url_profile_img={props.url_profile_img}
                key={Math.random()}
                is_profile={false}
                username_sender={element.username_sender}
                url_img_sender={element.url_img_sender}
                time={element.time}
                getIsDeletable={element.getIsDeletable}
                username_channel={props.username_channel}
                url_img_channel={props.url_img_channel}
                location={element.location}
                type_msg={element.type_msg}
                attachment={element.attachment}
                msg={element.msg}
                popularity={element.popularity}
                isDeletable={props.isDeletable}
                views={element.views}
                reactions={element.reactions}
                userReaction={element.userReaction}
              />
            ))}
            {isLoadingPosts ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "100px",
                }}
              >
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "20px",
                  marginBottom: "20px",
                  marginRight: "10px",
                  marginLeft: "10px",
                }}
              >
                <Button
                  size="sm"
                  style={{ fontSize: `${props.fontSize}` }}
                  disabled={pageComments <= 1}
                  variant="primary"
                  onClick={async () => {
                    setComments([]);
                    setIsLoadingPosts(true);
                    await new Promise((resolve) => setTimeout(resolve, 400));
                    setPageComments((prevValue) => {
                      return prevValue - 1;
                    });
                  }}
                >
                  pagina precedente
                </Button>
                <Button
                  size="sm"
                  style={{ fontSize: `${props.fontSize}` }}
                  disabled={comments.length === 0}
                  variant="primary"
                  onClick={async () => {
                    setComments([]);
                    setIsLoadingPosts(true);
                    await new Promise((resolve) => setTimeout(resolve, 400));
                    setPageComments((prevValue) => {
                      return prevValue + 1;
                    });
                  }}
                >
                  pagina successiva
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Card
        style={{
          marginLeft: `${width > 900 ? "250px" : "20px"}`,
          marginRight: `${width > 900 ? "250px" : "20px"}`,
          marginTop: "5vh",
          fontSize: `${props.fontSize}`,
        }}
      >
        <Modal centered show={showModal} size="lg">
          <Modal.Title>
            <Row>
              <Col
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginLeft: "20%",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    marginTop: "0.5vh",
                  }}
                >
                  <strong>
                    {props.deleteComments ? "Elimina commento" : "Elimina post"}
                  </strong>
                </span>
              </Col>
              <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                <CloseButton
                  style={{ marginRight: "0.5vw", marginTop: "0.8vh" }}
                  onClick={() => {
                    setShowModal(false);
                  }}
                />
              </Col>
            </Row>
          </Modal.Title>
          <hr />
          <Modal.Body>
            <div
              style={{
                fontSize: "18px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <p>
                {props.deleteComments
                  ? "sei sicuro di voler eliminare il commento?"
                  : "sei sicuro di voler eliminare il post?"}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "5vh",
              }}
            >
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                No
              </Button>
              <Button
                size="lg"
                variant="primary"
                onClick={async () => {
                  setShowModal(false);
                  if (props.deletePost === undefined) {
                    await props.deleteComments(props.index, props._id);
                  } else await props.deletePost(props.index, props._id);
                }}
              >
                Si
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        <Card.Header>
          <Row style={{ marginBottom: "30px" }}>
            <Col>
              <span>{props.time}</span>
            </Col>
            <Col style={{ display: "flex", justifyContent: "center" }}>
              <span>{decodeURIComponent(props.location) !== "undefined" ? decodeURIComponent(props.location) : " "}</span>
            </Col>
            <Col style={{ display: "flex", justifyContent: "flex-end" }}>
              <OverlayTrigger
                placement="top"
                delay={{ show: 250, hide: 400 }}
                overlay={renderTooltip}
              >
                <div>
                  <Eye
                    size={icon_size / 2.5}
                    style={{ marginRight: "4px", marginTop: "-5px" }}
                  />
                  <span> {`${props.views}`}</span>
                </div>
              </OverlayTrigger>
            </Col>
          </Row>
          {props.is_profile || props.isExternProfile ? (
            <>
              <Row style={{ marginTop: "10px" }}>
                <Col>
                  <Image
                    src={props.url_img_channel}
                    style={{ maxWidth: `calc(${icon_size}px + 70px)`, maxHeight: `calc(${icon_size}px + 70px)` }}
                    alt={`foto profilo del canale ${props.username_channel}`}
                    roundedCircle
                    width={icon_size} height={icon_size}
                  />{" "}
                </Col>
                <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Nav.Link
                    as={Link}
                    to={(props.username_channel[0] === "#") ? `${baseUrl}channel/${props.username_channel.replace("#", "%23")}` : `${baseUrl}channel/${props.username_channel}`}
                  >
                    <span
                      style={{
                        marginLeft: "10px",
                        fontWeight: "bold",
                        fontSize: `calc(${props.fontSize} + 4px)`,
                        marginTop: "10px",
                      }}
                    >
                      {props.username_channel}
                    </span>
                  </Nav.Link>
                </Col>
              </Row>
            </>
          ) : props.isChannel || props.deleteComments ? (
            <>
              <div style={{ marginTop: "10px" }}>
                <Row>
                  <Col>
                    <Image
                      src={props.url_img_sender}
                      style={{ maxWidth: `calc(${icon_size}px + 70px)`, maxHeight: `calc(${icon_size}px + 70px)` }}
                      alt={`foto profilo del canale ${props.username_sender}`}
                      roundedCircle
                      width={icon_size} height={icon_size}
                    />{" "}
                  </Col>
                  <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Nav.Link
                      as={Link}
                      to={`${baseUrl}user/${props.username_sender}`}
                    >
                      <span
                        style={{
                          marginLeft: "10px",
                          fontWeight: "bold",
                          fontSize: `calc(${props.fontSize} + 4px)`,
                          marginTop: "10px",
                        }}
                      >
                        {props.username_sender}
                      </span>
                    </Nav.Link>
                  </Col>
                </Row>
              </div>
            </>
          ) : (
            <>
              <Row>
                <Col>
                  <Image
                    src={props.url_img_channel}
                    style={{ maxWidth: `calc(${icon_size}px + 70px)`, maxHeight: `calc(${icon_size}px + 70px)` }}
                    alt={`foto profilo del canale ${props.username_channel}`}
                    roundedCircle
                    width={icon_size} height={icon_size}
                  />{" "}
                </Col>
                <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Nav.Link
                    as={Link}
                    to={(props.username_channel[0] === "#") ? `${baseUrl}channel/${props.username_channel.replace("#", "%23")}` : `${baseUrl}channel/${props.username_channel}`}
                  >
                    <span
                      style={{
                        fontSize: `calc(${props.fontSize} + 2px)`,
                        fontWeight: "bold",
                      }}
                    >
                      {props.username_channel}
                    </span>
                  </Nav.Link>
                </Col>
              </Row>
              <Row style={{ marginTop: "20px" }}>
                <Col>
                  <Image
                    src={props.url_img_sender}
                    style={{ maxWidth: `calc(${icon_size}px + 70px)`, maxHeight: `calc(${icon_size}px + 70px)`}}
                    alt={`foto profilo del canale ${props.username_sender}`}
                    roundedCircle
                    width={icon_size} height={icon_size}
                  />{" "}
                </Col>
                <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Nav.Link
                    as={Link}
                    to={`${baseUrl}user/${props.username_sender}`}
                  >
                    <span
                      style={{
                        fontSize: `calc(${props.fontSize} + 2px)`,
                        fontWeight: "bold",
                      }}
                    >
                      {props.username_sender}
                    </span>
                  </Nav.Link>
                </Col>
              </Row>
            </>
          )}
        </Card.Header>

        <Card.Body>
          <ContenutoPost
            references = {props.references}
            popularity={props.popularity}
            is_comment={props.is_comment}
            is_profile={props.is_profile}
            type_msg={props.type_msg}
            msg={props.msg}
            attachment={props.attachment}
          />
        </Card.Body>

        {!props.is_comment && (
          <Card.Footer>
            <>
              <Row>
                <Col>
                  <Dropdown focusFirstItemOnShow="true">
                    <Dropdown.Toggle
                      style={{ marginTop: "1vh" }}
                      variant="secondary"
                      size="sm"
                    >
                      <PlusCircleFill
                        size={icon_size / 3}
                        style={{ marginBottom: "-20%" }}
                      />
                      <span
                        role="button"
                        style={{
                          marginLeft: "10px",
                          fontSize: `${props.fontSize}`,
                        }}
                      >
                        {" "}
                        dai reazione{" "}
                      </span>
                      <p
                        role="button"
                        style={{
                          marginLeft: "10px",
                          fontSize: `${props.fontSize}`,
                        }}
                      >
                        {" "}
                        positiva
                      </p>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {positiveReactions[0].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(0);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>👍</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(0);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                👍
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {positiveReactions[0].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {positiveReactions[1].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(1);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>😀</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(1);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                😀
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {positiveReactions[1].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {positiveReactions[2].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(2);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>😄</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(2);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                😄
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {positiveReactions[2].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {positiveReactions[3].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(3);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>😍</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(true);
                              setIndex(3);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                😍
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {positiveReactions[3].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
                <Col>
                  <Dropdown
                    style={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <Dropdown.Toggle
                      style={{ marginTop: "1vh", marginBottom: "1vh" }}
                      variant="secondary"
                      size="sm"
                    >
                      <PlusCircleFill
                        size={icon_size / 3}
                        style={{ marginBottom: "-20%" }}
                      />
                      <span
                        role="button"
                        style={{
                          marginLeft: "10px",
                          fontSize: `${props.fontSize}`,
                        }}
                      >
                        {" "}
                        dai reazione{" "}
                      </span>
                      <p
                        role="button"
                        style={{
                          marginLeft: "10px",
                          fontSize: `${props.fontSize}`,
                        }}
                      >
                        {" "}
                        negativa
                      </p>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {negativeReactions[0].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(0);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>👎</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(0);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                👎
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {negativeReactions[0].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {negativeReactions[1].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(1);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>🙁</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(1);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                🙁
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {negativeReactions[1].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {negativeReactions[2].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(2);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>😵</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(2);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                😵
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {negativeReactions[2].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                      <Dropdown.Item
                        disabled={
                          sessionStorage.getItem("refreshToken") === NoLogin || waitResServer
                        }
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {negativeReactions[3].clicked ? (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(3);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px" }}>😠</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTmp(!tmp);
                              setIsPositive(false);
                              setIndex(3);
                            }}
                          >
                            <div style={{ marginTop: "-8px" }}>
                              <span style={{ fontSize: "28px", opacity: 0.5 }}>
                                😠
                              </span>
                            </div>
                          </div>
                        )}
                        <span>
                          <strong style={{ fontSize: `${props.fontSize}` }}>
                            {negativeReactions[3].total}
                          </strong>
                        </span>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Col>
              </Row>
            </>

            <div
              style={{
                marginTop: "2vh",
                marginBottom: "1vh",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              {props.isDeletable(props.username_sender) &&
                sessionStorage.getItem("refreshToken") !== NoLogin && (
                  <>
                    <div
                      style={{ cursor: "pointer", marginTop: "-5px" }}
                      role="button"
                      onClick={() => {
                        setShowModal(true);
                      }}
                    >
                      <Trash size={icon_size / 3} />
                    </div>
                  </>
                )}
              <>
                <div
                  style={{ cursor: "pointer", marginBottom: "-2px" }}
                  role="button"
                  onClick={async () => {
                    await fetchReplies();
                    setModalComments(true);
                  }}
                >
                  <ChatSquare size={icon_size / 3} />
                </div>
              </>
              {props.popularity !== "normal" && (
                <>
                  <TooltipPopularity popularity={props.popularity} />
                </>
              )}
            </div>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
}
export default Post;
