import { func } from "prop-types";
import {getUrlParameter} from "./antmedia/fetch.stream";

export function urlify(text) {
    if (!text) {
        return null;
    }
    var urlRegex =
        /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    const parts = text.split(urlRegex);
    for (var i = 1; i < parts.length; i += 2) {
        let hasExternalLink = parts[i].startsWith('https://') || parts[i].startsWith('http://');

        if (!hasExternalLink) {
            let externalizedLink = 'https://' + parts[i];
            parts[i] = (
                <a href={externalizedLink} key={i} target="_blank" rel="noreferrer">
                    {parts[i].length > 60 ? parts[i].slice(0, 55) + '...' : parts[i]}
                </a>
            );
        } else {
            parts[i] = (
                <a href={parts[i]} key={i} target="_blank" rel="noreferrer">
                    {parts[i].length > 60 ? parts[i].slice(0, 55) + '...' : parts[i]}
                </a>
            );
        }
    }
    return parts;
}

export function getRoomNameAttribute() {
    // if it returns data-room-name element, it means that we are using conference app in component mode
   return getUrlParameter("roomName");//document.getElementById("root").getAttribute("data-room-name");
 }

 export function getWebSocketURLAttribute() {
     //if it exists, it means it is in component mode
     return document.getElementById("root").getAttribute("data-websocket-url")
 }

 export function getRootAttribute(attribute) {
  if (attribute == "data-room-name") {
    return getUrlParameter("roomName")
  }
   return document.getElementById("root").getAttribute(attribute);
 }
