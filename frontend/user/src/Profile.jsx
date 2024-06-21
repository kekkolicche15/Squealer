import { useState, useEffect, useLayoutEffect } from "react";
import {
  Image,
  Col,
  Row,
  Dropdown,
  CloseButton,
  Modal,
  Button,
  Form,
  Card,
  FloatingLabel,
  Spinner,
  InputGroup,
  Container,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import TooltipVip from "./TooltipVip.jsx";
import { Shuffle, Repeat, Trash } from "react-bootstrap-icons";
import { BsSearch } from "react-icons/bs";
import {
  icon_size,
  uri,
  sendRequest,
  createFileFromBlob,
  dataURLtoBlob,
  getMonetaSquealer,
  fetchImgPreview,
  fetchAttachment,
  fetchDeletePost,
  baseUrl,
} from "./Const.js";
import {
  Camera2,
  Pencil,
  Book,
  Envelope,
  Person,
  PersonWorkspace,
  Bell,
  CheckSquare,
  XSquare,
  Calendar4Event,
  Calendar4,
  Calendar,
  ClipboardData,
  PlusCircleFill,
  Paypal,
  CurrencyEuro,
  ArrowUpCircle,
  Star,
  StarFill,
} from "react-bootstrap-icons";
import Camera from "react-html5-camera-photo";
import { faImages, faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ImageVideo from "./componentsHome/ImageVideo.jsx";
import "./Profile.css";
import Post from "./componentsHome/Post.jsx";
import DropdownFollowing from "./DropdownFollowing.jsx";
import useWindowDimensions from "./useWindowDimensions.jsx";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";


function Profile(props) {
  const navigator = useNavigate();

  const [quotaExtra, setQuotaExtra] = useState(null);

  const [role, setRole] = useState("");
  const [bio, setBio] = useState(
    "Hey, sto usando Squealer (sì, lo so... che originalità...)",
  );
  const [email, setEmail] = useState("undefined@gmail.com");
  const [ssm, setSsm] = useState("");
  const [soldi, setSoldi] = useState(0);

  const [following, setFollowing] = useState([]);
  const [follower, setFollower] = useState([]);

  const [vipCost, setVipCost] = useState(0);

  const [quotaConversionRate, setQuotaConversionRate] = useState(0);

  const [followingPage, setFollowingPage] = useState(1);
  const [followerPage, setFollowerPage] = useState(1);

  const [quota, setQuota] = useState([0, 0, 0]);
  const giornaliera = 0;
  const settimanale = 1;
  const mensile = 2;

  const [posts, setPosts] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [imageServer, setImageServer] = useState(null);

  const [inputPassword, setInputPassword] = useState("");

  //serve perche' cosi quando faccio il logout non fa le chiamate al server per i post
  const [hidePosts, setHidePosts] = useState(false);

  const [modalZoom, setModalZoom] = useState(false);

  const fetchQuota = async () => {
    const res = await sendRequest(
      new Request(
        `${uri}user/${props.data.username}/info/?view=self&fields=score`,
        {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        },
      ),
    );

    const json = await res.json();
    var quota = [];
    for (var i = 0; i < json.quotas.values.length; i++) {
      quota[i] = json.quotas.values[i];
    }
    setQuota(quota);
    setRole(json.role);
    setBio(json.bio);
    setEmail(json.email);
    setSoldi(json.score);
  };

  useEffect(() => {
    const fetchNotification = async () => {
      const res = await sendRequest(
        new Request(`${uri}notification/pending/`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      const promises = json.map(async (el) => {
        const img = await fetchImgPreview("user", el.sender.username);
        return { img: img, username: el.sender.username, content: el.content, postId: el.relatedPost };
      });

      Promise.all(promises).then((results) => {
        setNotifications(results);
      });
    };

    const fetchQuotaConversionRate = async () => {
      const res = await sendRequest(
        new Request(`${uri}general/const`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );

      const json = await res.json();
      setQuotaConversionRate(json.ConversionRate);
      setVipCost(json.VipCost);
      setQuotaExtra(json.QuotaExtra);
    };

    fetchQuotaConversionRate();

    fetchQuota();
    fetchNotification();
  }, []);

  //notifications
  const fetchDeleteNotification = async (deleteOne, content) => {
    await sendRequest(
      new Request(`${uri}notification/${deleteOne}?content=${content}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  };

  const fetchAcceptNotification = async (user) => {
    await sendRequest(
      new Request(`${uri}notification/${user}`, {
        method: "PATCH",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  };

  const fetchEditUser = async (
    username,
    password,
    currentPassword,
    email,
    bio,
  ) => {
    var body = {};
    if (username) body.username = username;
    if (password) body.password = password;
    if (currentPassword) body.currentPassword = currentPassword;
    if (email) body.email = email;
    if (bio) body.bio = bio;
    const res = await sendRequest(
      new Request(`${uri}user/edit/`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (res.ok) {
      if (username && password) {
        sessionStorage.setItem("username", username);
        props.setData({ username: username});
        navigator(`../${username}`, { relative: "path" });
      } else if (username && !password) {
        sessionStorage.setItem("username", username);
        props.setData({ username: username});
        navigator(`../${username}`, { relative: "path" });
      } else if (!username && password) {
        props.setData({ username: props.data.username});
      }
    }
    const json = await res.json();
    if (json.error) {
      toast.error(json.error, { className: "toast-message" });
    }
  };

  useEffect(() => {
    const fetchFollowers = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${props.data.username}/followers/?page=${followerPage}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      setFollower(json.response);
    };
    fetchFollowers();
  }, [followerPage]);

  useEffect(() => {
    const fetchFollowed = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${props.data.username}/followed/?page=${followingPage}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      setFollowing(json.response);
    };
    fetchFollowed();
  }, [followingPage]);

  //modifica profilo
  const [showModalEditProfile, setShowModalEditProfile] = useState(false);

  //gestione della camera
  const [showCamera, setShowCamera] = useState(false);
  const [selectedResource, setSelectedResource] = useState("");
  const [showModal, setShowModal] = useState(false);

  function handleTakePhoto(dataUri) {
    var myblob = dataURLtoBlob(dataUri);
    var myfile = createFileFromBlob(myblob);
    setImageServer(myfile);
    setSelectedResource(dataUri);
    setShowCamera(false);
  }

  useEffect(() => {
    props.setShowFooter(true);
  }, []);

  async function handleForm(event) {
    event.preventDefault();
    setShowModalEditProfile(false);
    var username = event.target[0].value;
    var password = event.target[1].value;
    setInputPassword("");
    var currentPassword = "";
    var email;
    var bio;
    if (password) {
      currentPassword = event.target[2].value;
      email = event.target[3].value;
      bio = event.target[4].value;
    } else {
      email = event.target[2].value;
      bio = event.target[3].value;
    }

    if (email) {
      setEmail(email);
    }
    if (bio) {
      setBio(bio);
    }
    await fetchEditUser(username, password, currentPassword, email, bio);
  }

  async function deleteNotification(index, content) {
    await fetchDeleteNotification(notifications[index].username, content);
    setNotifications(notifications.filter((el, i) => i !== index));
  }

  const { width } = useWindowDimensions();
  const [fontSize, setFontSize] = useState("16px");

  useLayoutEffect(() => {
    if (width < 440) {
      setFontSize("14px");
    } else if (width > 440 && width < 540) {
      setFontSize("18px");
    } else {
      setFontSize("20px");
    }
  }, [width]);

  const logout = async () => {
    const res = await sendRequest(
      new Request(`${uri}user/session`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    if (res.ok) {
      props.setShowFooter(false);
      setHidePosts(true);
      navigator("../../login", { relative: "path" });
    } else {
      const json = await res.json();
      toast.error(json.error, { className: "toast-message" });
    }
  };

  //modifica immagine profilo
  useEffect(() => {
    const EditPic = async () => {
      const formData = new FormData();
      formData.append("image", imageServer);
      setImageServer(undefined);
      await sendRequest(
        new Request(`${uri}user/edit/pic/`, {
          method: "PATCH",
          body: formData,
        }),
      );
    };

    if (imageServer && !showModal) {
      EditPic();
    }
  }, [imageServer, showModal]);

  const [youInDebt, setYouInDebt] = useState(false);

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
      else if (mode === "POST" && query === "?debt=false") {
        setYouInDebt(false);
        toast.success("hai risanato il tuo debito", {
          className: "toast-message",
        });
      }
    } else {
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const [url_profile_img, setUrl_profile_img] = useState("");

  useEffect(() => {
    const fetchImg = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${props.data.username}/picture`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      setUrl_profile_img(res.url);
    };

    fetchImg();
    handleDebt("GET", "");
  }, [role]);

  useEffect(() => {
    if (role === "vip") fetchSmm("GET");
  }, [role]);

  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [pagePosts, setPagePosts] = useState(1);
  const [refreshPage, setRefreshPage] = useState(false);
  const [sort, setSort] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  async function deletePost(index, id) {
    
    setPosts(posts.filter((el, i) => i !== index));
    await fetchDeletePost(id);
    setRefreshPage((prevValue) => {
        return !prevValue;
      });

  }

  function handleSelect(e) {
    if (e.target.value === "dal piú vecchio") setSort("oldest");
    else if (e.target.value === "popolari") setSort("popularity");
    else if (e.target.value === "impopolari") setSort("unpopularity");
    else if (e.target.value === "controversi") setSort("controversiality");
    else setSort(null);
  }

  function getSort() {
    if (sort) return `&sort=${sort}`;
    else return "";
  }

  const fetchPosts = async () => {
    const res = await sendRequest(
      new Request(
        `${uri}post/?page=${pagePosts}&author=${
          props.data.username
        }${getSort()}`,
        {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        },
      ),
    );
    const json = await res.json();
    if (json.page){
        const promises = json.page.map(async (el) => {
          const url_img_channel = await fetchImgPreview("channel", el.channel);
          const url_img_sender = await fetchImgPreview("user", el.author);
          var attachment = "";
          if (el.contentType !== "text")
            attachment = await fetchAttachment(el._id, "post");
          return {
            url_img_channel: url_img_channel,
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
            reactions: el.reactions,
            userReaction: el.userReaction,
            views: el.views,
            references: el.references,
          };
        });

        Promise.all(promises).then((results) => {
          setPosts([...results]);
        });
    }
    setIsLoadingPosts(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshPage]);

  useEffect(() => {
    if (isMounted) setIsMounted(false);
    else {
      setPagePosts(1);
      setRefreshPage(!refreshPage);
    }
  }, [sort]);

  function isDeletable(username_sender) {
    return username_sender === props.data.username;
  }

  const [showMS, setShowMS] = useState(false);
  const [nScoreOrQuota, setNScoreOrQuota] = useState(1);

  const fetchBuyQuotaOrScore = async (mode, amount) => {
    const res = await sendRequest(
      new Request(`${uri}user/buy/${mode}/?amount=${amount}}`, {
        method: "PATCH",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (mode === "quota") {
      if (res.ok) {
        toast.success("quota comprata con successo", {
          className: "toast-message",
        });
      } else {
        const json = await res.json();
        toast.error(json.error, { className: "toast-message" });
      }
    }
  };

  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [hideModal, setHideModal] = useState(false);

  const [showMQ, setShowMQ] = useState(false);

  const [showMVip, setShowMVip] = useState(false);

  const fetchBuyVip = async (amount) => {
    const res = await sendRequest(
      new Request(`${uri}user/buy/vip/?amount=${amount}}`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (res.ok) {
      toast.success("stato vip comprato con successo", {
        className: "toast-message",
      });
      await fetchQuota();
    } else {
      const json = await res.json();
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const fetchSmm = async (mode) => {
    const res = await sendRequest(
      new Request(`${uri}smm/manager/`, {
        method: mode,
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (mode === "GET") setSsm(json?.smm?.username || "");
    else setSsm("");
  };

  const [showMSMM, setShowMSMM] = useState(false);
  const [showSMMList, setShowSMMList] = useState(false);
  const [sortSMM, setSortSMM] = useState("");
  const [filter, setFilter] = useState("");
  const [showIcon, setShowIcon] = useState(false);
  const [pageSMM, setPageSMM] = useState(1);
  const [isLoadingSMM, setIsLoadingSMM] = useState(false);
  const [smms, setSmms] = useState([]);

  function handleSelectSMM(e) {
    if (e.target.value === "clienti") setSortSMM("clients");
    else if (e.target.value === "rating") setSortSMM("rating");
    else if (e.target.value === "costo_mensile") setSortSMM("cost");
    else setSortSMM(null);
  }

  function queryFilter() {
    if (filter.length > 0) return ` &smm=${filter}`;
    else return "";
  }

  const fetchSMMS = async () => {
    const res = await sendRequest(
      new Request(
        `${uri}smm/?page=${pageSMM}&sort=${sortSMM}${queryFilter()}`,
        {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        },
      ),
    );
    if(res.ok){
        const json = await res.json();

        const promises = json.page.map(async (el) => {
          const img = await fetchImgPreview("user", el.username);
          return {
            img: img,
            username: el.username,
            cost: el.cost,
            rating: el.rating,
            freeSlots: el.maxVipCount - el.currentVipCount,
            reviewCount: el.reviewCount,
            id: el.id,
          };
        });
    
        Promise.all(promises).then((results) => {
          setSmms([...results]);
        });
    }
    
    setIsLoadingSMM(false);
  };

  useEffect(() => {
    if (role === "vip" && showMSMM) fetchSMMS();
  }, [pageSMM, showMSMM, filter, sortSMM]);

  useEffect(() => {
    setPageSMM(1);
  }, [filter]);

  const [showMCSMM, setShowMCSMM] = useState(false);
  const [currentSMM, setCurrentSmm] = useState(undefined);

  function getIconsRating(rating, maxRating) {
    var roundedRating = Math.round(rating);
    const icons = [];
    for (var i = 0; i < maxRating; i++) {
      if (i < roundedRating)
        icons.push(
          <StarFill
            style={{ marginTop: "-5px" }}
            color="yellow"
            size={icon_size / 3}
          />,
        );
      else
        icons.push(
          <Star
            style={{ marginTop: "-5px" }}
            color="yellow"
            size={icon_size / 3}
          />,
        );
    }
    return (
      <>
        {icons.map((el, index) => (
          <span key={index}>{el}</span>
        ))}
      </>
    );
  }

  const [showWReviews, setShowWReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const [pageReviews, setPageReviews] = useState(1);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [sortReviews, setSortReviews] = useState("");

  function handleSelectRW(e) {
    if (e.target.value === "rating") setSortReviews("rating");
    else setSortReviews("");
  }

  function querySortRW() {
    if (sortReviews.length > 0) return `&sort=${sortReviews}`;
    else return "";
  }

  const fetchGetReviews = async () => {
    const res = await sendRequest(
      new Request(
        `${uri}smm/${
          currentSMM.username
        }/reviews/?page=${pageReviews}${querySortRW()}`,
        {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        },
      ),
    );
    const json = await res.json();
    if (res.ok) {
      const promises = json.reviews.map(async (el) => {
        const img = await fetchImgPreview("user", el.vip.username);
        return {
          img: img,
          username: el.vip.username,
          msg: el.text,
          rating: el.type,
          id: el._id,
        };
      });

      Promise.all(promises).then((results) => {
        setReviews([...results]);
      });

      setIsLoadingReview(false);
    }
  };

  const fetchgetSmm = async (id) => {
    const res = await sendRequest(
      new Request(`${uri}smm/${id}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (res.ok) {
      const json = await res.json();
      const tmpImg = currentSMM.img;
      setCurrentSmm({
        username: json.username,
        img: tmpImg,
        cost: json.cost,
        rating: json.rating,
        reviewCount: json.reviewCount,
        freeSlots: json.maxVipCount - json.currentVipCount,
        id: json.id,
        description: json.description,
      });
    }
  };

  const fetchReviews = async () => {
    var rating = getRating();
    const res = await sendRequest(
      new Request(`${uri}smm/${currentSMM.username}/reviews`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ type: rating, text: reviewText }),
      }),
    );
    const json = await res.json();
    if (res.ok) {
      await fetchgetSmm(currentSMM.id);
      await fetchGetReviews();
    } else {
      toast.error(json.error, { className: "toast-message" });
    }
  };

  useEffect(() => {
    if (currentSMM) {
      fetchGetReviews();
    }
  }, [refreshReviews, pageReviews, currentSMM]);

  useEffect(() => {
    setReviews([]);
    setIsLoadingReview(true);
    new Promise((resolve) => setTimeout(resolve, 600));
    setPageReviews(1);
    setRefreshReviews((prevValue) => !prevValue);
  }, [sortReviews]);

  //mettere piu star che poi la prima e l'ultima non si vedono e il prevIndex serve a simulare uno scorrimento a dx o sx
  const [newRating, setNewRating] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [currIndex, setCurrIndex] = useState(-1);

  function changeRating(index) {
    setCurrIndex(index);
    if (prevIndex === index) return;
    if (index !== 6 && index !== 0) {
      const tmp = [...newRating];
      tmp[index] = !tmp[index];
      setNewRating([...tmp]);
    }
    setPrevIndex(index);
  }

  function getRating() {
    var counter = 0;
    for (var i = newRating.length - 1; i > 0; i--) {
      if (newRating[i]) {
        counter++;
      }
    }
    return counter;
  }

  const [reviewText, setReviewText] = useState("");

  const fetchObtainSsm = async () => {
    const res = await sendRequest(
      new Request(`${uri}smm/${currentSMM.username}/waiting-list`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (res.ok) {
      toast.success("richiesta inviata", { className: "toast-message" });
    }
    const json = await res.json();
    toast.error(json.error, { className: "toast-message" });
  };

  function handleCloseModal() {
    setShowMCSMM(false);
    setShowWReviews(false);
    setCurrentSmm(undefined);
    setNewRating([false, false, false, false, false, false, false]);
    setReviewText("");
    setCurrIndex(-1);
    setPrevIndex(-1);
    setPageReviews(1);
  }

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      E`&apos;` il tuo smm
    </Tooltip>
  );

  const fetchDeleteRW = async (id) => {
    const res = await sendRequest(
      new Request(`${uri}smm/${currentSMM.username}/reviews/?id=${id}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (res.ok) {
      toast.success("recensione eliminata", { className: "toast-message" });
      setRefreshReviews((prevValue) => !prevValue);
      await fetchgetSmm(currentSMM.id);
    } else {
      const json = await res.json();
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const fetchDeleteAccount = async () => {
    const res = await sendRequest(
      new Request(`${uri}user/`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (res.ok) {
      props.setShowFooter(false);
      setHidePosts(true);
      navigator("../../login", { relative: "path" });
      toast.success("account eliminato con successo", {
        className: "toast-message",
      });
    } else {
      const json = await res.json();
      toast.error(json.error, { className: "toast-message" });
    }
  };

  return (
    <div style={{ fontSize: `${fontSize}` }}>
      {/* modal per scegliere smm */}
      <Modal show={showMCSMM} fullscreen>
        <Modal.Title
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <ArrowUpCircle
            role="button"
            style={{ cursor: "pointer" }}
            onClick={() => {
              handleCloseModal();
            }}
            size={icon_size / 1.5}
          />
        </Modal.Title>
        <div>
          <Row>
            <Col>
              <Image
                roundedCircle
                fluid
                src={currentSMM?.img}
                alt={`immagine profilo di ${currentSMM?.username}`}
              />
            </Col>
            <Col style={{ marginTop: "60px" }}>
              <span style={{ marginRight: "10px", fontWeight: "bold" }}>
                {currentSMM?.username}
              </span>
              <TooltipVip role={"smm"} />
            </Col>
            <Col>
              {ssm === currentSMM?.username && (
                <>
                  <OverlayTrigger
                    placement="top"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip}
                  >
                    <Repeat
                      style={{ cursor: "pointer", marginTop: "60px" }}
                      color="white"
                      size={icon_size / 2.5}
                    />
                  </OverlayTrigger>
                </>
              )}
            </Col>
          </Row>
          <Row style={{ marginTop: "40px", marginLeft: "10px" }}>
            <Col>
              <span>{`slot vip liberi ${currentSMM?.freeSlots}`}</span>
            </Col>
            <Col>
              <span style={{ marginRight: "10px" }}></span>
              {getIconsRating(currentSMM?.rating, 5)}
            </Col>
          </Row>
          <Row style={{ marginLeft: "10px", marginTop: "30px" }}>
            <Col>
              <span>{`recensioni ${currentSMM?.reviewCount}`}</span>
            </Col>
            <Col>
              <span style={{ marginRight: "10px" }}>costo mensile</span>
              <Image
                roundedCircle
                style={{ width: icon_size / 2 }}
                src={getMonetaSquealer}
                alt="moneta squealer"
              />
              <span style={{ marginLeft: "10px" }}>{currentSMM?.cost}</span>
            </Col>
          </Row>
        </div>
        <hr style={{ marginTop: "30px" }}></hr>
        <Modal.Body>
          {ssm === currentSMM?.username && (
            <>
              <a
                href=""
                onClick={(e) => {
                  e.preventDefault();
                  setShowWReviews((prevValue) => !prevValue);
                }}
              >
                {" "}
                {`${showWReviews ? "nascondi" : "scrivi una recensione"}`}
              </a>
              {showWReviews && (
                <div style={{ marginTop: "20px" }}>
                  <Form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await fetchReviews();
                      setReviewText("");
                      setRefreshReviews((prevValue) => !prevValue);
                      setNewRating([
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                        false,
                      ]);
                      setShowWReviews(false);
                      setCurrIndex(-1);
                      setPrevIndex(-1);
                    }}
                  >
                    <Row>
                      <Col>
                        <Form.Control
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          id="scrivi recensione"
                          as="textarea"
                          rows={3}
                          placeholder="questo smm mi sembra molto competente"
                        />
                      </Col>
                    </Row>
                    <Row style={{ marginTop: "20px" }}>
                      <Col>
                        {newRating.map((el, i) => (
                          <span key={i} onMouseOver={() => changeRating(i)}>
                            {newRating[i] ? (
                              <StarFill
                                style={{ marginTop: "-5px" }}
                                color="yellow"
                                size={`${
                                  currIndex === i
                                    ? icon_size / 2
                                    : icon_size / 3
                                }`}
                              />
                            ) : (
                              <Star
                                style={{
                                  marginTop: "-5px",
                                  opacity: `${i !== 6 && i !== 0 ? 1 : 0}`,
                                }}
                                color="yellow"
                                size={`${
                                  currIndex === i
                                    ? icon_size / 2
                                    : icon_size / 3
                                }`}
                              />
                            )}
                          </span>
                        ))}
                      </Col>
                      <Col
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginRight: "20px",
                        }}
                      >
                        <Button
                          type="submit"
                          disabled={getRating() < 1 || reviewText.length < 1}
                        >
                          aggiungi recensione
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </div>
              )}
            </>
          )}
          <p style={{ fontWeight: "bold", marginTop: "15px" }}>Recensioni</p>

          <FloatingLabel
            style={{
              fontSize: "17px",
              marginLeft: "5vw",
              marginRight: "5vw",
              marginTop: "20px",
              marginBottom: "20px",
            }}
            controlId="floatingSelect3"
            label="Ordina recensioni"
          >
            <Form.Select
              id="floatingSelect3"
              onChange={(e) => {
                handleSelectRW(e);
              }}
              aria-label="Floating label select example"
            >
              <option>dal piú recente</option>
              <option value="rating">rating</option>
            </Form.Select>
          </FloatingLabel>

          <div
            style={{
              marginTop: "20px",
              overflow: "auto",
              marginBottom: "10px",
              maxHeight: "600px",
            }}
          >
            {reviews.map((el, i) => (
              <Card
                key={i}
                style={{
                  marginLeft: "2vw",
                  marginRight: "2vw",
                  marginTop: "5vh",
                }}
              >
                <Card.Header>
                  <Row>
                    <Col>
                      <Image
                        style={{ width: "90px", height: "90px" }}
                        roundedCircle
                        alt={`immagine profilo di ${el.username}`}
                        src={el.img}
                      />
                    </Col>
                    <Col style={{ marginTop: "20px" }}>
                      <span
                        style={{
                          marginRight: "5px",
                          marginLeft: "5px",
                          fontWeight: "bold",
                        }}
                      >
                        {el.username}
                      </span>
                      <TooltipVip role={"vip"} />
                    </Col>
                  </Row>
                </Card.Header>
                <Card.Body>
                  <Row style={{ marginTop: "10px" }}>
                    <Col>
                      <p>{el.msg}</p>
                    </Col>
                  </Row>
                  <Row style={{ marginTop: "10px" }}>
                    <Col
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      {getIconsRating(el.rating, 5)}
                    </Col>
                  </Row>
                </Card.Body>
                {el.username === props.data.username && (
                  <Card.Footer
                    style={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                      <Trash
                        role="button"
                        onClick={async () => {
                          await fetchDeleteRW(el.id);
                        }}
                        size={icon_size / 2.5}
                      />
                    </div>
                  </Card.Footer>
                )}
              </Card>
            ))}
          </div>
          <div style={{ marginTop: "40px" }}>
            {isLoadingReview ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: "30px",
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
                  style={{ fontSize: `${fontSize}` }}
                  disabled={pageReviews <= 1}
                  variant="primary"
                  onClick={async () => {
                    setReviews([]);
                    setIsLoadingReview(true);
                    await new Promise((resolve) => setTimeout(resolve, 400));
                    setPageReviews((prevValue) => {
                      return prevValue - 1;
                    });
                  }}
                >
                  pagina precedente
                </Button>
                <Button
                  size="sm"
                  style={{ fontSize: `${fontSize}` }}
                  disabled={reviews.length === 0}
                  variant="primary"
                  onClick={async () => {
                    setReviews([]);
                    setIsLoadingReview(true);
                    await new Promise((resolve) => setTimeout(resolve, 400));
                    setPageReviews((prevValue) => {
                      return prevValue + 1;
                    });
                  }}
                >
                  pagina successiva
                </Button>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "10px",
            marginBottom: "10px",
          }}
        >
          {ssm !== currentSMM?.username ? (
            <Button
              onClick={async () => {
                handleCloseModal();
                await fetchObtainSsm();
              }}
              style={{ marginRight: "10px" }}
            >
              Scegli
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={async () => {
                handleCloseModal();
                await fetchSmm("DELETE");
              }}
              style={{ marginRight: "10px" }}
            >
              Chiudi rapporto
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/*modal per vedere lista smms */}
      <Modal centered show={showMSMM} dialogClassName="my-modal" size="lg">
        <Modal.Title>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <span style={{ marginLeft: "10px" }}>
              <strong>Scegli il tuo smm</strong>
            </span>
            <CloseButton
              style={{ marginRight: "10px" }}
              onClick={() => {
                setShowMSMM(false);
                setShowSMMList(false);
                setPageSMM(1);
              }}
            />
          </div>
        </Modal.Title>
        <Modal.Body style={{ fontSize: `${fontSize}` }}>
          {!showSMMList ? (
            <>
              <p>
                Come account vip hai la possibilitá di poter scegliere un social
                media manager che possa gestire il tuo account.
              </p>
              <p>
                Seleziona con attenzione il tuo Social Media Manager, prenditi
                il tempo necessario per valutare il suo rating e leggere le
                recensioni associate.
              </p>
              <p>Ogni Smm ha un proprio costo mensile.</p>
              <Button
                style={{ marginTop: "10px", marginBottom: "10px" }}
                onClick={() => {
                  setShowSMMList(true);
                  setPageSMM(1);
                }}
              >
                vai alla lista dei smm
              </Button>
            </>
          ) : (
            <>
              <FloatingLabel
                style={{
                  fontSize: "17px",
                  marginLeft: "5vw",
                  marginRight: "5vw",
                }}
                controlId="floatingSelect2"
                label="Ordina SMM"
              >
                <Form.Select
                  id="floatingSelect2"
                  onChange={(e) => {
                    handleSelectSMM(e);
                  }}
                  aria-label="Floating label select example"
                >
                  <option>dal piú recente</option>
                  <option value="clienti">numero di clienti vip</option>
                  <option value="rating">rating</option>
                  <option value="costo_mensile">costo mensile</option>
                </Form.Select>
              </FloatingLabel>
              <Card
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginTop: "40px",
                  marginRight: "2vw",
                  marginLeft: "1vw",
                  height: "50px",
                }}
              >
                <Row>
                  {showIcon && (
                    <Col
                      style={{
                        maxWidth: icon_size / 3,
                        marginLeft: "1vw",
                        marginTop: "7px",
                      }}
                    >
                      <BsSearch size={icon_size / 3} />
                    </Col>
                  )}
                  <Col>
                    <Form.Control
                      name={"searchSMM"}
                      value={filter}
                      onChange={(event) => {
                        setFilter(event.target.value);
                      }}
                      onClick={() => setShowIcon(false)}
                      style={{
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        paddingTop: "10px",
                      }}
                      type="txt"
                      placeholder="cerca fra gli smm"
                    />
                  </Col>
                  {!showIcon && (
                    <Col
                      style={{
                        maxWidth: icon_size,
                        display: "flex",
                        justifyContent: "flex-end",
                        marginRight: "1vw",
                        marginTop: "0.5vh",
                      }}
                    >
                      <CloseButton
                        onClick={() => {
                          setFilter("");
                          setShowIcon(true);
                        }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>
              <hr></hr>
              <div
                style={{
                  marginTop: "40px",
                  overflow: "auto",
                  maxHeight: "300px",
                }}
              >
                {smms.map((el, index) => (
                  <Row
                    key={index}
                    style={{
                      marginTop: "20px",
                      marginBottom: "20px",
                      cursor: "pointer",
                    }}
                    role="button"
                    onClick={() => {
                      setShowMCSMM(true);
                      setCurrentSmm({
                        username: el.username,
                        img: el.img,
                        cost: el.cost,
                        rating: el.rating,
                        reviewCount: el.reviewCount,
                        freeSlots: el.freeSlots,
                        id: el.id,
                        description: el.description,
                      });
                    }}
                  >
                    <Col>
                      <Image
                        style={{ marginLeft: "20px", width: "70px", height: "70px" }}
                        src={el.img}
                        alt={`immagine profilo di ${el.username}`}
                        roundedCircle
                      />
                      <span
                        style={{
                          fontWeight: "bold",
                          marginLeft: "10px",
                          marginRight: "10px",
                        }}
                      >
                        {el.username}
                      </span>
                      <TooltipVip role={"smm"} />
                      {ssm === el.username && (
                        <>
                          <OverlayTrigger
                            placement="top"
                            delay={{ show: 250, hide: 400 }}
                            overlay={renderTooltip}
                          >
                            <Repeat
                              style={{ cursor: "pointer", marginLeft: "30px" }}
                              color="white"
                              size={icon_size / 2.5}
                            />
                          </OverlayTrigger>
                        </>
                      )}
                    </Col>
                  </Row>
                ))}
              </div>
              <div style={{ marginTop: "40px" }}>
                {isLoadingSMM ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "50px",
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
                      style={{ fontSize: `${fontSize}` }}
                      disabled={pageSMM <= 1}
                      variant="primary"
                      onClick={async () => {
                        setSmms([]);
                        setIsLoadingSMM(true);
                        await new Promise((resolve) =>
                          setTimeout(resolve, 400),
                        );
                        setPageSMM((prevValue) => {
                          return prevValue - 1;
                        });
                      }}
                    >
                      pagina precedente
                    </Button>
                    <Button
                      size="sm"
                      style={{ fontSize: `${fontSize}` }}
                      disabled={smms.length === 0}
                      variant="primary"
                      onClick={async () => {
                        setSmms([]);
                        setIsLoadingSMM(true);
                        await new Promise((resolve) =>
                          setTimeout(resolve, 400),
                        );
                        setPageSMM((prevValue) => {
                          return prevValue + 1;
                        });
                      }}
                    >
                      pagina successiva
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/*modal per comprare vip */}
      <Modal centered show={showMVip} dialogClassName="my-modal" size="lg">
        <Modal.Title>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
            }}
          >
            <span style={{ marginLeft: "10px" }}>
              <strong>
                Entra a far parte dei VIP <TooltipVip is_vip={true} />
              </strong>
            </span>
            <CloseButton
              style={{ marginRight: "10px" }}
              onClick={() => setShowMVip(false)}
            />
          </div>
        </Modal.Title>
        <Modal.Body style={{ fontSize: `${fontSize}` }}>
          <p>
            Il vip è un segno di credibilità e autorevolezza. Quando un account
            è vip, significa che è stato autenticato dal nostro team. Questo
            garantisce agli utenti che si tratta di un account reale e
            affidabile.
          </p>
          <p>ecco i vantaggi a diventare vip:</p>
          <p style={{ fontWeight: "bold" }}>
            {" "}
            - badge associato ad account vip visibile a tutti
          </p>
          <p style={{ fontWeight: "bold" }}>
            {" "}
            - aumento della quota base e quota massima
          </p>
          <p style={{ fontWeight: "bold" }}>
            {" "}
            - possibilitá di poter scegliere un proprio social media manager che
            gestisca il tuo account
          </p>
          <p style={{ marginTop: "5px" }}>
            Se siete interessati a migliorare la vostra visibilitá online, il{" "}
            <b>vip</b> è il servizio che fa per voi.
          </p>
          <p style={{ marginTop: "30px" }}>
            Il vip costa solo{" "}
            <Image
              style={{ marginLeft: "10px" }}
              src={getMonetaSquealer}
              alt="valuta squealer"
              roundedCircle
              width={icon_size / 2.5}
            />{" "}
            {vipCost}
          </p>
          <p
            style={{
              display: "flex",
              justifyContent: "flex-end",
              fontSize: "14px",
            }}
          >
            lo stato vip dura un mese
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            size="lg"
            variant="outline-success"
            onClick={async () => {
              await fetchBuyVip();
              setShowMVip(false);
            }}
            disabled={soldi < vipCost}
          >
            compra vip
          </Button>
        </Modal.Footer>
      </Modal>

      {/*modal se si vuole zoomare un'immagine */}
      <Modal centered show={modalZoom} dialogClassName="my-modal" size="lg">
        <Card>
          <Image
            src={url_profile_img}
            alt={`immagine profilo di ${props.data.username}`}
            fluid
          />
          <Card.ImgOverlay
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <CloseButton
              style={{ cursor: "pointer", backgroundColor: "white" }}
              color="black"
              onClick={() => {
                setModalZoom(false);
              }}
              role="button"
              size={icon_size / 2}
            />
          </Card.ImgOverlay>
        </Card>
      </Modal>

      {/*modal per cambiare immagine profilo*/}
      <Modal centered show={showModal} size="lg">
        <Modal.Title>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: `calc(${fontSize} + 6px)`,
                marginTop: "0.5vh",
                marginLeft: "3vw",
              }}
            >
              <strong>Cambia immagine profilo</strong>
            </span>
            <CloseButton
              style={{ marginRight: "0.5vw", marginTop: "0.8vh" }}
              onClick={() => {
                setImageServer("");
                setUrl_profile_img(url_profile_img);
                setShowModal(false);
                setShowCamera(false);
                setSelectedResource("");
              }}
            />
          </div>
        </Modal.Title>
        <hr />
        <Modal.Body>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {selectedResource.length > 0 && (
              <Image
                src={selectedResource}
                style={{ maxWidth: "50vw", maxHeight: "40vh" }}
                roundedCircle
                fluid
                alt={props.data.username}
              />
            )}
            {showCamera && (
              <div>
                <Camera
                  onTakePhoto={(dataUri) => {
                    handleTakePhoto(dataUri);
                  }}
                />
              </div>
            )}
          </div>
          <hr />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "5vh",
            }}
          >
            <Button
              disabled={!imageServer}
              variant="primary"
              onClick={() => {
                setShowModal(false);
                setUrl_profile_img(selectedResource);
                setSelectedResource("");
                setShowCamera(false);
              }}
            >
              salva modifiche
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/*modal per editare il profilo*/}
      <Modal centered show={showModalEditProfile} size="lg">
        <Modal.Title>
          <Row>
            <Col
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginLeft: "1%",
              }}
            >
              <span
                style={{
                  fontSize: `calc(${fontSize} + 6px)`,
                  marginTop: "0.5vh",
                }}
              >
                <strong>Modifica il profilo</strong>
              </span>
            </Col>
            <Col style={{ display: "flex", justifyContent: "flex-end" }}>
              <CloseButton
                style={{ marginRight: "0.5vw", marginTop: "0.8vh" }}
                onClick={() => {
                  setShowModalEditProfile(false);
                }}
              />
            </Col>
          </Row>
        </Modal.Title>
        <hr />
        <Modal.Body>
          <Form onSubmit={async (e) => await handleForm(e)}>
            <div>
              <FloatingLabel
                controlId="floatingInput1"
                label="cambia username"
                className="mb-3"
              >
                <Form.Control type="text" placeholder="cambia username" />
              </FloatingLabel>
              <FloatingLabel
                controlId="floatingInput2"
                label="cambia password"
                className="mb-3"
              >
                <Form.Control
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  type="text"
                  placeholder="cambia password"
                />
              </FloatingLabel>
              {inputPassword && (
                <FloatingLabel
                  controlId="floatingInput3"
                  label="password attuale"
                  className="mb-3"
                >
                  <Form.Control
                    required
                    type="text"
                    placeholder="inserisci la password attuale"
                  />
                </FloatingLabel>
              )}
              <FloatingLabel
                controlId="floatingInput4"
                label="cambia email"
                className="mb-3"
              >
                <Form.Control type="email" placeholder="cambia email" />
              </FloatingLabel>
              <FloatingLabel
                controlId="floatingInput5"
                label="cambia bio"
                className="mb-3"
              >
                <Form.Control type="text" placeholder="cambia bio" />
              </FloatingLabel>
            </div>

            <Row style={{ marginTop: "5vh" }}>
              <Col style={{ marginLeft: "5px" }}>
                <Button
                  variant="outline-danger"
                  onClick={async () => await fetchDeleteAccount()}
                >
                  elimina account
                </Button>
              </Col>
              <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="submit" variant="primary">
                  Salva modifiche
                </Button>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
      </Modal>

      {/*modal per comprare score*/}
      <Modal centered show={showMS} size="lg">
        <Container fluid>
          <div style={{ opacity: `${!hideModal ? 1 : 0}` }}>
            <Modal.Title>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginLeft: "10px",
                  marginRight: "10px",
                  marginTop: "5px",
                }}
              >
                <p style={{ fontWeight: "bold" }}>Compra soldi squealer</p>
                <CloseButton
                  onClick={() => {
                    setShowMS(false);
                    setNScoreOrQuota(1);
                  }}
                />
              </div>
              <hr style={{ marginTop: "-5px" }}></hr>
            </Modal.Title>

            <Form
              onSubmit={async (e) => {
                e.preventDefault();
                setSoldi((prevValue) => {
                  return parseInt(prevValue) + parseInt(nScoreOrQuota);
                });
                setHideModal(true);
                setIsLoadingPayment(true);
                await new Promise((resolve) => setTimeout(resolve, 1500));
                setIsLoadingPayment(false);
                toast.success(
                  "Accesso al tuo account Paypal avvenuto con successo",
                  { className: "toast-message" },
                );
                await new Promise((resolve) => setTimeout(resolve, 100));
                setIsLoadingPayment(true);
                await new Promise((resolve) => setTimeout(resolve, 3000));
                setIsLoadingPayment(false);
                setNScoreOrQuota(1);
                await fetchBuyQuotaOrScore("score", nScoreOrQuota);
                setShowMS(false);
                toast.success("Pagamento avvenuto con successo", {
                  className: "toast-message",
                });
                setHideModal(false);
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <InputGroup style={{ marginTop: "40px", width: "70%" }}>
                  <InputGroup.Text>
                    <CurrencyEuro />
                  </InputGroup.Text>
                  <Form.Control
                    value={nScoreOrQuota}
                    min="1"
                    id="inlineFormInputGroup"
                    type="number"
                    onChange={(e) => setNScoreOrQuota(e.target.value)}
                    required
                  />
                </InputGroup>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "50px",
                    width: "50%",
                  }}
                  type="submit"
                  variant="outline-warning"
                >
                  Paga con{" "}
                  <Paypal style={{ marginLeft: "10px" }} size={icon_size / 3} />{" "}
                </Button>
              </div>
            </Form>
            <Modal.Body></Modal.Body>
          </div>

          {isLoadingPayment && (
            <div
              style={{ top: "40%", position: "absolute", marginLeft: "45%" }}
            >
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}
        </Container>
      </Modal>

      {/*modal per comprare quota*/}
      <Modal centered show={showMQ} size="lg">
        <Container fluid>
          <div style={{ opacity: `${!hideModal ? 1 : 0}` }}>
            <Modal.Title>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginLeft: "10px",
                  marginRight: "10px",
                  marginTop: "5px",
                }}
              >
                <p style={{ fontWeight: "bold" }}>Compra quota</p>
                <CloseButton
                  onClick={() => {
                    setShowMQ(false);
                    setNScoreOrQuota(1);
                  }}
                />
              </div>
              <hr style={{ marginTop: "-5px" }}></hr>
            </Modal.Title>
            <Modal.Body>
              <div style={{ marginTop: "10px", marginBottom: "5px" }}>
                <p style={{ fontWeight: "bold" }}>
                  Tasso di cambio quota/soldi squealer
                </p>
                <span>1 quota</span>{" "}
                <Shuffle size={icon_size / 3.5} style={{ marginLeft: "5px" }} />
                <Image
                  style={{ marginLeft: "5px" }}
                  src={getMonetaSquealer}
                  alt="valuta squealer"
                  roundedCircle
                  width={icon_size / 2}
                />{" "}
                <span style={{ marginLeft: "5px" }}>{quotaConversionRate}</span>
              </div>
              <Form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setHideModal(true);
                  setIsLoadingPayment(true);
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  setShowMQ(false);
                  setIsLoadingPayment(false);
                  setHideModal(false);
                  if (youInDebt) await handleDebt("POST", "?debt=false");
                  else await fetchBuyQuotaOrScore("quota", nScoreOrQuota);
                  await fetchQuota();
                  setNScoreOrQuota(1);
                }}
              >
                <div style={{ marginTop: "30px" }}>
                  <div style={{ marginTop: "40px" }}>
                    <Row>
                      <Col>
                        <InputGroup>
                          <InputGroup.Text>Quota</InputGroup.Text>
                          <Form.Control
                            value={nScoreOrQuota}
                            min="1"
                            id="buyQuota"
                            type="number"
                            onChange={(e) => setNScoreOrQuota(e.target.value)}
                            required
                          />
                        </InputGroup>
                      </Col>
                      <Col>
                        <InputGroup>
                          <InputGroup.Text>
                            <Image
                              src={getMonetaSquealer}
                              alt="valuta squealer"
                              roundedCircle
                              width={icon_size / 2.5}
                            />
                          </InputGroup.Text>
                          <Form.Control
                            value={nScoreOrQuota * quotaConversionRate}
                            id="buyQuota5"
                            type="number"
                            disabled
                          />
                        </InputGroup>
                      </Col>
                    </Row>
                    {youInDebt && (
                      <Row style={{ marginTop: "50px" }}>
                        <Col style={{ fontSize: `${fontSize}` }}>
                          <span>
                            prima di comprare nuova quota devi risanare il
                            debito di{" "}
                          </span>
                          <Button
                            onClick={() => setNScoreOrQuota(quotaExtra)}
                            variant="danger"
                            style={{
                              marginLeft: "10px",
                              marginRight: "10px",
                            }}
                          >
                            {quotaExtra}
                          </Button>{" "}
                          <span>quota</span>
                        </Col>
                      </Row>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "50px",
                      width: "50%",
                    }}
                    type="submit"
                    variant="outline-success"
                    disabled={
                      (youInDebt && nScoreOrQuota < quotaExtra) ||
                      nScoreOrQuota * quotaConversionRate > soldi
                    }
                  >
                    Compra{" "}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </div>
          {isLoadingPayment && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginLeft: "45%",
                position: "absolute",
                top: "45%",
              }}
            >
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          )}
        </Container>
      </Modal>

      <div
        className="bg-body-tertiary"
        style={{ height: "240px", paddingTop: "10px" }}
      >
        <Row>
          <Col style={{ marginTop: "5px", marginLeft: "5px" }}>
            <Button
              variant="outline-danger"
              onClick={async () => await logout()}
            >
              logout
            </Button>
          </Col>

          <Col style={{ display: "flex", justifyContent: "center" }}>
            <p style={{ fontSize: `calc(${fontSize} + 7px)` }}>
              <strong>{props.data.username}</strong>
            </p>
            <div style={{ marginLeft: "0.5vw", marginTop: "0.7vh" }}>
              <TooltipVip role={role} />
            </div>
          </Col>
          <Col
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginRight: "2vw",
            }}
          >
            <Image
              src={getMonetaSquealer}
              alt="valuta squealer"
              roundedCircle
              width={icon_size / 1.3}
            />
            <strong style={{ marginTop: "20px", marginLeft: "1vw" }}>
              {" "}
              {soldi}
            </strong>
            <PlusCircleFill
              role="button"
              style={{
                marginTop: "17px",
                marginLeft: "10px",
                cursor: "pointer",
              }}
              size={icon_size / 2}
              onClick={() => setShowMS(true)}
            />
          </Col>
        </Row>

        <Row style={{ marginLeft: "1vw", marginTop: "10px" }}>
          <Col>
            <>
              <Image
                src={url_profile_img}
                onClick={() => {
                  setModalZoom(true);
                }}
                roundedCircle
                style={{ cursor: "pointer", width: "100px", height: "100px" }}
                alt={props.data.username}
              />

              <Dropdown drop="down">
                <Dropdown.Toggle
                  as="div"
                  role="button"
                  style={{
                    cursor: "pointer",
                    maxWidth: `calc(${parseInt(fontSize) + 10}px)`,
                  }}
                >
                  <Bell size={parseInt(fontSize) + 10} />
                </Dropdown.Toggle>
                <Dropdown.Menu
                  style={{
                    position: "relative",
                    minHeight: "100px",
                    minWidth: "200px",
                    overflowY: "auto",
                    maxHeight: `calc(100vh - 5vh - 190px - 20vh)`,
                  }}
                >
                  {notifications.length > 0 ? (
                    <Dropdown.Item
                      as="div"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "1vh",
                        marginBottom: "1vh",
                      }}
                    >
                      <Button
                        variant="primary"
                        style={{ width: "80%" }}
                        onClick={async () => {
                          await fetchDeleteNotification("");
                          setNotifications([]);
                        }}
                      >
                        svuota
                      </Button>
                    </Dropdown.Item>
                  ) : (
                    <Dropdown.ItemText style={{ paddingTop: "20px" }}>
                      Nessuna notifica trovata
                    </Dropdown.ItemText>
                  )}

                  {notifications.map((el, index) => {
                    return (
                      <Dropdown.Item key={Math.random()} as="div">
                        <Card style={{ fontSize: fontSize }}>
                          <Card.Body>
                            <Row>
                              <Col>
                                <Image
                                  src={el.img}
                                  alt={`immagine profilo di ${el.username}`}
                                  style={{ height: "50px", width: "50px" }}
                                  roundedCircle
                                  fluid
                                />
                                <span style={{cursor: "pointer"}} onClick={()=>navigator(`../${el.username}`, { relative: "path" })}>
                                  <strong
                                    style={{ marginLeft: "1vw" }}
                                  >{` ${el.username}`}</strong>
                                </span>
                              </Col>
                            </Row>
                            <Row style={{ marginTop: "2vh" }}>
                              <Col>
                                {el.content}
                              </Col>
                              <Col
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  marginLeft: "1vw",
                                }}
                              >
                                {el.content.includes("amico") &&
                                <CheckSquare
                                  id={`check${index}`}
                                  onMouseOver={() => {
                                    document.getElementById(
                                      `check${index}`,
                                    ).style.color = "green";
                                    document.getElementById(
                                      `check${index}`,
                                    ).style.boxShadow =
                                      "0px 0px 15px 2px green";
                                  }}
                                  onMouseOut={() => {
                                    document.getElementById(
                                      `check${index}`,
                                    ).style.color = "white";
                                    document.getElementById(
                                      `check${index}`,
                                    ).style.boxShadow = "none";
                                  }}
                                  style={{ cursor: "pointer", color: "white" }}
                                  role="button"
                                  size={icon_size / 2}
                                  onClick={async () => {
                                    await fetchAcceptNotification(
                                      notifications[index].username,
                                    );
                                    setNotifications(
                                      notifications.filter(
                                        (el, i) => i !== index,
                                      ),
                                    );
                                  }}
                                />
                            }
                                
                                <XSquare
                                  id={`X${index}`}
                                  onMouseOver={() => {
                                    document.getElementById(
                                      `X${index}`,
                                    ).style.color = "red";
                                    document.getElementById(
                                      `X${index}`,
                                    ).style.boxShadow = "0px 0px 15px 2px red";
                                  }}
                                  onMouseOut={() => {
                                    document.getElementById(
                                      `X${index}`,
                                    ).style.color = "white";
                                    document.getElementById(
                                      `X${index}`,
                                    ).style.boxShadow = "none";
                                  }}
                                  style={{
                                    marginLeft: "2vw",
                                    cursor: "pointer",
                                    color: "white",
                                  }}
                                  role="button"
                                  size={icon_size / 2}
                                  onClick={async () =>
                                    await deleteNotification(index, el.content)
                                  }
                                />
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown style={{ marginLeft: "100px", marginTop: "-40px" }}>
                <Dropdown.Toggle
                  as="div"
                  role="button"
                  style={{ marginRight: "10vw", cursor: "pointer" }}
                >
                  <Shuffle size={icon_size / 3.3} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    as="div"
                    role="button"
                    onClick={() => {
                      setShowCamera(true), setShowModal(true);
                    }}
                  >
                    <Camera2 size={icon_size / 3} />
                    <span> scatta una foto</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as="div"
                    role="button"
                    onClick={() => setShowModal(true)}
                  >
                    <FontAwesomeIcon
                      icon={faImages}
                      style={{ color: "white" }}
                    />
                    <ImageVideo
                      setImageServer={setImageServer}
                      username={props.data.username}
                      selectedResource={selectedResource}
                      setSelectedResource={setSelectedResource}
                      setPlaceholderNewMessage={undefined}
                      type_msg="image/*"
                      name_type_msg=" carica una foto"
                      setIsVideo={undefined}
                    />
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </>
          </Col>

          <Col style={{ display: "flex", marginTop: "30px" }}>
            {role === "mod" && (
              <Button
                onClick={() => window.location.replace("/mod")}
                style={{ fontSize: `${fontSize}` }}
                variant="outline-primary"
              >
                <ClipboardData /> vai a mod app
              </Button>
            )}

            {role === "smm" && (
              <Button
                onClick={() => window.location.replace("/smm/")}
                style={{ fontSize: `${fontSize}` }}
                variant="outline-primary"
              >
                <ClipboardData /> vai a smm app
              </Button>
            )}
          </Col>

          <Col style={{ marginTop: "30px" }}>
            <Button
              style={{ marginRight: "2vw", fontSize: `${fontSize}` }}
              variant="outline-success"
              onClick={() => setShowMQ(true)}
            >
              {" "}
              <FontAwesomeIcon icon={faWallet} /> compra quota
            </Button>
          </Col>
        </Row>
      </div>

      <div style={{ overflowY: "auto" }}>
        <div
          style={{
            marginTop: "1vh",
            marginLeft: "2vw",
            fontSize: `${fontSize}`,
          }}
        >
          <Row>
            <Col>
              <Person size={icon_size / 3} /> {props.data.username}
            </Col>
          </Row>
          <Row>
            <Col>
              <Book size={icon_size / 3} /> <strong>{bio}</strong>
            </Col>
          </Row>
          <Row>
            <Col>
              <Envelope size={icon_size / 3} /> <strong>{email}</strong>
            </Col>
          </Row>
          {role === "vip" && (
            <Row>
              <Col>
                {ssm === "" ? (
                  <Button
                    style={{
                      marginTop: "10px",
                      marginBottom: "10px",
                      marginLeft: "10px",
                    }}
                    onClick={() => setShowMSMM(true)}
                    variant="outline-primary"
                  >
                    scegli smm
                  </Button>
                ) : (
                  <>
                    <span>
                      <PersonWorkspace size={icon_size / 3} />{" "}
                      <strong>{ssm}</strong> é il mio social media manager{" "}
                    </span>
                  </>
                )}
              </Col>

              {ssm !== "" && (
                <Col>
                  <Button
                    style={{ marginLeft: "10px" }}
                    onClick={() => setShowMSMM(true)}
                    variant="outline-primary"
                  >
                    gestisci smm
                  </Button>
                </Col>
              )}
            </Row>
          )}
          <Row>
            <Col>
              {" "}
              <Calendar4Event size={icon_size / 3} /> quota residua giornaliera{" "}
              {quota[giornaliera]}
            </Col>
          </Row>
          <Row>
            <Col>
              {" "}
              <Calendar4 size={icon_size / 3} /> quota residua settimanale{" "}
              {quota[settimanale]}
            </Col>
          </Row>
          <Row>
            <Col>
              {" "}
              <Calendar size={icon_size / 3} /> quota residua mensile{" "}
              {quota[mensile]}
            </Col>
          </Row>
          <Row>
            <Col xs={1} sm={1}>
              <DropdownFollowing
                fontSize={fontSize}
                page={followingPage}
                setPage={setFollowingPage}
                myRole={undefined}
                following={following}
              />
            </Col>
          </Row>
          <Row>
            <Col xs={1} sm={1}>
              <DropdownFollowing
                fontSize={fontSize}
                page={followerPage}
                setPage={setFollowerPage}
                myRole={undefined}
                is_followers={true}
                following={follower}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: "20px" }}>
            <Col>
              <Button
                style={{ fontSize: `${fontSize}` }}
                variant="secondary"
                onClick={() => setShowModalEditProfile(true)}
              >
                {" "}
                <Pencil size={icon_size / 3} /> modifica informazioni profilo
              </Button>
            </Col>
            <Col>
              {role === "user" && (
                <Button
                  onClick={() => setShowMVip(true)}
                  variant="outline-success"
                >
                  compra o rinnova stato vip
                </Button>
              )}
            </Col>
          </Row>
        </div>
        <hr />
        <div>
          <div style={{ marginLeft: "5vw", marginRight: "5vw" }}>
            <FloatingLabel
              style={{
                marginLeft: `${width > 900 ? "100px" : "1px"}`,
                marginRight: `${width > 900 ? "100px" : "1px"}`,
                fontSize: "17px",
              }}
              controlId="floatingSelect1"
              label="Ordina post"
            >
              <Form.Select
                id="floatingSelect1"
                onChange={(e) => {
                  handleSelect(e);
                }}
                aria-label="Floating label select example"
              >
                <option>dal piú nuovo</option>
                <option value="dal piú vecchio">dal piú vecchio</option>
                <option value="popolari">popolari</option>
                <option value="impopolari">impopolari</option>
                <option value="controversi">controversi</option>
              </Form.Select>
            </FloatingLabel>
          </div>
          {!hidePosts && (
            <>
              {posts.map((element, index) => {
                return (
                  <Post
                    _id={element._id}
                    location={element.location}
                    deletePost={deletePost}
                    index={index}
                    is_profile={true}
                    key={Math.random()}
                    url_img_channel={element.url_img_channel}
                    username_channel={element.username_channel}
                    username_sender={element.username_sender}
                    url_img_sender={element.url_img_sender}
                    time={element.time}
                    url_profile_img={url_profile_img}
                    isDeletable={isDeletable}
                    ownUsername={props.data.username}
                    views={element.views}
                    is_public={element.is_public}
                    type_msg={element.type_msg}
                    attachment={element.attachment}
                    msg={element.msg}
                    popularity={element.popularity}
                    reactions={element.reactions}
                    userReaction={element.userReaction}
                    references={element.references}
                  />
                );
              })}
            </>
          )}
          {isLoadingPosts ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "150px",
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
                marginBottom: `${props.footerHeight}px`,
                marginRight: "10px",
                marginLeft: "10px",
              }}
            >
              <Button
                size="sm"
                style={{ fontSize: `${fontSize}` }}
                disabled={pagePosts <= 1}
                variant="primary"
                onClick={async () => {
                  setPosts([]);
                  setIsLoadingPosts(true);
                  await new Promise((resolve) => setTimeout(resolve, 400));
                  setPagePosts((prevValue) => {
                    return prevValue - 1;
                  });
                  setRefreshPage((prevValue) => {
                    return !prevValue;
                  });
                }}
              >
                pagina precedente
              </Button>
              <Button
                size="sm"
                style={{ fontSize: `${fontSize}` }}
                disabled={posts.length === 0}
                variant="primary"
                onClick={async () => {
                  setPosts([]);
                  setIsLoadingPosts(true);
                  await new Promise((resolve) => setTimeout(resolve, 400));
                  setPagePosts((prevValue) => {
                    return prevValue + 1;
                  });
                  setRefreshPage((prevValue) => {
                    return !prevValue;
                  });
                }}
              >
                pagina successiva
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Profile;
