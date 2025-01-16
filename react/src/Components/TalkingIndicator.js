import React, { useEffect, useRef, useState } from "react";
import { styled } from "@mui/material/styles";
import { useTheme } from "@mui/material";

const TalkingIndicatorWrapper = styled("div")(({ isVisible, borderColor, id }) => ({
    borderColor: borderColor,
    color: borderColor,
    display: isVisible ? "block" : "none",
    border: "2px solid",
    position: "absolute",
    height: "100%",
    width: "100%",
    pointerEvents: "none",
    zIndex: 2,
    borderRadius: "8px",
    id: id,
}));

const TalkingIndicator = (props) => {
    const theme = useTheme();
    const timeoutRef = useRef(null);
    const [isTalking, setIsTalking] = useState(false);
    const [localTalkers, setLocalTalkers] = useState([]);

    useEffect(() => {
        // Monitor updates to talkers using polling or callbacks
        const interval = setInterval(() => {
            if (!props.talkers.current) return;
            const updatedTalkers = props.talkers.current || [];
            if (JSON.stringify(updatedTalkers) !== JSON.stringify(localTalkers)) {
                setLocalTalkers(updatedTalkers);
            }
        }, 1000); // Poll every 1000ms

        return () => clearInterval(interval);
    }, [props.talkers, localTalkers]);

    useEffect(() => {
        if (props?.trackAssignment.isMine && props?.isPublished && !props?.isPlayOnly) {
            props?.setAudioLevelListener((value) => {
                // sounds under 0.01 are probably background noise
                if (value >= 0.01) {
                    if (!isTalking) setIsTalking(true);
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        setIsTalking(false);
                    }, 1500);
                }
            }, 1000);
        }
        // eslint-disable-next-line
    }, [props?.isPublished]);

    const isVisible = isTalking || (localTalkers && localTalkers.includes(props?.streamId));

    return <TalkingIndicatorWrapper isVisible={isVisible} borderColor={theme.palette.themeColor?.[20]} id={props?.streamId+"-is-talking"} />;
};

export default TalkingIndicator;
