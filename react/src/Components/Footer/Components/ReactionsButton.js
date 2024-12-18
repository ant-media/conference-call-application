import React from 'react';
import { SvgIcon } from '../../SvgIcon';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {CustomizedBtn} from "../../CustomizedBtn";

export const roundStyle = {
  width: { xs: 36, md: 46 },
  height: { xs: 36, md: 46 },
  minWidth: 'unset',
  maxWidth: { xs: 36, md: 46 },
  maxHeight: { xs: 36, md: 46 },
  borderRadius: '50%',
  padding: '4px',
};

function ReactionsButton(props) {
  const { rounded, footer, showEmojis, setShowEmojis } = props;
  const { t } = useTranslation();

  return (
    <>
        <Tooltip title={t('Emoji reactions')} placement="top">
          <CustomizedBtn className={footer ? 'footer-icon-button' : ''} variant="contained" color={showEmojis ? 'primary' :'secondary'} sx={rounded ? roundStyle : {}} onClick={(e) => { setShowEmojis(!showEmojis) }}>
            <SvgIcon size={40} name={'smiley-face'} color={showEmojis ? "#000" : "#fff"} />
          </CustomizedBtn>
        </Tooltip>
    </>
  );
}

export default ReactionsButton;
