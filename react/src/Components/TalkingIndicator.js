import React, {useEffect, useRef} from "react";
import { styled } from "@mui/material/styles";
import {useTheme} from "@mui/material";

const TalkingIndicatorWrapper = styled("div")(({ isVisible, borderColor }) => ({
    borderColor: borderColor,
    display: isVisible ? "block" : "none",
    border: "2px solid",
    position: "absolute",
    height: "100%",
    width: "100%",
    pointerEvents: "none",
    zIndex: 2,
}));

const TalkingIndicator = (props) => {
    const theme = useTheme();
    const timeoutRef = useRef(null);
    const [isTalking, setIsTalking] = React.useState(false);

    useEffect(() => {
        if (props?.trackAssignment.isMine && props?.isPublished && !props?.isPlayOnly) {
            props?.setAudioLevelListener((value) => {
                // sounds under 0.01 are probably background noise
                if (value >= 0.01) {
                    if (isTalking === false) setIsTalking(true);
                    clearInterval(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        setIsTalking(false);
                    }, 1500);
                }
            }, 1000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props?.isPublished]);

    const isVisible = isTalking || (props?.talkers && props?.talkers.includes(props?.streamId));

    return <TalkingIndicatorWrapper isVisible={isVisible} borderColor={theme.palette.themeColor[20]} />;
};

export default TalkingIndicator;
