import Icons from '../styles/sprite.svg';
export const SvgIcon = ({ name, color, size, viewBox }) => {
  return (
    <svg width={size} viewBox={viewBox ? viewBox : '0 0 1000 500'} fill={color}>
      <use href={Icons + `#${name}`} />
    </svg>
  );
};
