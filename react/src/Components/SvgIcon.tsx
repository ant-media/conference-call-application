import React from 'react';
const Icons = require('../styles/sprite.svg') as string;

interface SvgIconProps {
    name: string;
    color: string;
    size: string | number;
    viewBox?: string;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ name, color, size, viewBox }) => {
    return (
        <svg width={size} viewBox={viewBox ? viewBox : '0 0 1000 500'} fill={color}>
            <use href={Icons + `#${name}`} />
        </svg>
    );
};
