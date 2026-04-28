import React from 'react';

function Image({
 src,
 alt = "Image Name",
 className = "",
 ...props
}) {

 return (
  <img
   src={src}
   alt={alt}
   className={className}
   onError={(e) => {
    e.target.src = "/assets/images/no_image.webp"
   }}
   {...props}
  />
 );
}

export default Image;
