import React, {StyleSheet, Dimensions, PixelRatio} from "react-native";
const {width, height, scale} = Dimensions.get("window"),
    vw = width / 100,
    vh = height / 100,
    vmin = Math.min(vw, vh),
    vmax = Math.max(vw, vh);

export default StyleSheet.create({
    "body": {
        "lineHeight": 1.5,
        "paddingTop": 120,
        "paddingRight": 10,
        "paddingBottom": 120,
        "paddingLeft": 10,
        "backgroundImage": "url(../img/sky.jpg)",
        "backgroundPosition": "center center",
        "backgroundRepeat": "no-repeat",
        "backgroundAttachment": "fixed",
        "backgroundSize": "cover",
        "backgroundColor": "#add8e6"
    },
    "lichat": {
        "background": "#ffffff",
        "marginBottom": 5,
        "listStyle": "none",
        "paddingTop": 10,
        "paddingRight": 10,
        "paddingBottom": 10,
        "paddingLeft": 10,
        "position": "relative",
        "borderRadius": 10,
        "WebkitBorderRadius": 10,
        "MozBorderRadius": 10
    },
    "lipat0": {
        "color": "#800000"
    },
    "lipat1": {
        "color": "#000080"
    },
    "lipat2": {},
    "lipat3": {
        "fontWeight": "bold"
    },
    "lipat3:hover": {
        "background": "#ffff00"
    },
    "lipat4": {
        "color": "#008000"
    },
    "lipat5": {
        "background": "#000000",
        "color": "#ffffff"
    },
    "lipat6": {
        "background": "#000000",
        "color": "#ffff00"
    },
    "divmodalbox": {
        "opacity": 0
    },
    "divank": {
        "paddingTop": "15%"
    },
    "buttonankbuttons": {
        "height": 150
    },
    "buttonankbuttonl": {
        "height": 200
    },
    "textarea": {
        "position": "fixed"
    }
});