import Icons from '../styles/sprite.svg'
export const SvgIcon = ({ name, color, size }) => {
    return (
      <svg width={size} viewBox="0 0 1000 500" fill={color}>
        <use href={Icons + `#${name}`} />
      </svg>
    )
   }