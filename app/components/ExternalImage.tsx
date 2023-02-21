import Image from "next/image";
import { MouseEventHandler, useState } from "react";
import { Property } from '../node_modules/csstype/index';

interface Props {
    url: string,
    width: string,
    height: string,
    priority?: boolean
}

const ExternalImage = ({ url, width, height, priority = false }: Props) => {
    const [ objectFit, setObjectFit ] = useState<Property.ObjectFit>('contain');

    return (
        <div style={{position: 'relative', width, height}}>
            <Image 
                src={url}
                alt="Carousel image" 
                style={{objectFit: objectFit}}
                priority={priority}
                fill
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 40vw, 20vw"
                onLoadingComplete={({naturalWidth, naturalHeight}) => {
                    if (naturalWidth > naturalHeight) {
                        setObjectFit('cover');
                    }
                }} />
        </div>
    );
};

export default ExternalImage