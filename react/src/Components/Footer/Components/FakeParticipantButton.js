import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

const CustomizedBtn = styled(Button)(({ theme }) => ({
    "&.footer-icon-button": {
        height: "100%",
        [theme.breakpoints.down("sm")]: {
            padding: 8,
            minWidth: "unset",
            width: "100%",
            "& > svg": {
                width: 36,
            },
        },
    },
}));

function FakeParticipantButton({ footer, increment, onAction }) {
    const { t } = useTranslation();

    return (
        <Tooltip
            title={t((increment ? "Add" : "Remove") + " Fake Participant")}
            placement="top"
        >
            <CustomizedBtn
                onClick={onAction}
                variant="contained"
                className={footer ? "footer-icon-button" : ""}
                color="secondary"
            >
                {increment ? "+" : "-"}
            </CustomizedBtn>
        </Tooltip>
    );
}

export default FakeParticipantButton;
