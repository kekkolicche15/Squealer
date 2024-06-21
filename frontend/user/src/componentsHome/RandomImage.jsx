import { random_image_api_key, createFileFromBlob } from "../Const.js";

function RandomImage(props) {
  const fetchRandomImage = async () => {
    const response = await fetch(
      `https://api.unsplash.com/photos/random/?client_id=${random_image_api_key}`,
    );
    const data = await response.json();
    fetch(data.urls.regular)
      .then((response) => response.blob())
      .then((blob) => {
        props.setImageServer(createFileFromBlob(blob));
      });
    if (props.setIsGeo) props.setIsGeo(false);
    props.setSelectedResource(data.urls.regular);
    if (props.setPlaceholderNewMessage)
      props.setPlaceholderNewMessage("aggiungi una descrizione all'immagine");
  };

  return (
    <span onClick={() => fetchRandomImage()}> genera immagine casuale</span>
  );
}
export default RandomImage;
