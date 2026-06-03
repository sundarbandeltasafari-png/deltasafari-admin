"use client"
import React, { useRef } from 'react'
import { Player } from '@lottiefiles/react-lottie-player';

function LottieReactComponent({ path, height=300, width=300 }) {
    const ref = useRef()
    return (
        <>
            <Player
                ref={ref} // set the ref to your class instance
                autoplay={true}
                loop={true}
                controls={true}
                src={path}
                style={{ height: height+'px', width: width+'px' }}
            ></Player>
        </>
    )
}

export default LottieReactComponent