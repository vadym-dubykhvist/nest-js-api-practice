import type { CSSProperties } from 'react';

/**
 * Avatar: the user's image when set, otherwise their initials. `className`
 * carries size/shape/background (e.g. "h-9 w-9 rounded-full bg-elevated") and
 * `textClassName` sizes the initials. Used everywhere a user/author shows up.
 */
export function Avatar({
  username,
  image,
  className,
  textClassName,
  style,
}: {
  username: string;
  image?: string | null;
  className?: string;
  textClassName?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden font-bold uppercase ${textClassName ?? ''} ${className ?? ''}`}
      style={style}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- user avatar, possibly external
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        username.slice(0, 2)
      )}
    </span>
  );
}
